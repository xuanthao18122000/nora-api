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
import { Brand } from "../../brand/entities/brand.entity";
import { ProductCategory } from "./product-category.entity";

@Entity({ tableName: "products" })
export class Product {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property({ length: 255 })
    name!: string;

    @Property({ length: 255, comment: "Denormalized; uniqueness enforced bởi bảng slugs" })
    slug!: string;

    @Property({ length: 50, unique: true })
    sku!: string;

    @Property({ length: 500, nullable: true })
    shortDescription?: string;

    @Property({ type: "text", nullable: true })
    description?: string;

    @Property({
        type: "decimal",
        columnType: "decimal(15, 2)",
        default: "0",
    })
    price: string & Opt = "0";

    @Property({
        type: "decimal",
        columnType: "decimal(15, 2)",
        nullable: true,
    })
    salePrice?: string;

    @Property({
        type: "decimal",
        columnType: "decimal(15, 2)",
        default: "0",
    })
    costPrice: string & Opt = "0";

    @Property({ default: 0 })
    stockQuantity: number & Opt = 0;

    @Property({ length: 50, nullable: true })
    unit?: string;

    @Property({ length: 500, nullable: true })
    thumbnailUrl?: string;

    @Property({ type: "json", nullable: true })
    images?: string[];

    @ManyToOne(() => Brand, {
        nullable: true,
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "brandId",
    })
    brand?: Brand;

    @Property({ length: 255, nullable: true })
    origin?: string;

    @Property({ length: 100, nullable: true })
    barcode?: string;

    @Property({ default: 0 })
    priority: number & Opt = 0;

    @Property({ default: 0 })
    viewCount: number & Opt = 0;

    @Property({ default: 0 })
    soldCount: number & Opt = 0;

    @Property({
        type: "decimal",
        columnType: "decimal(3, 2)",
        default: "0",
    })
    averageRating: string & Opt = "0";

    @Property({ default: 0 })
    reviewCount: number & Opt = 0;

    @Property({ default: false })
    isBestSeller: boolean & Opt = false;

    @Property({ default: true })
    showPrice: boolean & Opt = true;

    @Property({ length: 255, nullable: true })
    metaTitle?: string;

    @Property({ type: "text", nullable: true })
    metaDescription?: string;

    @Property({ length: 500, nullable: true })
    metaKeywords?: string;

    @Property({ length: 50, default: "index,follow" })
    metaRobots: string & Opt = "index,follow";

    @Property({ length: 500, nullable: true })
    canonicalUrl?: string;

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

    @OneToMany(() => ProductCategory, (pc) => pc.product)
    productCategories = new Collection<ProductCategory>(this);
}
