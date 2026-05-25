import { raw } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { Category } from "@modules/category/entities/category.entity";
import { PageCodeEnum } from "@modules/page/enums/page.enum";
import { PageService } from "@modules/page/services/page.service";
import { Post } from "@modules/post/entities/post.entity";
import { PostList } from "@modules/post/entities/post-list.entity";
import { Product } from "@modules/product/entities/product.entity";
import { SlugTypeEnum } from "../enums";
import { SlugService } from "./slug.service";

/**
 * Resolve trả luôn detail entity tương ứng để FE chỉ cần 1 round-trip.
 * Chỉ field khớp `type` được populate; các field còn lại = null.
 */
export interface SlugResolveResult {
    type: SlugTypeEnum;
    entityId: number | string;
    slug: string;
    page: Record<string, unknown> | null;
    product: Record<string, unknown> | null;
    category: Record<string, unknown> | null;
    post: Record<string, unknown> | null;
    postList: Record<string, unknown> | null;
}

@Injectable()
export class SlugResolveService {
    private readonly logger = new Logger(SlugResolveService.name);

    constructor(
        private readonly em: EntityManager,
        private readonly slugService: SlugService,
        private readonly pageService: PageService,
    ) { }

    /**
     * Storefront entry — `GET /fe/resolve?slug=xxx`.
     *
     * - Slug rỗng / `home` / `home-page` → trả full home page (sections + items).
     * - Slug khác → lookup bảng `slugs` → fetch detail entity tương ứng kèm relations:
     *     + PRODUCT  → kèm brand + productCategories.category
     *     + CATEGORY → kèm parent
     *     + POST     → flat
     *     + PAGE     → kèm sections + items
     */
    async resolveSlug(rawSlug: string): Promise<SlugResolveResult> {
        console.log({ rawSlug });
        let slug = (rawSlug || "").replace(/^\/+|\/+$/g, "").trim();
        if (slug.endsWith(".html")) slug = slug.slice(0, -5);

        const empty = {
            page: null,
            product: null,
            category: null,
            post: null,
            postList: null,
        };

        const slugRecord = await this.slugService.findBySlug(slug);

        if (!slugRecord) {
            throw new NotFoundException(`Slug "${slug}" không tồn tại`);
        }

        // Homepage
        if (slug === "home" || slug === "home-page") {
            const page = await this.pageService.findByCode(PageCodeEnum.HOME_PAGE);
            if (!page) throw new NotFoundException(`Trang chủ chưa được cấu hình`);
            return {
                ...empty,
                type: SlugTypeEnum.PAGE,
                entityId: (page as { id: string | number }).id,
                slug: String((page as { slug: string }).slug),
                page: page as Record<string, unknown>,
            };
        }

        const base = {
            type: slugRecord.type,
            entityId: slugRecord.entityId,
            slug: slugRecord.slug,
            ...empty,
        };

        switch (slugRecord.type) {
            case SlugTypeEnum.PRODUCT: {
                const product = await this.em.findOne(
                    Product,
                    {
                        id: Number(slugRecord.entityId),
                        deleted: DeletedEnum.AVAILABLE,
                    },
                    {
                        populate: [
                            "brand",
                            "productCategories",
                            "productCategories.category",
                        ],
                    },
                );
                if (!product) throw new NotFoundException(`Sản phẩm không tồn tại`);
                return {
                    ...base,
                    product: product as unknown as Record<string, unknown>,
                };
            }

            case SlugTypeEnum.CATEGORY: {
                const category = await this.em.findOne(
                    Category,
                    {
                        id: Number(slugRecord.entityId),
                        deleted: DeletedEnum.AVAILABLE,
                    },
                    { populate: ["parent"] },
                );
                if (!category) throw new NotFoundException(`Danh mục không tồn tại`);

                // Children (cấp con trực tiếp)
                const children = await this.em.find(
                    Category,
                    {
                        parent: category.id,
                        deleted: DeletedEnum.AVAILABLE,
                    },
                    { orderBy: { position: "ASC", id: "ASC" } },
                );

                // Siblings (cùng cấp) — dùng khi danh mục không có con
                const parentId = category.parent?.id ?? null;
                const siblings = await this.em.find(
                    Category,
                    {
                        parent: parentId ?? null,
                        deleted: DeletedEnum.AVAILABLE,
                    },
                    { orderBy: { position: "ASC", id: "ASC" } },
                );

                // Breadcrumbs: walk up parent chain
                const breadcrumbs: Array<{
                    id: number;
                    name: string;
                    slug: string;
                }> = [];
                let cursor: Category | undefined = category;
                while (cursor) {
                    breadcrumbs.unshift({
                        id: cursor.id,
                        name: cursor.name,
                        slug: cursor.slug,
                    });
                    if (!cursor.parent) break;
                    cursor = await this.em.findOne(Category, {
                        id: cursor.parent.id,
                        deleted: DeletedEnum.AVAILABLE,
                    }) ?? undefined;
                }

                const mapMini = (c: Category) => ({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    iconUrl: c.iconUrl ?? null,
                    thumbnailUrl: c.thumbnailUrl ?? null,
                });

                return {
                    ...base,
                    category: {
                        ...(category as unknown as Record<string, unknown>),
                        children: children.map(mapMini),
                        siblings: siblings
                            .filter((s) => s.id !== category.id)
                            .map(mapMini),
                        breadcrumbs,
                    },
                };
            }

            case SlugTypeEnum.POST: {
                const post = await this.em.findOne(Post, {
                    id: Number(slugRecord.entityId),
                    deleted: DeletedEnum.AVAILABLE,
                    status: StatusCommonEnum.ACTIVE,
                });
                if (!post) throw new NotFoundException(`Bài viết không tồn tại`);

                await this.em.nativeUpdate(
                    Post,
                    { id: post.id },
                    { views: raw("views + 1") },
                );
                post.views = (post.views ?? 0) + 1;

                return {
                    ...base,
                    post: post as unknown as Record<string, unknown>,
                };
            }

            case SlugTypeEnum.POST_LIST: {
                const postList = await this.em.findOne(PostList, {
                    id: Number(slugRecord.entityId),
                    deleted: DeletedEnum.AVAILABLE,
                });
                if (!postList) {
                    throw new NotFoundException(`Danh sách bài viết không tồn tại`);
                }
                return {
                    ...base,
                    postList: postList as unknown as Record<string, unknown>,
                };
            }

            case SlugTypeEnum.PAGE: {
                const page = await this.pageService.findBySlug(slug);
                if (!page) throw new NotFoundException(`Page "${slug}" không tồn tại`);
                return {
                    ...base,
                    page: page as unknown as Record<string, unknown>,
                };
            }

            default:
                throw new NotFoundException(`Slug type không hỗ trợ`);
        }
    }
}
