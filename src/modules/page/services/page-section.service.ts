import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Injectable, NotFoundException } from "@nestjs/common";
import { paginatedResponse } from "@common/helpers";
import { Page } from "../entities/page.entity";
import { PageSection } from "../entities/page-section.entity";
import { PageSectionItem } from "../entities/page-section-item.entity";
import { CreatePageSectionDto } from "../dtos/page-sections/create-page-section.dto";
import { UpdatePageSectionDto } from "../dtos/page-sections/update-page-section.dto";
import { ReplaceSectionItemsDto } from "../dtos/page-sections/replace-section-items.dto";
import { ListPageSectionDto } from "../dtos/page-sections/list-page-section.dto";
import { PageService } from "./page.service";

@Injectable()
export class PageSectionService {
    constructor(
        @InjectRepository(PageSection)
        private readonly sectionRepo: EntityRepository<PageSection>,
        @InjectRepository(PageSectionItem)
        private readonly itemRepo: EntityRepository<PageSectionItem>,
        @InjectRepository(Page)
        private readonly pageRepo: EntityRepository<Page>,
        private readonly em: EntityManager,
        private readonly pageService: PageService,
    ) {}


    async create(dto: CreatePageSectionDto): Promise<PageSection> {
        const page = await this.pageRepo.findOne({ id: dto.pageId });
        if (!page) throw new NotFoundException(`Page #${dto.pageId} không tồn tại`);

        const { items, pageId: _p, ...sectionData } = dto;

        const section = this.sectionRepo.create({ ...sectionData, page });
        await this.em.persist(section).flush();

        if (items?.length) {
            for (const itemDto of items) {
                const item = this.itemRepo.create({ ...itemDto, section });
                this.em.persist(item);
            }
            await this.em.flush();
        }

        await this.pageService.invalidateCacheByCode(page.code);
        return this.findOne(section.id);
    }

    async findAll(query: ListPageSectionDto) {
        const qb = this.em
            .createQueryBuilder(PageSection, "section")
            .fSetQuery(query)
            .fAndWhere("type")
            .fAndWhere("key")
            .fAndWhere("status")
            .fAndWhereDateRange("createdAt", query.createdAtFrom, query.createdAtTo)
            .fAndWhereDateRange("updatedAt", query.updatedAtFrom, query.updatedAtTo)
            .fAddPagination()
            .fAddOrderBy({ position: QueryOrder.ASC, id: QueryOrder.ASC });

        if (query.pageId) qb.andWhere({ page: query.pageId });

        const [items, total] = await qb.getResultAndCount();
        if (items.length) {
            await this.em.populate(items, ["items"]);
        }
        return paginatedResponse(items, total, query);
    }

    async findOne(id: number) {
        const section = await this.em.findOne(
            PageSection,
            { id },
            {
                populate: ["items", "page"],
                orderBy: { items: { position: QueryOrder.ASC } },
            },
        );
        if (!section) throw new NotFoundException(`PageSection #${id} không tồn tại`);
        return section;
    }

    async update(id: number, dto: UpdatePageSectionDto) {
        const section = await this.findOne(id);
        wrap(section).assign(dto, { mergeObjectProperties: true });
        await this.em.flush();
        await this.pageService.invalidateCacheByCode(section.page?.code);
        return section;
    }

    /**
     * Thay thế toàn bộ items của section (xoá hết rồi insert lại theo thứ tự DTO).
     * Dùng cho thao tác kéo-thả / sắp xếp lại trong CMS.
     */
    async replaceItems(sectionId: number, dto: ReplaceSectionItemsDto) {
        const section = await this.findOne(sectionId);

        await this.itemRepo.nativeDelete({ section: section.id });

        for (let i = 0; i < dto.items.length; i++) {
            const itemDto = dto.items[i];
            const item = this.itemRepo.create({
                ...itemDto,
                position: itemDto.position ?? i,
                section,
            });
            this.em.persist(item);
        }
        await this.em.flush();
        await this.pageService.invalidateCacheByCode(section.page?.code);
        return this.findOne(sectionId);
    }

    async remove(id: number): Promise<void> {
        const section = await this.findOne(id);
        const code = section.page?.code;
        // Cascade DB xoá luôn items
        await this.em.removeAndFlush(section);
        await this.pageService.invalidateCacheByCode(code);
    }
}
