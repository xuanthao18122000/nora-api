import {
    Entity,
    Enum,
    ManyToOne,
    PrimaryKey,
    Property,
    Ref,
    type Opt,
} from "@mikro-orm/core";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { Facet } from "./facet.entity";

@Entity({ tableName: "facet_values" })
export class FacetValue {
    @PrimaryKey({
        type: "int",
        unsigned: true,
        autoincrement: true,
        comment: "ID của facet value",
    })
    id!: number;

    @Property({
        type: "int",
        unsigned: true,
        comment: "ID của facet",
    })
    facetId!: number;

    @Property({
        type: "varchar",
        length: 100,
        comment: "Khóa: gaming, 8gb, snapdragon",
    })
    key!: string;

    @Property({
        type: "varchar",
        length: 255,
        comment: "Nhãn hiển thị: Chơi game, 8 GB, Snapdragon",
    })
    label!: string;

    @Property({
        type: "varchar",
        length: 255,
        nullable: true,
        comment: "Icon URL hoặc emoji",
    })
    icon?: string;

    @Property({
        type: "json",
        nullable: true,
        comment: 'Metadata JSON: {"hex":"#FF0000","image":"url"}',
    })
    meta?: Record<string, unknown>;

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

    @ManyToOne(() => Facet, {
        createForeignKeyConstraint: false,
        ref: true,
        persist: false,
        fieldName: "facetId",
    })
    facet!: Ref<Facet> & Opt;
}
