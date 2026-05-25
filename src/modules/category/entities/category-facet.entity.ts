import {
    Entity,
    Enum,
    ManyToOne,
    PrimaryKey,
    PrimaryKeyProp,
    Property,
    Ref,
    type Opt,
} from "@mikro-orm/core";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { Facet } from "@modules/facets/entities/facet.entity";
import { Category } from "./category.entity";

/**
 * Pivot M:N giữa `Category` và `Facet`.
 * Whitelist facet áp dụng cho category, kèm displayOrder + isVisible.
 * Composite PK [categoryId, facetId] đã đảm bảo uniqueness.
 */
@Entity({ tableName: "category_facets" })
export class CategoryFacet {
    [PrimaryKeyProp]?: ["categoryId", "facetId"];

    @PrimaryKey({
        type: "int",
        unsigned: true,
        comment: "ID của category",
    })
    categoryId!: number;

    @PrimaryKey({
        type: "int",
        unsigned: true,
        comment: "ID của facet",
    })
    facetId!: number;

    @Property({
        type: "int",
        default: 0,
        comment: "Thứ tự hiển thị facet trong category",
    })
    displayOrder: number & Opt = 0;

    @Property({
        type: "boolean",
        default: true,
        comment: "Bật/tắt facet trong category: true=visible, false=hidden",
    })
    isVisible: boolean & Opt = true;

    @Enum({
        items: () => StatusCommonEnum,
        default: StatusCommonEnum.ACTIVE,
        comment: "Trạng thái: 1=ACTIVE, -1=INACTIVE",
    })
    status: StatusCommonEnum & Opt = StatusCommonEnum.ACTIVE;

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
    @ManyToOne(() => Category, {
        createForeignKeyConstraint: false,
        ref: true,
        persist: false,
        fieldName: "categoryId",
    })
    category!: Ref<Category> & Opt;

    @ManyToOne(() => Facet, {
        createForeignKeyConstraint: false,
        ref: true,
        persist: false,
        fieldName: "facetId",
    })
    facet!: Ref<Facet> & Opt;
}
