import {
    Cascade,
    Collection,
    Entity,
    Enum,
    ManyToOne,
    OneToMany,
    PrimaryKey,
    Property,
    type Opt,
} from "@mikro-orm/core";
import { Customer } from "../../customer/entities/customer.entity";
import { OrderStatusEnum, PaymentMethodEnum } from "../enums";
import { OrderItem } from "./order-item.entity";

@Entity({ tableName: "orders" })
export class Order {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @ManyToOne(() => Customer, {
        nullable: true,
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "customerId",
    })
    customer?: Customer;

    @Property({ length: 255 })
    customerName!: string;

    @Property({ length: 20 })
    phone!: string;

    @Property({ length: 255 })
    email!: string;

    @Property({ type: "text" })
    shippingAddress!: string;

    @Property({ type: "text", nullable: true })
    note?: string;

    @Property({ type: "decimal", precision: 15, scale: 2, default: 0 })
    totalAmount: number & Opt = 0;

    @Enum({ items: () => OrderStatusEnum, default: OrderStatusEnum.NEW })
    status: OrderStatusEnum & Opt = OrderStatusEnum.NEW;

    @Enum({ items: () => PaymentMethodEnum, default: PaymentMethodEnum.COD })
    paymentMethod: PaymentMethodEnum & Opt = PaymentMethodEnum.COD;

    @Property({ type: "datetime", nullable: true })
    confirmedAt?: Date;

    @Property({ type: "datetime", nullable: true })
    completedAt?: Date;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();

    @OneToMany(() => OrderItem, (item) => item.order, {
        cascade: [Cascade.PERSIST, Cascade.REMOVE],
        orphanRemoval: true,
    })
    items = new Collection<OrderItem>(this);
}
