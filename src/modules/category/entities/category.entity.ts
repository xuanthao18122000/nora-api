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
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { ProductCategory } from "../../product/entities/product-category.entity";

@Entity({ tableName: "categories" })
export class Category {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property({ length: 255 })
    name!: string;

    @Property({ length: 255, comment: "Denormalized; uniqueness enforced bởi bảng slugs" })
    slug!: string;

    @Property({ type: "text", nullable: true })
    description?: string;

    @Property({ length: 500, default: "" })
    idPath: string & Opt = "";

    @Property({ default: 0 })
    priority: number & Opt = 0;

    @Property({ default: 0, comment: "Vị trí sắp xếp (số nhỏ hiển thị trước)" })
    position: number & Opt = 0;

    @Property({ length: 500, nullable: true })
    iconUrl?: string;

    @Property({ length: 500, nullable: true })
    thumbnailUrl?: string;

    @Property({ length: 500, nullable: true })
    canonicalUrl?: string;

    @Property({ default: 0, comment: "Level 0 = root" })
    level: number & Opt = 0;

    @Property({ length: 255, nullable: true })
    metaTitle?: string;

    @Property({ type: "text", nullable: true })
    metaDescription?: string;

    @Property({ length: 500, nullable: true })
    metaKeywords?: string;

    @Property({ length: 50, default: "noindex,nofollow" })
    metaRobots: string & Opt = "noindex,nofollow";

    @Property({ type: "json", nullable: true })
    seoBaseSchema?: Record<string, unknown>;

    @Enum({ items: () => StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    status: StatusCommonEnum & Opt = StatusCommonEnum.ACTIVE;

    @Enum({ items: () => DeletedEnum, default: DeletedEnum.AVAILABLE })
    deleted: DeletedEnum & Opt = DeletedEnum.AVAILABLE;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();

    @ManyToOne(() => Category, {
        nullable: true,
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "parentId",
    })
    parent?: Category;

    @OneToMany(() => Category, (c) => c.parent)
    children = new Collection<Category>(this);

    @OneToMany(() => ProductCategory, (pc) => pc.category)
    productCategories = new Collection<ProductCategory>(this);
}
