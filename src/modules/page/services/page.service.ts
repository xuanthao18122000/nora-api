import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import {
    DeletedEnum,
    RedisKeyEnum,
    RedisTtlEnum,
    StatusCommonEnum,
} from "@common/enums";
import { paginatedResponse } from "@common/helpers";
import { RedisService } from "@modules/redis/redis.service";
import { Product } from "../../product/entities/product.entity";
import { Post } from "../../post/entities/post.entity";
import { Page } from "../entities/page.entity";
import { PageSection } from "../entities/page-section.entity";
import { PageSectionItem } from "../entities/page-section-item.entity";
import { CreatePageDto } from "../dtos/pages/create-page.dto";
import { UpdatePageDto } from "../dtos/pages/update-page.dto";
import { ListPageDto } from "../dtos/pages/list-page.dto";

@Injectable()
export class PageService {
    private readonly logger = new Logger(PageService.name);

    constructor(
        @InjectRepository(Page)
        private readonly pageRepo: EntityRepository<Page>,
        private readonly em: EntityManager,
        private readonly redis: RedisService,
    ) {}

    /** Clear cache page theo code. Called on update/remove. */
    async invalidateCacheByCode(code: string | null | undefined) {
        if (!code) return;
        await this.redis.del(RedisKeyEnum.PAGE_BY_CODE(code));
        this.logger.debug(`[PageCache] cleared key=${RedisKeyEnum.PAGE_BY_CODE(code)}`);
    }

    /** Clear cache page theo id (lookup code rồi del Redis). Trả về code đã clear. */
    async clearCacheById(id: string): Promise<{ code: string | null; cleared: boolean }> {
        const page = await this.em.findOne(Page, { id }, { fields: ["id", "code"] as never[] });
        if (!page) throw new NotFoundException(`Page #${id} không tồn tại`);
        await this.invalidateCacheByCode(page.code);
        return { code: page.code ?? null, cleared: Boolean(page.code) };
    }

    /**
     * Invalidate cache cho mọi page có news section auto trỏ vào `postListId`.
     * Gọi khi Post create/update/remove để trang chủ (và các page khác render
     * news từ postList này) cập nhật bài mới.
     *
     * Nếu `postListId` null/undefined → quét tất cả page có news section
     * (manual mode hoặc auto không gắn postList).
     */
    async invalidatePagesByPostList(
        postListId: number | null | undefined,
    ): Promise<void> {
        // Lấy unique code của các page có ít nhất 1 section.key = 'news'
        // matching postListId trong extra (auto mode) — hoặc bất kỳ news section
        // nào (manual mode).
        const sections = await this.em.find(
            PageSection,
            { key: "news" },
            { populate: ["page"], fields: ["id", "extra", "page.code"] as never[] },
        );
        const codes = new Set<string>();
        for (const s of sections) {
            const extra = (s.extra ?? {}) as {
                mode?: string;
                postListId?: number | string;
            };
            const isAuto = extra.mode !== "manual";
            if (isAuto && postListId !== null && postListId !== undefined) {
                if (Number(extra.postListId) !== Number(postListId)) continue;
            }
            const code = (s.page as unknown as { code?: string })?.code;
            if (code) codes.add(code);
        }
        await Promise.all(
            Array.from(codes).map((c) => this.invalidateCacheByCode(c)),
        );
    }

    async create(dto: CreatePageDto): Promise<Page> {
        await this.assertSlugAvailable(dto.slug);
        if (dto.code) await this.assertCodeAvailable(dto.code);

        const page = this.pageRepo.create(dto);
        await this.em.persist(page).flush();
        return page;
    }

    async findAll(query: ListPageDto) {
        const qb = this.em
            .createQueryBuilder(Page, "page")
            .fSetQuery(query)
            .fAndWhereLike("title")
            .fAndWhereLike("slug")
            .fAndWhereLike("code")
            .fAndWhere("type")
            .fAndWhere("status")
            .fAndWhereDateRange("createdAt", query.createdAtFrom, query.createdAtTo)
            .fAndWhereDateRange("updatedAt", query.updatedAtFrom, query.updatedAtTo)
            .fAddPagination()
            .fAddOrderBy({ createdAt: QueryOrder.DESC });

        const [items, total] = await qb.getResultAndCount();
        return paginatedResponse(items, total, query);
    }

    /** Detail kèm sections + items (sắp xếp theo position). */
    async findOne(id: string) {
        const page = await this.em.findOne(
            Page,
            { id },
            {
                populate: ["sections", "sections.items"],
                orderBy: {
                    sections: { position: QueryOrder.ASC, items: { position: QueryOrder.ASC } },
                },
            },
        );
        if (!page) throw new NotFoundException(`Page #${id} không tồn tại`);
        return page;
    }

    async findBySlug(slug: string) {
        return this.em.findOne(
            Page,
            { slug },
            {
                populate: ["sections", "sections.items"],
                orderBy: {
                    sections: { position: QueryOrder.ASC, items: { position: QueryOrder.ASC } },
                },
            },
        );
    }

    async findByCode(code: string) {
        // Cache check
        const cacheKey = RedisKeyEnum.PAGE_BY_CODE(code);
        const cached = await this.redis.getJSON<Record<string, unknown>>(cacheKey);
        if (cached) return cached;

        const page = await this.em.findOne(
            Page,
            { code },
            {
                populate: ["sections", "sections.items"],
                orderBy: {
                    sections: { position: QueryOrder.ASC, items: { position: QueryOrder.ASC } },
                },
            },
        );
        if (!page) return null;
        await this.enrichItemsWithProducts(page);
        await this.enrichSectionsWithPosts(page);

        // Serialize entity → plain object để cache an toàn (tránh circular ref)
        const serialized = wrap(page).toObject();
        await this.redis.setJSON(cacheKey, serialized, RedisTtlEnum.ONE_DAY).catch((err) => {
            this.logger.warn(`[PageCache] setJSON fail: ${(err as Error).message}`);
        });

        return serialized;
    }

    /**
     * Với section.type === "product", item.data có thể chứa { productId }.
     * Enrich live data (giá, slug, thumbnail) từ DB để FE render đúng giá hiện tại.
     */
    private async enrichItemsWithProducts(page: Page) {
        const productIds = new Set<number>();
        const productItems: PageSectionItem[] = [];

        for (const section of page.sections) {
            if (section.type !== "product") continue;
            for (const item of section.items) {
                if (item.type !== "list_products") continue;
                productItems.push(item);
                if (typeof item.data !== "string") continue;
                try {
                    const data = JSON.parse(item.data) as { productId?: number };
                    if (data.productId) productIds.add(Number(data.productId));
                } catch {
                    // ignore
                }
            }
        }

        if (productIds.size === 0) return;

        const products = await this.em.find(Product, {
            id: { $in: Array.from(productIds) },
            deleted: DeletedEnum.AVAILABLE,
        });
        const productMap = new Map(products.map((p) => [p.id, p]));

        for (const item of productItems) {
            if (typeof item.data !== "string") continue;
            try {
                const data = JSON.parse(item.data) as Record<string, unknown> & {
                    productId?: number;
                };
                if (!data.productId) continue;
                const product = productMap.get(Number(data.productId));
                if (!product) continue;
                const hasSale =
                    product.salePrice != null &&
                    Number(product.salePrice) > 0 &&
                    Number(product.salePrice) < Number(product.price);
                const enriched = {
                    ...data,
                    name: product.name,
                    slug: product.slug,
                    thumbnailUrl: product.thumbnailUrl ?? data.thumbnailUrl ?? null,
                    // Convention thống nhất với CategoryPageProductItem:
                    //   price     = giá gốc (gạch ngang khi có sale)
                    //   salePrice = giá đang bán (null nếu không sale)
                    price: Number(product.price),
                    salePrice: hasSale ? Number(product.salePrice) : null,
                    // Giữ `originalPrice` để component cũ (FlashSale...) vẫn render.
                    originalPrice: Number(product.price),
                    stockQuantity: product.stockQuantity,
                    averageRating: Number(product.averageRating ?? 0),
                    reviewCount: Number(product.reviewCount ?? 0),
                };
                item.data = JSON.stringify(enriched);
            } catch {
                // skip
            }
        }
    }

    /**
     * Với section.key === "news":
     *   extra = { mode: "auto" | "manual", postListId: number, limit: number, cols, rows, ... }
     *   - mode "auto"   → fetch `limit` posts mới nhất WHERE postListId = X.
     *   - mode "manual" → đọc postIds từ items[].data, fetch live data theo IDs đó.
     * Posts (id, title, shortDescription, featuredImage, slug) gắn vào section.extra.posts.
     */
    private async enrichSectionsWithPosts(page: Page) {
        const newsSections: PageSection[] = [];
        const allPostIds = new Set<number>();
        type Plan = {
            section: PageSection;
            mode: "auto" | "manual";
            postListId?: number;
            limit: number;
            postIds?: number[];
        };
        const plans: Plan[] = [];

        for (const section of page.sections) {
            if (section.key !== "news") continue;
            const extra = section.extra ?? {};
            const mode = (extra as { mode?: string }).mode === "manual" ? "manual" : "auto";
            const postListId = Number((extra as { postListId?: unknown }).postListId);
            const limitRaw = Number((extra as { limit?: unknown }).limit);
            const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 4;

            if (mode === "manual") {
                const postIds: number[] = [];
                for (const item of section.items) {
                    if (typeof item.data !== "string") continue;
                    try {
                        const data = JSON.parse(item.data) as { postId?: number };
                        if (data.postId) {
                            postIds.push(Number(data.postId));
                            allPostIds.add(Number(data.postId));
                        }
                    } catch {
                        // ignore
                    }
                }
                if (postIds.length === 0) continue;
                plans.push({ section, mode, postIds, limit });
            } else {
                if (!Number.isFinite(postListId) || postListId <= 0) continue;
                plans.push({ section, mode, postListId, limit });
            }
            newsSections.push(section);
        }

        if (plans.length === 0) return;

        type PostLite = {
            id: number;
            title: string;
            slug: string;
            shortDescription: string | null;
            featuredImage: string | null;
        };
        const POST_FIELDS = ["id", "title", "slug", "shortDescription", "featuredImage"];

        const toLite = (p: unknown): PostLite => {
            const r = p as Record<string, unknown>;
            return {
                id: Number(r.id),
                title: String(r.title ?? ""),
                slug: String(r.slug ?? ""),
                shortDescription: (r.shortDescription as string | null) ?? null,
                featuredImage: (r.featuredImage as string | null) ?? null,
            };
        };

        // Manual: gom toàn bộ postIds để fetch 1 query.
        const manualPostsMap = new Map<number, PostLite>();
        if (allPostIds.size > 0) {
            const rows = await this.em.find(
                Post,
                {
                    id: { $in: Array.from(allPostIds) },
                    deleted: DeletedEnum.AVAILABLE,
                    status: StatusCommonEnum.ACTIVE,
                },
                { fields: POST_FIELDS as never[] },
            );
            for (const r of rows) {
                const lite = toLite(r);
                manualPostsMap.set(lite.id, lite);
            }
        }

        for (const plan of plans) {
            let posts: PostLite[] = [];
            if (plan.mode === "manual" && plan.postIds) {
                posts = plan.postIds
                    .map((id) => manualPostsMap.get(id))
                    .filter((p): p is PostLite => !!p);
            } else if (plan.mode === "auto" && plan.postListId) {
                const rows = await this.em.find(
                    Post,
                    {
                        postList: plan.postListId,
                        deleted: DeletedEnum.AVAILABLE,
                        status: StatusCommonEnum.ACTIVE,
                    },
                    {
                        fields: POST_FIELDS as never[],
                        orderBy: { id: QueryOrder.DESC },
                        limit: plan.limit,
                    },
                );
                posts = rows.map(toLite);
            }

            plan.section.extra = {
                ...(plan.section.extra ?? {}),
                posts: posts.slice(0, plan.limit),
            };
        }
    }

    async update(id: string, dto: UpdatePageDto) {
        const page = await this.findOne(id);
        const oldCode = page.code;

        if (dto.slug && dto.slug !== page.slug) {
            await this.assertSlugAvailable(dto.slug, id);
        }
        if (dto.code && dto.code !== page.code) {
            await this.assertCodeAvailable(dto.code, id);
        }

        wrap(page).assign(dto, { mergeObjectProperties: true });
        await this.em.flush();

        // Clear cache cả code cũ và code mới (nếu rename code)
        await this.invalidateCacheByCode(oldCode);
        if (dto.code && dto.code !== oldCode) {
            await this.invalidateCacheByCode(dto.code);
        }

        return page;
    }

    async remove(id: string): Promise<void> {
        const page = await this.findOne(id);
        const code = page.code;
        // Cascade DB sẽ xoá sections + items qua deleteRule: "cascade"
        await this.em.removeAndFlush(page);
        await this.invalidateCacheByCode(code);
    }

    private async assertSlugAvailable(slug: string, excludeId?: string) {
        const existed = await this.pageRepo.findOne({ slug });
        if (existed && existed.id !== excludeId) {
            throw new BadRequestException(`Slug "${slug}" đã tồn tại`);
        }
    }

    private async assertCodeAvailable(code: string, excludeId?: string) {
        const existed = await this.pageRepo.findOne({ code });
        if (existed && existed.id !== excludeId) {
            throw new BadRequestException(`Code "${code}" đã tồn tại`);
        }
    }
}
