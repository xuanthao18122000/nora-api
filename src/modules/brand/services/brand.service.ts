import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { DeletedEnum } from "@common/enums";
import { paginatedResponse, toSlug } from "@common/helpers";
import { Brand } from "../entities/brand.entity";
import { CreateBrandDto } from "../dtos/create-brand.dto";
import { UpdateBrandDto } from "../dtos/update-brand.dto";
import { ListBrandDto } from "../dtos/query-brand.dto";

@Injectable()
export class BrandService {
    constructor(
        @InjectRepository(Brand)
        private readonly brandRepo: EntityRepository<Brand>,
        private readonly em: EntityManager,
    ) {}

    async create(dto: CreateBrandDto): Promise<Brand> {
        const slug = dto.slug?.trim() || toSlug(dto.name);
        await this.assertSlugAvailable(slug);

        const brand = this.brandRepo.create({ ...dto, slug });
        await this.em.persist(brand).flush();
        return brand;
    }

    async findAll(query: ListBrandDto) {
        const qb = this.em
            .createQueryBuilder(Brand, "brand")
            .fSetQuery(query)
            .fOnlyActive()
            .fAndWhereLike("name", query.searchName)
            .fAndWhere("status")
            .fAndWhereDateRange("createdAt", query.createdAtFrom, query.createdAtTo)
            .fAndWhereDateRange("updatedAt", query.updatedAtFrom, query.updatedAtTo)
            .fAddPagination()
            .fAddOrderBy({ id: QueryOrder.DESC });

        const [items, total] = await qb.getResultAndCount();
        return paginatedResponse(items, total, query);
    }

    async findBySlug(slug: string) {
        return this.brandRepo.findOne({ slug, deleted: DeletedEnum.AVAILABLE });
    }

    async findOne(id: number) {
        const brand = await this.em.findOne(
            Brand,
            { id, deleted: DeletedEnum.AVAILABLE },
            {
                fields: [
                    "id",
                    "name",
                    "slug",
                    "logoUrl",
                    "description",
                    "priority",
                    "metaTitle",
                    "metaDescription",
                    "status",
                    "deleted",
                    "createdAt",
                    "updatedAt",
                ],
            },
        );
        if (!brand) throw new NotFoundException(`Brand #${id} không tồn tại`);
        return brand;
    }

    async update(id: number, dto: UpdateBrandDto) {
        const brand = await this.findOne(id);

        if (dto.slug && dto.slug !== brand.slug) {
            await this.assertSlugAvailable(dto.slug, id);
        }

        wrap(brand).assign(dto, { mergeObjectProperties: true });
        await this.em.flush();
        return brand;
    }

    async remove(id: number): Promise<void> {
        const brand = await this.findOne(id);
        wrap(brand).assign({ deleted: DeletedEnum.DELETED });
        await this.em.flush();
    }

    private async assertSlugAvailable(slug: string, excludeId?: number) {
        const existed = await this.brandRepo.findOne({ slug, deleted: DeletedEnum.AVAILABLE });
        if (existed && existed.id !== excludeId) {
            throw new BadRequestException(`Slug "${slug}" đã tồn tại`);
        }
    }
}
