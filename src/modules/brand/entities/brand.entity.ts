import {
    Collection,
    Entity,
    Enum,
    OneToMany,
    PrimaryKey,
    Property,
} from "@mikro-orm/core";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { Product } from "../../product/entities/product.entity";

@Entity({ tableName: "brands" })
export class Brand {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property({ length: 255 })
    name!: string;

    @Property({ length: 255, unique: true })
    slug!: string;

    @Property({ length: 500, nullable: true })
    logoUrl?: string;

    @Property({ type: "text", nullable: true })
    description?: string;

    @Property({ default: 0 })
    priority: number = 0;

    @Property({ length: 255, nullable: true })
    metaTitle?: string;

    @Property({ type: "text", nullable: true })
    metaDescription?: string;

    @Enum({ items: () => StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    status: StatusCommonEnum = StatusCommonEnum.ACTIVE;

    @Enum({ items: () => DeletedEnum, default: DeletedEnum.AVAILABLE })
    deleted: DeletedEnum = DeletedEnum.AVAILABLE;

    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @OneToMany(() => Product, (product) => product.brand)
    products = new Collection<Product>(this);
}
