import { EntityRepository, QueryOrder } from "@mikro-orm/core";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Injectable, Logger } from "@nestjs/common";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { CategoryFacet } from "@modules/category/entities/category-facet.entity";
import { Facet } from "../entities/facet.entity";
import { FacetValue } from "../entities/facet-value.entity";

@Injectable()
export class FacetFEService {
    private readonly logger = new Logger(FacetFEService.name);

    constructor(
        @InjectRepository(Facet)
        private readonly facetRepo: EntityRepository<Facet>,
        @InjectRepository(FacetValue)
        private readonly facetValueRepo: EntityRepository<FacetValue>,
        @InjectRepository(CategoryFacet)
        private readonly categoryFacetRepo: EntityRepository<CategoryFacet>,
    ) {}

    /**
     * Trả danh sách facets cho storefront filter:
     * - Nếu `categoryId` truyền vào: chỉ lấy facets được whitelist trong
     *   `category_facets` (isVisible = true), order theo CategoryFacet.displayOrder
     * - Nếu không: trả tất cả facets active, order theo Facet.displayOrder
     * Mỗi facet kèm facetValues active.
     */
    async list(categoryId?: number): Promise<unknown[]> {
        this.logger.log(
            `[FE/facets] list() called with categoryId=${categoryId ?? "<undefined>"}`,
        );
        let facets: Facet[];

        if (categoryId != null && Number.isFinite(categoryId)) {
            // Lấy mapping category_facets visible
            const mappings = await this.categoryFacetRepo.find(
                {
                    categoryId,
                    isVisible: true,
                    deleted: DeletedEnum.AVAILABLE,
                },
                { orderBy: { displayOrder: QueryOrder.ASC } },
            );
            const facetIds = mappings.map((m) => m.facetId);
            this.logger.log(
                `[FE/facets] category_facets for categoryId=${categoryId}: ${mappings.length} mappings → facetIds=[${facetIds.join(",")}]`,
            );
            if (facetIds.length === 0) {
                this.logger.warn(
                    `[FE/facets] categoryId=${categoryId} có 0 mapping active+visible. Kiểm tra bảng category_facets.`,
                );
                return [];
            }

            const found = await this.facetRepo.find({
                id: { $in: facetIds },
                status: StatusCommonEnum.ACTIVE,
                deleted: DeletedEnum.AVAILABLE,
            });
            this.logger.log(
                `[FE/facets] Facet.find matched ${found.length}/${facetIds.length} (sau filter status=ACTIVE & deleted=AVAILABLE)`,
            );

            // Sort theo thứ tự của mappings (displayOrder của CategoryFacet)
            const order = new Map(facetIds.map((id, idx) => [id, idx]));
            facets = found.sort(
                (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
            );
        } else {
            facets = await this.facetRepo.find(
                {
                    status: StatusCommonEnum.ACTIVE,
                    deleted: DeletedEnum.AVAILABLE,
                },
                {
                    orderBy: { displayOrder: QueryOrder.ASC },
                },
            );
            this.logger.log(
                `[FE/facets] No categoryId → all active facets: ${facets.length}`,
            );
        }

        // Query facet_values trực tiếp theo facetId (không qua relation populate
        // — facet_values.facet có persist:false nên populate không reliable).
        const facetIdList = facets.map((f) => f.id);
        const allValues = facetIdList.length
            ? await this.facetValueRepo.find(
                  {
                      facetId: { $in: facetIdList },
                      status: StatusCommonEnum.ACTIVE,
                      deleted: DeletedEnum.AVAILABLE,
                  },
                  { orderBy: { id: QueryOrder.ASC } },
              )
            : [];

        const valuesByFacetId = new Map<number, FacetValue[]>();
        for (const v of allValues) {
            const arr = valuesByFacetId.get(v.facetId) ?? [];
            arr.push(v);
            valuesByFacetId.set(v.facetId, arr);
        }

        this.logger.log(
            `[FE/facets] FacetValue.find: ${allValues.length} active values for ${facetIdList.length} facets`,
        );
        this.logger.log(
            `[FE/facets] Returning ${facets.length} facets: ${facets
                .map(
                    (f) =>
                        `${f.id}:${f.key}(${(valuesByFacetId.get(f.id) ?? []).length}v)`,
                )
                .join(", ")}`,
        );

        return facets.map((f) => {
            const values = valuesByFacetId.get(f.id) ?? [];
            return {
                id: f.id,
                key: f.key,
                label: f.label,
                displayOrder: f.displayOrder,
                status: f.status,
                facetValues: values.map((v) => ({
                    id: v.id,
                    facetId: v.facetId,
                    key: v.key,
                    label: v.label,
                    icon: v.icon ?? null,
                    status: v.status,
                })),
                facetValuesCount: values.length,
            };
        });
    }
}
