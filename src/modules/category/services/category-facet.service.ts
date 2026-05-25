import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { Facet } from "@modules/facets/entities/facet.entity";
import { Category } from "../entities/category.entity";
import { CategoryFacet } from "../entities/category-facet.entity";
import {
    AddFacetsToCategoryDto,
    UpdateCategoryFacetDto,
} from "../dtos/category-facet.dto";

@Injectable()
export class CategoryFacetService {
    constructor(
        @InjectRepository(CategoryFacet)
        private readonly categoryFacetRepo: EntityRepository<CategoryFacet>,
        @InjectRepository(Category)
        private readonly categoryRepo: EntityRepository<Category>,
        @InjectRepository(Facet)
        private readonly facetRepo: EntityRepository<Facet>,
        private readonly em: EntityManager,
    ) {}

    private async ensureCategoryExists(categoryId: number): Promise<Category> {
        const category = await this.categoryRepo.findOne({
            id: categoryId,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (!category) {
            throw new NotFoundException(`Không tìm thấy category #${categoryId}`);
        }
        return category;
    }

    /**
     * GET facets đã gắn vào category (kèm thông tin Facet đầy đủ).
     */
    async findByCategory(categoryId: number) {
        await this.ensureCategoryExists(categoryId);

        const items = await this.categoryFacetRepo.find(
            {
                categoryId,
                deleted: DeletedEnum.AVAILABLE,
            },
            {
                populate: ["facet"],
                orderBy: { displayOrder: QueryOrder.ASC, facetId: QueryOrder.ASC },
            },
        );

        return items;
    }

    /**
     * POST bulk add nhiều facet vào category.
     * - Bỏ qua các facet đã gắn (đã tồn tại record AVAILABLE).
     * - Nếu pair đã từng bị soft-delete → restore + cập nhật config mới.
     */
    async addFacets(categoryId: number, dto: AddFacetsToCategoryDto) {
        await this.ensureCategoryExists(categoryId);

        if (!dto.items?.length) {
            return { success: 0, created: 0, restored: 0, skipped: 0, items: [] };
        }

        // Dedup theo facetId
        const itemsByFacetId = new Map<number, (typeof dto.items)[number]>();
        for (const item of dto.items) {
            if (!itemsByFacetId.has(item.facetId)) {
                itemsByFacetId.set(item.facetId, item);
            }
        }
        const facetIds = [...itemsByFacetId.keys()];

        // Validate facets tồn tại
        const validFacets = await this.facetRepo.find(
            {
                id: { $in: facetIds },
                deleted: DeletedEnum.AVAILABLE,
            },
            { fields: ["id"] },
        );
        const validFacetIds = new Set(validFacets.map((f) => f.id));
        const invalidIds = facetIds.filter((id) => !validFacetIds.has(id));
        if (invalidIds.length > 0) {
            throw new BadRequestException(
                `Không tìm thấy facets với id: ${invalidIds.join(", ")}`,
            );
        }

        // Load existing pairs (cả AVAILABLE lẫn DELETED) để restore khi cần
        const existing = await this.categoryFacetRepo.find({
            categoryId,
            facetId: { $in: facetIds },
        });
        const existingByFacetId = new Map<number, CategoryFacet>();
        for (const cf of existing) {
            existingByFacetId.set(cf.facetId, cf);
        }

        const created: CategoryFacet[] = [];
        const restored: CategoryFacet[] = [];
        let skipped = 0;

        await this.em.transactional(async (em) => {
            for (const [facetId, item] of itemsByFacetId.entries()) {
                const existingCF = existingByFacetId.get(facetId);

                if (existingCF) {
                    if (existingCF.deleted === DeletedEnum.AVAILABLE) {
                        skipped++;
                        continue;
                    }
                    // Restore + cập nhật config
                    wrap(existingCF).assign({
                        deleted: DeletedEnum.AVAILABLE,
                        displayOrder: item.displayOrder ?? 0,
                        isVisible: item.isVisible ?? true,
                        status: item.status ?? StatusCommonEnum.ACTIVE,
                    });
                    restored.push(existingCF);
                    continue;
                }

                const cf = em.create(CategoryFacet, {
                    categoryId,
                    facetId,
                    displayOrder: item.displayOrder ?? 0,
                    isVisible: item.isVisible ?? true,
                    status: item.status ?? StatusCommonEnum.ACTIVE,
                    deleted: DeletedEnum.AVAILABLE,
                });
                em.persist(cf);
                created.push(cf);
            }

            await em.flush();
        });

        return {
            success: created.length + restored.length,
            created: created.length,
            restored: restored.length,
            skipped,
            items: [...created, ...restored],
        };
    }

    /**
     * PATCH cập nhật mapping (displayOrder / isVisible / status).
     */
    async updateMapping(
        categoryId: number,
        facetId: number,
        dto: UpdateCategoryFacetDto,
    ): Promise<CategoryFacet> {
        const cf = await this.categoryFacetRepo.findOne({
            categoryId,
            facetId,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (!cf) {
            throw new NotFoundException(
                `Không tìm thấy mapping facet #${facetId} cho category #${categoryId}`,
            );
        }

        wrap(cf).assign(dto, { mergeObjectProperties: true });
        await this.em.flush();
        return cf;
    }

    /**
     * DELETE soft-delete mapping.
     */
    async removeFacet(categoryId: number, facetId: number): Promise<void> {
        const cf = await this.categoryFacetRepo.findOne({
            categoryId,
            facetId,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (!cf) {
            throw new NotFoundException(
                `Không tìm thấy mapping facet #${facetId} cho category #${categoryId}`,
            );
        }

        wrap(cf).assign({ deleted: DeletedEnum.DELETED });
        await this.em.flush();
    }
}
