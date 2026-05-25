import {
    Entity,
    ManyToOne,
    PrimaryKey,
    Property,
    type Opt,
} from "@mikro-orm/core";
import { Order } from "./order.entity";
import { Product } from "../../product/entities/product.entity";

@Entity({ tableName: "order_items" })
export class OrderItem {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @ManyToOne(() => Order, {
        deleteRule: "cascade",
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "orderId",
    })
    order!: Order;

    @ManyToOne(() => Product, {
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "productId",
    })
    product!: Product;

    @Property({ length: 255, comment: "Tên sản phẩm snapshot tại lúc đặt" })
    productName!: string;

    @Property({ length: 255, nullable: true, comment: "Slug sản phẩm snapshot" })
    productSlug?: string;

    @Property({ default: 1 })
    quantity: number & Opt = 1;

    @Property({ type: "decimal", precision: 15, scale: 2, comment: "Đơn giá snapshot" })
    unitPrice!: number;

    @Property({ type: "decimal", precision: 15, scale: 2, default: 0, comment: "quantity * unitPrice" })
    totalPrice: number & Opt = 0;

    @Property({ type: "json", nullable: true, comment: "Thuộc tính đã chọn (màu, size, ...)" })
    selectedAttributes?: Record<string, unknown>;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
