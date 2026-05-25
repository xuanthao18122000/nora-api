import {
    Collection,
    Entity,
    Enum,
    OneToMany,
    PrimaryKey,
    Property,
    type Opt,
} from "@mikro-orm/core";
import { DeletedEnum, FacetTypeEnum, StatusCommonEnum } from "@common/enums";
import { FacetValue } from "./facet-value.entity";

@Entity({ tableName: "facets" })
export class Facet {
    @PrimaryKey({
        type: "int",
        unsigned: true,
        autoincrement: true,
        comment: "ID của facet",
    })
    id!: number;

    @Property({
        type: "varchar",
        length: 100,
        comment: "Khóa duy nhất: ram, storage, chipset, usage_need",
    })
    key!: string;

    @Property({
        type: "varchar",
        length: 255,
        comment: "Nhãn hiển thị: Dung lượng RAM, Bộ nhớ trong",
    })
    label!: string;

    @Property({
        type: "int",
        default: 0,
        comment: "Thứ tự hiển thị",
    })
    displayOrder: number & Opt = 0;

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

    @Enum({
        items: () => FacetTypeEnum,
        default: FacetTypeEnum.MULTI_SELECT,
        comment: "Loại facet: 1=SINGLE_SELECT, 2=MULTI_SELECT, 3=RANGE, 4=BOOLEAN",
    })
    type: FacetTypeEnum & Opt = FacetTypeEnum.MULTI_SELECT;

    @Property({ type: "int", nullable: true, comment: "Người tạo" })
    userCreated?: number;

    @Property({ type: "int", nullable: true, comment: "Người cập nhật" })
    userUpdated?: number;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();

    @OneToMany(() => FacetValue, (facetValue) => facetValue.facet)
    facetValues = new Collection<FacetValue>(this);
}
