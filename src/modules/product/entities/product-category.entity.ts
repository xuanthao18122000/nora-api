import {
    Entity,
    ManyToOne,
    PrimaryKey,
    Property,
    Unique,
    type Opt,
} from "@mikro-orm/core";
import { Product } from "./product.entity";
import { Category } from "../../category/entities/category.entity";

@Entity({ tableName: "product_categories" })
@Unique({ properties: ["product", "category"] })
export class ProductCategory {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @ManyToOne(() => Product, {
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "productId",
    })
    product!: Product;

    @ManyToOne(() => Category, {
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "categoryId",
    })
    category!: Category;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
