import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { paginatedResponse } from "@common/helpers";
import { Facet } from "../entities/facet.entity";
import { FacetValue } from "../entities/facet-value.entity";
import { CreateFacetValueDto } from "../dtos/create-facet-value.dto";
import { UpdateFacetValueDto } from "../dtos/update-facet-value.dto";
import { ListFacetValueDto } from "../dtos/query-facet-value.dto";

@Injectable()
export class FacetValueService {
    constructor(
        @InjectRepository(Facet)
        private readonly facetRepo: EntityRepository<Facet>,
        @InjectRepository(FacetValue)
        private readonly facetValueRepo: EntityRepository<FacetValue>,
        private readonly em: EntityManager,
    ) {}

    async create(facetId: number, dto: CreateFacetValueDto): Promise<FacetValue> {
        // Verify facet exists
        const facet = await this.facetRepo.findOne({
            id: facetId,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (!facet) {
            throw new NotFoundException(`Không tìm thấy bộ lọc với id ${facetId}`);
        }

        // Check if key already exists for this facet
        const existing = await this.facetValueRepo.findOne({
            facetId,
            key: dto.key,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (existing) {
            throw new BadRequestException(
                `Giá trị bộ lọc với key "${dto.key}" đã tồn tại cho bộ lọc này`,
            );
        }

        const facetValue = this.facetValueRepo.create({
            facetId,
            key: dto.key,
            label: dto.label,
            icon: dto.icon,
            meta: dto.meta,
            status: dto.status ?? StatusCommonEnum.ACTIVE,
            deleted: DeletedEnum.AVAILABLE,
        });

        await this.em.persist(facetValue).flush();
        return facetValue;
    }

    async findByFacetId(facetId: number, query: ListFacetValueDto) {
        const qb = this.em
            .createQueryBuilder(FacetValue, "fv")
            .fSetQuery(query)
            .fAndWhere("facetId", facetId)
            .fOnlyActive()
            .fAndWhere("status");

        if (query.search) {
            qb.fAndWhereLikeAny(["key", "label"], query.search);
        }

        qb.fAddPagination(query.page, query.limit, query.getFull).fAddOrderBy({
            id: QueryOrder.ASC,
        });

        const [facetValues, total] = await qb.getResultAndCount();
        return paginatedResponse(facetValues, total, query);
    }

    async findOne(id: number): Promise<FacetValue> {
        const facetValue = await this.facetValueRepo.findOne({
            id,
            deleted: DeletedEnum.AVAILABLE,
        });

        if (!facetValue) {
            throw new NotFoundException(`Không tìm thấy giá trị bộ lọc với id ${id}`);
        }

        return facetValue;
    }

    async update(facetId: number, id: number, dto: UpdateFacetValueDto): Promise<FacetValue> {
        const facetValue = await this.facetValueRepo.findOne({
            id,
            facetId,
            deleted: DeletedEnum.AVAILABLE,
        });

        if (!facetValue) {
            throw new NotFoundException(`Không tìm thấy giá trị bộ lọc với id ${id}`);
        }

        wrap(facetValue).assign(dto);
        await this.em.flush();
        return facetValue;
    }

    async remove(facetId: number, id: number): Promise<FacetValue> {
        const facetValue = await this.facetValueRepo.findOne({
            id,
            facetId,
            deleted: DeletedEnum.AVAILABLE,
        });

        if (!facetValue) {
            throw new NotFoundException(`Không tìm thấy giá trị bộ lọc với id ${id}`);
        }

        wrap(facetValue).assign({ deleted: DeletedEnum.DELETED });
        await this.em.flush();
        return facetValue;
    }
}
