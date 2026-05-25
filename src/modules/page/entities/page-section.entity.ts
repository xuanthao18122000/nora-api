import {
    Collection,
    Entity,
    Enum,
    ManyToOne,
    OneToMany,
    PrimaryKey,
    Property,
    type Opt,
} from "@mikro-orm/core";
import { StatusCommonEnum } from "@common/enums";
import { Page } from "./page.entity";
import { PageSectionItem } from "./page-section-item.entity";

@Entity({ tableName: "page_sections" })
export class PageSection {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property({ length: 255, nullable: true, comment: "Tên section (admin tự đặt)" })
    name?: string;

    @Property({
        length: 255,
        nullable: true,
        comment: "Khoá định danh — FE dùng để map component (vd hero_banner, layout_menu)",
    })
    key?: string;

    @ManyToOne(() => Page, {
        deleteRule: "cascade",
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "pageId",
    })
    page!: Page;

    @OneToMany(() => PageSectionItem, (item) => item.section)
    items = new Collection<PageSectionItem>(this);

    @Property({ length: 255, comment: "Loại section (vd banner, product, text, faq, link_item)" })
    type!: string;

    @Property({ type: "json", nullable: true, comment: "Schema/config riêng của section" })
    extra?: Record<string, unknown>;

    @Property({ length: 255, nullable: true })
    url?: string;

    @Property({ default: 0 })
    position: number & Opt = 0;

    @Enum({ items: () => StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    status: StatusCommonEnum & Opt = StatusCommonEnum.ACTIVE;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
