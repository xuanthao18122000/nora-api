import { EntityRepository, QueryOrder, raw, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import { forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { paginatedResponse } from "@common/helpers";
import { PageService } from "@modules/page/services/page.service";
import { SlugService } from "@modules/slug/services/slug.service";
import { SlugTypeEnum } from "@modules/slug/enums";
import { Post } from "../entities/post.entity";
import { CreatePostDto } from "../dtos/create-post.dto";
import { UpdatePostDto } from "../dtos/update-post.dto";
import { ListPostDto } from "../dtos/query-post.dto";
import { BulkUpsertPostsDto } from "../dtos/bulk-upsert-post.dto";

@Injectable()
export class PostService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepo: EntityRepository<Post>,
        private readonly em: EntityManager,
        private readonly slugService: SlugService,
        @Inject(forwardRef(() => PageService))
        private readonly pageService: PageService,
    ) {}

    /**
     * Invalidate page cache cho mọi trang có news section trỏ vào postList của
     * post vừa thay đổi. Chạy fire-and-forget để không block response.
     */
    private async invalidatePagesAfterPostChange(
        postListId: number | null | undefined,
    ): Promise<void> {
        await this.pageService.invalidatePagesByPostList(postListId).catch(() => {
            // ignore — cache invalidation best-effort
        });
    }

    async create(dto: CreatePostDto): Promise<Post> {
        const { slug: customSlug, ...rest } = dto;

        const post = this.postRepo.create({
            ...rest,
            slug: "",
        });
        await this.em.persist(post).flush();

        post.slug = await this.slugService.create({
            raw: dto.title,
            custom: customSlug,
            type: SlugTypeEnum.POST,
            entityId: post.id,
        });
        await this.em.flush();
        await this.invalidatePagesAfterPostChange(dto.postListId ?? null);
        return post;
    }

    async findAll(query: ListPostDto) {
        console.log('query', query);
        const qb = this.em
            .createQueryBuilder(Post, "post")
            .fSetQuery(query)
            .fOnlyActive()
            .fAndWhereLike("title")
            .fAndWhereLike("slug")
            .fAndWhere("authorId")
            .fAndWhere("postListId", query.postListId)
            .fAndWhere("status", StatusCommonEnum.ACTIVE)
            .fAndWhereDateRange("createdAt", query.createdAtFrom, query.createdAtTo)
            .fAndWhereDateRange("updatedAt", query.updatedAtFrom, query.updatedAtTo)
            .fAddPagination()
            .fAddOrderBy({ id: QueryOrder.DESC });

        // Tìm kiếm theo title / shortDescription / content (LIKE).
        const searchTerm = query.search?.trim();
        if (searchTerm) {
            const like = `%${searchTerm}%`;
            qb.andWhere({
                $or: [
                    { title: { $like: like } },
                    { shortDescription: { $like: like } },
                    { content: { $like: like } },
                ],
            });
        }

        const [items, total] = await qb.getResultAndCount();
        console.log('items', items);
        if (items.length > 0) {
            await this.em.populate(items, ["postList"]);
        }
        return paginatedResponse(items, total, query);
    }

    async findBySlug(slug: string) {
        const post = await this.postRepo.findOne({
            slug,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (!post) return null;

        if (post.status === StatusCommonEnum.ACTIVE) {
          console.log('increment views');
            await this.em.nativeUpdate(
                Post,
                { id: post.id },
                { views: raw("views + 1") },
            );
            post.views = (post.views ?? 0) + 1;
        }

        return post;
    }

    async findOne(id: number) {
        const post = await this.postRepo.findOne(
            { id, deleted: DeletedEnum.AVAILABLE },
            { populate: ["postList"] },
        );
        if (!post) throw new NotFoundException(`Post #${id} không tồn tại`);
        return post;
    }

    async update(id: number, dto: UpdatePostDto) {
        const post = await this.findOne(id);
        const previousPostListId = post.postListId ?? null;

        if (dto.slug || dto.title) {
            post.slug = await this.slugService.update({
                raw: dto.title ?? post.title,
                custom: dto.slug,
                type: SlugTypeEnum.POST,
                entityId: post.id,
            });
        }

        const { slug: _s, ...rest } = dto;
        wrap(post).assign(rest, { mergeObjectProperties: true });
        await this.em.flush();

        // Invalidate cả postList cũ (nếu post chuyển nhóm) lẫn mới.
        await this.invalidatePagesAfterPostChange(previousPostListId);
        const newPostListId = post.postListId ?? null;
        if (newPostListId !== previousPostListId) {
            await this.invalidatePagesAfterPostChange(newPostListId);
        }
        return post;
    }

    async remove(id: number): Promise<void> {
        const post = await this.findOne(id);
        const postListId = post.postList?.id ?? null;
        wrap(post).assign({ deleted: DeletedEnum.DELETED });
        await this.em.flush();
        // Xoá luôn record trong bảng `slugs` để slug được tái dùng
        await this.slugService.remove(SlugTypeEnum.POST, id);
        await this.invalidatePagesAfterPostChange(postListId);
    }

    async incrementViews(slug: string) {
        // Atomic UPDATE để tránh race condition; không load entity rồi assign+flush.
        await this.em.nativeUpdate(
            Post,
            {
                slug,
                deleted: DeletedEnum.AVAILABLE,
                status: StatusCommonEnum.ACTIVE,
            },
            { views: raw("views + 1") },
        );
    }

    /**
     * Bulk upsert: match theo `slug` (nếu FE truyền), không có thì insert mới.
     * - Slug đã tồn tại (cùng slug, deleted = AVAILABLE) → update các field hợp lệ.
     * - Slug chưa có hoặc không truyền → create mới qua `create()` để
     *   slug-service tự sinh & đảm bảo unique.
     *
     * Trả về { created, updated } counts.
     */
    async bulkUpsert(
        dto: BulkUpsertPostsDto,
    ): Promise<{ created: number; updated: number }> {
        const items = [
          ] as any;
        if (!items.length) return { created: 0, updated: 0 };

        const slugsToCheck = items
            .map((it) => it.slug?.trim())
            .filter((s): s is string => Boolean(s));

        const existingPosts = slugsToCheck.length
            ? await this.postRepo.find({
                  slug: { $in: slugsToCheck },
                  deleted: DeletedEnum.AVAILABLE,
              })
            : [];
        const existingMap = new Map(existingPosts.map((p) => [p.slug, p]));

        let created = 0;
        let updated = 0;
        const affectedPostListIds = new Set<number | null>();

        for (const raw of items) {
            const slug = raw.slug?.trim();
            const existing = slug ? existingMap.get(slug) : undefined;

            // Bỏ field thừa từ JSON dump (id, category, author, createdAt,
            // updatedAt, createdBy, updatedBy) để không assign nhầm vào entity.
            const { id: _id, category: _c, author: _a, createdAt: _ca, updatedAt: _ua, createdBy: _cb, updatedBy: _ub, ...rest } = raw;

            if (existing) {
                affectedPostListIds.add(existing.postListId ?? null);
                wrap(existing).assign(rest, { mergeObjectProperties: true });
                affectedPostListIds.add(existing.postListId ?? null);

                // Update slug nếu FE truyền slug hoặc title đổi.
                if (rest.slug || (rest.title && rest.title !== existing.title)) {
                    existing.slug = await this.slugService.update({
                        raw: rest.title ?? existing.title,
                        custom: rest.slug,
                        type: SlugTypeEnum.POST,
                        entityId: existing.id,
                    });
                }
                updated += 1;
            } else {
                await this.create(rest);
                affectedPostListIds.add(rest.postListId ?? null);
                created += 1;
            }
        }

        await this.em.flush();

        // Invalidate cache cho mọi postList bị ảnh hưởng (1 lần / id duy nhất).
        await Promise.all(
            Array.from(affectedPostListIds).map((id) =>
                this.invalidatePagesAfterPostChange(id),
            ),
        );

        return { created, updated };
    }
}
