import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { DeletedEnum } from "@common/enums";
import { FacetValue } from "@modules/facets/entities/facet-value.entity";
import { Product } from "../entities/product.entity";
import { ProductFacetValue } from "../entities/product-facet-value.entity";
import { BulkSetProductFacetValuesDto } from "../dtos/bulk-set-product-facet-values.dto";

@Injectable()
export class ProductFacetValueService {
    constructor(
        @InjectRepository(ProductFacetValue)
        private readonly productFacetValueRepo: EntityRepository<ProductFacetValue>,
        @InjectRepository(Product)
        private readonly productRepo: EntityRepository<Product>,
        @InjectRepository(FacetValue)
        private readonly facetValueRepo: EntityRepository<FacetValue>,
        private readonly em: EntityManager,
    ) {}

    private async ensureProductExists(productId: number): Promise<Product> {
        const product = await this.productRepo.findOne({
            id: productId,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (!product) {
            throw new NotFoundException(`Không tìm thấy product #${productId}`);
        }
        return product;
    }

    /**
     * GET danh sách facet values đã gắn cho product (kèm thông tin facetValue + facet).
     */
    async findByProduct(productId: number) {
        await this.ensureProductExists(productId);

        const items = await this.productFacetValueRepo.find(
            {
                productId,
                deleted: DeletedEnum.AVAILABLE,
            },
            {
                populate: ["facetValue", "facetValue.facet"],
                orderBy: { id: QueryOrder.ASC },
            },
        );

        return items;
    }

    /**
     * PUT replace toàn bộ facet values của product.
     * - Soft-delete những mapping hiện tại không còn trong input.
     * - Restore (set deleted=AVAILABLE) hoặc tạo mới những mapping còn thiếu.
     */
    async bulkSet(productId: number, dto: BulkSetProductFacetValuesDto) {
        await this.ensureProductExists(productId);

        // Dedup
        const facetValueIds = [...new Set(dto.facetValueIds ?? [])];

        // Validate facet values tồn tại (nếu có ID nào)
        if (facetValueIds.length > 0) {
            const validFacetValues = await this.facetValueRepo.find(
                {
                    id: { $in: facetValueIds },
                    deleted: DeletedEnum.AVAILABLE,
                },
                { fields: ["id"] },
            );
            const validIdSet = new Set(validFacetValues.map((fv) => fv.id));
            const invalidIds = facetValueIds.filter((id) => !validIdSet.has(id));
            if (invalidIds.length > 0) {
                throw new BadRequestException(
                    `Không tìm thấy facet values với id: ${invalidIds.join(", ")}`,
                );
            }
        }

        const inputSet = new Set(facetValueIds);

        // Load tất cả mapping hiện tại của product (cả AVAILABLE lẫn DELETED) để upsert
        const existing = await this.productFacetValueRepo.find({ productId });

        const existingByValueId = new Map<number, ProductFacetValue>();
        for (const pfv of existing) {
            // Nếu có duplicate (rare), ưu tiên record AVAILABLE
            const current = existingByValueId.get(pfv.facetValueId);
            if (!current || pfv.deleted === DeletedEnum.AVAILABLE) {
                existingByValueId.set(pfv.facetValueId, pfv);
            }
        }

        const created: ProductFacetValue[] = [];
        const restored: ProductFacetValue[] = [];
        const deleted: ProductFacetValue[] = [];

        await this.em.transactional(async (em) => {
            // 1. Soft-delete những record AVAILABLE không còn trong input
            for (const pfv of existing) {
                if (
                    pfv.deleted === DeletedEnum.AVAILABLE &&
                    !inputSet.has(pfv.facetValueId)
                ) {
                    wrap(pfv).assign({ deleted: DeletedEnum.DELETED });
                    deleted.push(pfv);
                }
            }

            // 2. Restore hoặc create cho những input ID
            for (const valueId of facetValueIds) {
                const existingPFV = existingByValueId.get(valueId);

                if (existingPFV) {
                    if (existingPFV.deleted === DeletedEnum.DELETED) {
                        wrap(existingPFV).assign({ deleted: DeletedEnum.AVAILABLE });
                        restored.push(existingPFV);
                    }
                    // Nếu đã AVAILABLE → giữ nguyên, không cần update
                    continue;
                }

                const pfv = em.create(ProductFacetValue, {
                    productId,
                    facetValueId: valueId,
                    deleted: DeletedEnum.AVAILABLE,
                });
                em.persist(pfv);
                created.push(pfv);
            }

            await em.flush();
        });

        return {
            success: created.length + restored.length,
            created: created.length,
            restored: restored.length,
            deleted: deleted.length,
            total: facetValueIds.length,
            results: { created, restored, deleted },
        };
    }

    /**
     * DELETE 1 mapping (optional helper).
     */
    async removeOne(productId: number, facetValueId: number): Promise<void> {
        const pfv = await this.productFacetValueRepo.findOne({
            productId,
            facetValueId,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (!pfv) {
            throw new NotFoundException(
                `Không tìm thấy mapping facet value #${facetValueId} cho product #${productId}`,
            );
        }

        wrap(pfv).assign({ deleted: DeletedEnum.DELETED });
        await this.em.flush();
    }
}
