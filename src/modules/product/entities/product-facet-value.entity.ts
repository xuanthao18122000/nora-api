import {
    Entity,
    Enum,
    ManyToOne,
    PrimaryKey,
    Property,
    Ref,
    Unique,
    type Opt,
} from "@mikro-orm/core";
import { DeletedEnum } from "@common/enums";
import { FacetValue } from "@modules/facets/entities/facet-value.entity";
import { Product } from "./product.entity";

/**
 * Pivot M:N giữa `Product` và `FacetValue`.
 * 1 product có thể có nhiều facet value thuộc cùng 1 facet (e.g. nhiều "Use case"),
 * nên KHÔNG unique theo (productId, facetId) — chỉ unique theo (productId, facetValueId).
 */
@Entity({ tableName: "product_facet_values" })
@Unique({ properties: ["productId", "facetValueId"] })
export class ProductFacetValue {
    @PrimaryKey({
        type: "int",
        unsigned: true,
        autoincrement: true,
        comment: "ID của product facet value",
    })
    id!: number;

    @Property({
        type: "int",
        unsigned: true,
        comment: "ID của product",
    })
    productId!: number;

    @Property({
        type: "int",
        unsigned: true,
        comment: "ID của facet value",
    })
    facetValueId!: number;

    @Enum({
        items: () => DeletedEnum,
        default: DeletedEnum.AVAILABLE,
        comment: "Trạng thái xóa: 0=AVAILABLE, 1=DELETED",
    })
    deleted: DeletedEnum & Opt = DeletedEnum.AVAILABLE;

    @Property({ type: "int", nullable: true, comment: "Người tạo" })
    userCreated?: number;

    @Property({ type: "int", nullable: true, comment: "Người cập nhật" })
    userUpdated?: number;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();

    /** Relations */
    @ManyToOne(() => Product, {
        createForeignKeyConstraint: false,
        ref: true,
        persist: false,
        fieldName: "productId",
    })
    product!: Ref<Product> & Opt;

    @ManyToOne(() => FacetValue, {
        createForeignKeyConstraint: false,
        ref: true,
        persist: false,
        fieldName: "facetValueId",
    })
    facetValue!: Ref<FacetValue> & Opt;
}
