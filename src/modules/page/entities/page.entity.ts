import {
    Collection,
    Entity,
    Enum,
    OneToMany,
    PrimaryKey,
    Property,
    type Opt,
} from "@mikro-orm/core";
import { randomUUID } from "crypto";
import { StatusCommonEnum } from "@common/enums";
import { PageTypeEnum } from "../enums";
import { PageSection } from "./page-section.entity";

@Entity({ tableName: "pages" })
export class Page {
    @PrimaryKey({ type: "uuid" })
    id: string = randomUUID();

    @Property({ length: 255, unique: true, comment: "Slug, vd 'khuyen-mai-tet'" })
    slug!: string;

    @Property({ length: 255, nullable: true, comment: "Mã code, vd 'home_page'" })
    code?: string;

    @Enum({ items: () => PageTypeEnum, comment: "custom | system" })
    type!: PageTypeEnum;

    @Property({ length: 255, nullable: true })
    title?: string;

    @Enum({ items: () => StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    status: StatusCommonEnum & Opt = StatusCommonEnum.ACTIVE;

    @Property({ type: "json", nullable: true, comment: "Cấu hình trang (banner, redirect, form...)" })
    pageData?: Record<string, unknown>;

    // SEO
    @Property({ length: 255, nullable: true })
    metaTitle?: string;

    @Property({ type: "text", nullable: true })
    metaDescription?: string;

    @Property({ length: 255, nullable: true })
    seoImage?: string;

    @Property({ type: "text", nullable: true })
    canonicalUrl?: string;

    @Property({ length: 255, nullable: true })
    seoKeywords?: string;

    @Property({ type: "json", nullable: true })
    seoBaseSchema?: Record<string, unknown>;

    @Property({ default: false })
    isSitemap: boolean & Opt = false;

    @Property({ length: 50, default: "noindex,nofollow" })
    seoRobots: string & Opt = "noindex,nofollow";

    @Property({ type: "text", nullable: true })
    description?: string;

    @OneToMany(() => PageSection, (section) => section.page)
    sections = new Collection<PageSection>(this);

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
