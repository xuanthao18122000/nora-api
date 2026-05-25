import {
    Entity,
    Enum,
    ManyToOne,
    PrimaryKey,
    Property,
    type Opt,
} from "@mikro-orm/core";
import { StatusCommonEnum } from "@common/enums";
import { DeviceTypeEnum } from "../enums";
import { PageSection } from "./page-section.entity";

@Entity({ tableName: "page_section_items" })
export class PageSectionItem {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @ManyToOne(() => PageSection, {
        fieldName: "pageSectionId",
        deleteRule: "cascade",
        index: false,
        createForeignKeyConstraint: false,
    })
    section!: PageSection;

    @Enum({ items: () => DeviceTypeEnum, default: DeviceTypeEnum.ALL })
    deviceType: DeviceTypeEnum & Opt = DeviceTypeEnum.ALL;

    @Property({ length: 255, nullable: true })
    name?: string;

    @Property({ length: 500, nullable: true, comment: "URL đích khi click item" })
    targetUrl?: string;

    @Property({ length: 255, nullable: true, comment: "Loại item (vd banner, list_products, link)" })
    type?: string;

    @Property({ default: 0 })
    position: number & Opt = 0;

    @Property({ type: "text", nullable: true, comment: "Dữ liệu (string, có thể là JSON stringified)" })
    data?: string;

    @Property({ type: "json", nullable: true, comment: "Cấu hình mở rộng" })
    extra?: Record<string, unknown>;

    @Enum({ items: () => StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    status: StatusCommonEnum & Opt = StatusCommonEnum.ACTIVE;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
