import {
    Entity,
    ManyToOne,
    PrimaryKey,
    Property,
    type Opt,
} from "@mikro-orm/core";
import { User } from "../../user/entities/user.entity";
import { Notification } from "./notification.entity";

@Entity({ tableName: "notification_details" })
export class NotificationDetail {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @ManyToOne(() => Notification, {
        deleteRule: "cascade",
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "notificationId",
    })
    notification!: Notification;

    @ManyToOne(() => User, {
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "userId",
    })
    user!: User;

    @Property({ length: 36, nullable: true, comment: "ID entity liên quan (orderId/productId/...)" })
    entityRefId?: string;

    @Property({ default: false })
    seen: boolean & Opt = false;

    @Property({ type: "datetime", nullable: true })
    seenAt?: Date;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
