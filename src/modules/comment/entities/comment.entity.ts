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
import { randomUUID } from "crypto";
import {
    CommentStatusEnum,
    CommentTargetTypeEnum,
    CommentTypeEnum,
} from "../enums";

@Entity({ tableName: "comments" })
export class Comment {
    @PrimaryKey({ type: "uuid" })
    id: string = randomUUID();

    @Enum({ items: () => CommentTargetTypeEnum, comment: "CATEGORY | PRODUCT" })
    targetType!: CommentTargetTypeEnum;

    @Property({ length: 64, comment: "ID category / product (string vì product có thể UUID)" })
    targetId!: string;

    @ManyToOne(() => Comment, {
        nullable: true,
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "parentId",
    })
    parent?: Comment;

    @OneToMany(() => Comment, (c) => c.parent)
    children = new Collection<Comment>(this);

    @Property({ type: "text", comment: "Nội dung comment" })
    content!: string;

    @Property({ length: 255, nullable: true, comment: "Tên người comment" })
    customerName?: string;

    @Enum({
        items: () => CommentTypeEnum,
        default: CommentTypeEnum.CUSTOMER,
        comment: "CUSTOMER | ADMIN",
    })
    customerCommentType: CommentTypeEnum & Opt = CommentTypeEnum.CUSTOMER;

    @Property({ default: 0, comment: "Lượt like" })
    likeCount: number & Opt = 0;

    @Property({ default: 0, comment: "Số lượt reply" })
    replyCount: number & Opt = 0;

    @Enum({
        items: () => CommentStatusEnum,
        default: CommentStatusEnum.PUBLISHED,
        comment: "Trạng thái show comment",
    })
    status: CommentStatusEnum & Opt = CommentStatusEnum.PUBLISHED;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
