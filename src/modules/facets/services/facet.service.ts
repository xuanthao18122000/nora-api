import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DeletedEnum } from "@common/enums";
import { paginatedResponse } from "@common/helpers";
import { Facet } from "../entities/facet.entity";
import { CreateFacetDto } from "../dtos/create-facet.dto";
import { UpdateFacetDto } from "../dtos/update-facet.dto";
import { ListFacetDto } from "../dtos/query-facet.dto";

@Injectable()
export class FacetService {
    constructor(
        @InjectRepository(Facet)
        private readonly facetRepo: EntityRepository<Facet>,
        private readonly em: EntityManager,
    ) {}

    async create(dto: CreateFacetDto): Promise<Facet> {
        // Check if key already exists
        const existing = await this.facetRepo.findOne({
            key: dto.key,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (existing) {
            throw new BadRequestException(`Bộ lọc với key "${dto.key}" đã tồn tại`);
        }

        const facet = this.facetRepo.create({
            key: dto.key,
            label: dto.label,
            displayOrder: dto.displayOrder,
            status: dto.status,
            type: dto.type,
            deleted: DeletedEnum.AVAILABLE,
        });

        await this.em.persist(facet).flush();
        return facet;
    }

    async find(query: ListFacetDto) {
        const qb = this.em
            .createQueryBuilder(Facet, "f")
            .fSetQuery(query)
            .fOnlyActive()
            .fAndWhere("status")
            .fAndWhereDateRange("createdAt", query.createdAtFrom, query.createdAtTo);

        if (query.search) {
            qb.fAndWhereLikeAny(["key", "label"], query.search);
        }

        // Lọc facet "chưa gắn vào category này" (UI add-facets-to-category).
        // Cột thực tế ở DB là camelCase (EntityCaseNamingStrategy):
        // category_facets.facetId, category_facets.categoryId, category_facets.deleted.
        if (query.excludeCategoryId !== undefined && query.excludeCategoryId !== null) {
            qb.andWhere(
                "NOT EXISTS (SELECT 1 FROM category_facets cf " +
                    "WHERE cf.facetId = f.id AND cf.categoryId = ? AND cf.deleted = 0)",
                [query.excludeCategoryId],
            );
        }

        // Lọc facet "được gắn vào ít nhất 1 trong số category này"
        // (UI Product với nhiều category — chỉ load facet áp dụng).
        if (query.categoryIds && query.categoryIds.length > 0) {
            qb.andWhere(
                "EXISTS (SELECT 1 FROM category_facets cf " +
                    "WHERE cf.facetId = f.id AND cf.categoryId IN (?) AND cf.deleted = 0)",
                [query.categoryIds],
            );
        }

        qb.fAddPagination(query.page, query.limit, query.getFull).fAddOrderBy({
            displayOrder: QueryOrder.ASC,
            createdAt: QueryOrder.DESC,
        });

        const [facets, total] = await qb.getResultAndCount();

        if (facets.length === 0) {
            return paginatedResponse([], total, query);
        }

        // Load and sort facetValues in a single populate call
        await this.em.populate(facets, ["facetValues"], {
            where: { facetValues: { deleted: DeletedEnum.AVAILABLE } },
            orderBy: { facetValues: { id: QueryOrder.ASC } },
        });

        const processedFacets = facets.map((facet) => {
            const facetValues = facet.facetValues.getItems();
            return {
                ...facet,
                facetValues,
                facetValuesCount: facetValues.length,
            };
        });

        return paginatedResponse(processedFacets, total, query);
    }

    async findOne(id: number): Promise<Facet> {
        const facet = await this.facetRepo.findOne({
            id,
            deleted: DeletedEnum.AVAILABLE,
        });

        if (!facet) {
            throw new NotFoundException(`Không tìm thấy bộ lọc với id ${id}`);
        }

        return facet;
    }

    async update(id: number, dto: UpdateFacetDto): Promise<Facet> {
        const facet = await this.facetRepo.findOne({
            id,
            deleted: DeletedEnum.AVAILABLE,
        });

        if (!facet) {
            throw new NotFoundException(`Không tìm thấy bộ lọc với id ${id}`);
        }

        wrap(facet).assign(dto);

        await this.em.flush();
        return facet;
    }

    async remove(id: number): Promise<Facet> {
        const facet = await this.facetRepo.findOne({
            id,
            deleted: DeletedEnum.AVAILABLE,
        });

        if (!facet) {
            throw new NotFoundException(`Không tìm thấy bộ lọc với id ${id}`);
        }

        wrap(facet).assign({ deleted: DeletedEnum.DELETED });
        await this.em.flush();
        return facet;
    }
}
