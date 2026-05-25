import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Injectable, NotFoundException } from "@nestjs/common";
import { DeletedEnum } from "@common/enums";
import { paginatedResponse } from "@common/helpers";
import { SlugService } from "@modules/slug/services/slug.service";
import { SlugTypeEnum } from "@modules/slug/enums";
import { PostList } from "../entities/post-list.entity";
import { CreatePostListDto } from "../dtos/create-post-list.dto";
import { UpdatePostListDto } from "../dtos/update-post-list.dto";
import { ListPostListDto } from "../dtos/query-post-list.dto";

@Injectable()
export class PostListService {
    constructor(
        @InjectRepository(PostList)
        private readonly repo: EntityRepository<PostList>,
        private readonly em: EntityManager,
        private readonly slugService: SlugService,
    ) {}

    async create(dto: CreatePostListDto): Promise<PostList> {
        const { slug: customSlug, ...rest } = dto;

        const entity = this.repo.create({ ...rest, slug: "" });
        await this.em.persist(entity).flush();

        entity.slug = await this.slugService.create({
            raw: dto.name,
            custom: customSlug,
            type: SlugTypeEnum.POST_LIST,
            entityId: entity.id,
        });
        await this.em.flush();
        return entity;
    }

    async findAll(query: ListPostListDto) {
        const qb = this.em
            .createQueryBuilder(PostList, "postList")
            .fSetQuery(query)
            .fOnlyActive()
            .fAndWhereLike("name")
            .fAndWhere("status")
            .fAddPagination()
            .fAddOrderBy({ id: QueryOrder.DESC });

        const [items, total] = await qb.getResultAndCount();
        return paginatedResponse(items, total, query);
    }

    async findOne(id: number) {
        const entity = await this.repo.findOne({
            id,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (!entity) throw new NotFoundException(`PostList #${id} không tồn tại`);
        return entity;
    }

    async findBySlug(slug: string) {
        return this.repo.findOne({ slug, deleted: DeletedEnum.AVAILABLE });
    }

    async update(id: number, dto: UpdatePostListDto) {
        const entity = await this.findOne(id);

        if (dto.slug || dto.name) {
            entity.slug = await this.slugService.update({
                raw: dto.name ?? entity.name,
                custom: dto.slug,
                type: SlugTypeEnum.POST_LIST,
                entityId: entity.id,
            });
        }

        const { slug: _s, ...rest } = dto;
        wrap(entity).assign(rest, { mergeObjectProperties: true });
        await this.em.flush();
        return entity;
    }

    async remove(id: number): Promise<void> {
        const entity = await this.findOne(id);
        wrap(entity).assign({ deleted: DeletedEnum.DELETED });
        await this.em.flush();
        await this.slugService.remove(SlugTypeEnum.POST_LIST, id);
    }
}
