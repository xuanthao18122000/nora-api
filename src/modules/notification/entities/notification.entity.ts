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
import { User } from "../../user/entities/user.entity";
import { NotificationRedirectTypeEnum, NotificationTypeReceiverEnum } from "../enums";
import { NotificationDetail } from "./notification-detail.entity";

@Entity({ tableName: "notifications" })
export class Notification {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property({ length: 2000 })
    title!: string;

    @Property({ type: "text", nullable: true })
    body?: string;

    @Enum({ items: () => NotificationTypeReceiverEnum, default: NotificationTypeReceiverEnum.PRIVATE })
    receiverType: NotificationTypeReceiverEnum & Opt = NotificationTypeReceiverEnum.PRIVATE;

    @Property({ type: "json", comment: "Snapshot list userId nhận thông báo" })
    receivers!: number[];

    @ManyToOne(() => User, {
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "creatorId",
    })
    creator!: User;

    @Enum({ items: () => NotificationRedirectTypeEnum, default: NotificationRedirectTypeEnum.ORDER })
    redirectType: NotificationRedirectTypeEnum & Opt = NotificationRedirectTypeEnum.ORDER;

    @OneToMany(() => NotificationDetail, (detail) => detail.notification, {
        cascade: [Cascade.PERSIST, Cascade.REMOVE],
        orphanRemoval: true,
    })
    details = new Collection<NotificationDetail>(this);

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
