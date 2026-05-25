import {
    Collection,
    Entity,
    Enum,
    OneToMany,
    PrimaryKey,
    Property,
    type Opt,
} from "@mikro-orm/core";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { Order } from "../../order/entities/order.entity";

@Entity({ tableName: "customers" })
export class Customer {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property({ length: 255 })
    name!: string;

    @Property({ length: 20, unique: true, comment: "Định danh khách hàng" })
    phoneNumber!: string;

    @Property({ length: 255, nullable: true })
    email?: string;

    @Property({ type: "text", nullable: true, comment: "Địa chỉ gần nhất" })
    address?: string;

    @Property({ default: 0 })
    totalOrders: number & Opt = 0;

    @Property({ type: "decimal", precision: 15, scale: 2, default: 0 })
    totalSpent: number & Opt = 0;

    @Enum({ items: () => StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    status: StatusCommonEnum & Opt = StatusCommonEnum.ACTIVE;

    @Enum({ items: () => DeletedEnum, default: DeletedEnum.AVAILABLE })
    deleted: DeletedEnum & Opt = DeletedEnum.AVAILABLE;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();

    @OneToMany(() => Order, (order) => order.customer)
    orders = new Collection<Order>(this);
}
