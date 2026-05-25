import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import { BadRequestException, Injectable } from "@nestjs/common";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { paginatedResponse, toSlug } from "@common/helpers";
import { Category } from "@modules/category/entities/category.entity";
import { Page } from "@modules/page/entities/page.entity";
import { Post } from "@modules/post/entities/post.entity";
import { PostList } from "@modules/post/entities/post-list.entity";
import { Product } from "@modules/product/entities/product.entity";
import { Slug } from "../entities/slug.entity";
import { SlugTypeEnum } from "../enums";
import { ListSlugDto } from "../dtos/query-slug.dto";

export interface ResolvedEntity {
    type: SlugTypeEnum;
    entityId: number;
    name: string;
    slug?: string;
}

interface CreateSlugInput {
    /** Chuỗi gốc (vd tên product). Sẽ tự convert sang slug. */
    raw: string;
    type: SlugTypeEnum;
    entityId: number;
    /** Slug user truyền sẵn — nếu có sẽ ưu tiên, bỏ qua `raw`. */
    custom?: string;
}

interface UpdateSlugInput {
    type: SlugTypeEnum;
    entityId: number;
    /** Slug mới (đã chuẩn hoá) hoặc raw để tự normalize. */
    raw?: string;
    custom?: string;
}

@Injectable()
export class SlugService {
    constructor(
        @InjectRepository(Slug)
        private readonly slugRepo: EntityRepository<Slug>,
        private readonly em: EntityManager,
    ) {}

    /**
     * Resolve list (type, entityId) → trả về tên/slug entity tương ứng.
     * Batch query — 1 request 1 type, không N+1.
     *
     * Trả về key dạng `<type>:<entityId>` để FE map nhanh.
     */
    async resolveEntities(
        items: { type: SlugTypeEnum; entityId: number }[],
    ): Promise<Record<string, ResolvedEntity>> {
        const result: Record<string, ResolvedEntity> = {};

        const productIds: number[] = [];
        const categoryIds: number[] = [];
        const postIds: number[] = [];
        const postListIds: number[] = [];
        const pageIds: (number | string)[] = [];

        for (const it of items) {
            if (!it.entityId) continue;
            if (it.type === SlugTypeEnum.PRODUCT) productIds.push(it.entityId);
            else if (it.type === SlugTypeEnum.CATEGORY)
                categoryIds.push(it.entityId);
            else if (it.type === SlugTypeEnum.POST) postIds.push(it.entityId);
            else if (it.type === SlugTypeEnum.POST_LIST)
                postListIds.push(it.entityId);
            else if (it.type === SlugTypeEnum.PAGE) pageIds.push(it.entityId);
        }

        if (productIds.length) {
            const rows = await this.em.find(
                Product,
                { id: { $in: productIds }, deleted: DeletedEnum.AVAILABLE },
                { fields: ["id", "name", "slug"] },
            );
            for (const r of rows) {
                result[`${SlugTypeEnum.PRODUCT}:${r.id}`] = {
                    type: SlugTypeEnum.PRODUCT,
                    entityId: r.id,
                    name: r.name,
                    slug: r.slug,
                };
            }
        }
        if (categoryIds.length) {
            const rows = await this.em.find(
                Category,
                { id: { $in: categoryIds }, deleted: DeletedEnum.AVAILABLE },
                { fields: ["id", "name", "slug"] },
            );
            for (const r of rows) {
                result[`${SlugTypeEnum.CATEGORY}:${r.id}`] = {
                    type: SlugTypeEnum.CATEGORY,
                    entityId: r.id,
                    name: r.name,
                    slug: r.slug,
                };
            }
        }
        if (postIds.length) {
            const rows = await this.em.find(
                Post,
                { id: { $in: postIds }, deleted: DeletedEnum.AVAILABLE },
                { fields: ["id", "title", "slug"] },
            );
            for (const r of rows) {
                result[`${SlugTypeEnum.POST}:${r.id}`] = {
                    type: SlugTypeEnum.POST,
                    entityId: r.id,
                    name: r.title,
                    slug: r.slug,
                };
            }
        }
        if (postListIds.length) {
            const rows = await this.em.find(
                PostList,
                { id: { $in: postListIds }, deleted: DeletedEnum.AVAILABLE },
                { fields: ["id", "name", "slug"] },
            );
            for (const r of rows) {
                result[`${SlugTypeEnum.POST_LIST}:${r.id}`] = {
                    type: SlugTypeEnum.POST_LIST,
                    entityId: r.id,
                    name: r.name,
                    slug: r.slug,
                };
            }
        }
        if (pageIds.length) {
            const rows = await this.em.find(
                Page,
                { id: { $in: pageIds as string[] }, status: StatusCommonEnum.ACTIVE },
                { fields: ["id", "title", "slug"] },
            );
            for (const r of rows) {
                result[`${SlugTypeEnum.PAGE}:${r.id}`] = {
                    type: SlugTypeEnum.PAGE,
                    entityId: r.id as unknown as number,
                    name: r.title ?? r.slug,
                    slug: r.slug,
                };
            }
        }

        return result;
    }

    async findAll(query: ListSlugDto) {
        const qb = this.em
            .createQueryBuilder(Slug, "slug")
            .fSetQuery(query)
            .fAndWhereLike("slug")
            .fAndWhere("type")
            .fAndWhere("entityId")
            .fAndWhereDateRange("createdAt", query.createdAtFrom, query.createdAtTo)
            .fAddPagination()
            .fAddOrderBy({ id: QueryOrder.DESC });

        const [items, total] = await qb.getResultAndCount();
        return paginatedResponse(items, total, query);
    }

    /**
     * Tạo slug record mới. Module khác chỉ cần gọi:
     *   const slug = await slugService.create({ raw: dto.name, type: SlugTypeEnum.PRODUCT, entityId: product.id });
     *   product.slug = slug;
     */
    async create(input: CreateSlugInput): Promise<string> {
        const normalized = this.normalize(input.custom, input.raw);
        await this.assertUnique(normalized);

        const slug = this.slugRepo.create({
            slug: normalized,
            type: input.type,
            entityId: input.entityId,
        });
        await this.em.persist(slug).flush();
        return normalized;
    }

    /**
     * Update slug khi entity đổi tên. Tìm record theo (type, entityId), nếu khác thì update.
     * Trả về slug mới (string). Nếu không có record cũ → tạo mới.
     */
    async update(input: UpdateSlugInput): Promise<string> {
        const normalized = this.normalize(input.custom, input.raw);
        const existing = await this.slugRepo.findOne({
            type: input.type,
            entityId: input.entityId,
        });

        if (!existing) {
            return this.create({
                raw: input.raw ?? "",
                custom: normalized,
                type: input.type,
                entityId: input.entityId,
            });
        }

        if (existing.slug === normalized) return normalized;

        await this.assertUnique(normalized);
        wrap(existing).assign({ slug: normalized });
        await this.em.flush();
        return normalized;
    }

    /**
     * Xoá slug khi entity bị xoá cứng. Soft-delete entity thì không cần gọi (giữ slug để route cũ vẫn 404 sạch).
     */
    async remove(type: SlugTypeEnum, entityId: number): Promise<void> {
        await this.slugRepo.nativeDelete({ type, entityId });
    }

    /**
     * Resolve slug → trả về (type, entityId). Storefront dùng để route động `/[slug]`.
     */
    async findBySlug(slug: string) {
        return this.slugRepo.findOne({ slug });
    }

    private normalize(custom: string | undefined, raw: string | undefined): string {
        const result = custom?.trim() ? toSlug(custom) : toSlug(raw ?? "");
        if (!result) throw new BadRequestException("Slug không được để trống");
        return result;
    }

    private async assertUnique(slug: string) {
        const existed = await this.slugRepo.findOne({ slug });
        if (existed) throw new BadRequestException(`Slug "${slug}" đã tồn tại`);
    }
}
