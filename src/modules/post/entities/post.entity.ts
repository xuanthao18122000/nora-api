import {
    Entity,
    Enum,
    ManyToOne,
    PrimaryKey,
    Property,
    type Opt,
} from "@mikro-orm/core";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { PostList } from "./post-list.entity";

@Entity({ tableName: "posts" })
export class Post {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property({ length: 255 })
    title!: string;

    @Property({ length: 255, comment: "Denormalized; uniqueness enforced bởi bảng slugs" })
    slug!: string;

    @Property({ type: "text", nullable: true, comment: "Nội dung HTML" })
    content?: string;

    @Property({ type: "text", nullable: true, comment: "Mô tả ngắn / tóm tắt" })
    shortDescription?: string;

    @Property({ length: 500, nullable: true })
    featuredImage?: string;

    @Property({ default: 0 })
    views: number & Opt = 0;

    @Property({ nullable: true, comment: "FK tới users.id (nullable)" })
    authorId?: number;

    @Property({ length: 255, nullable: true })
    metaTitle?: string;

    @Property({ type: "text", nullable: true })
    metaDescription?: string;

    @Property({ length: 500, nullable: true })
    metaKeywords?: string;

    @Property({ type: "int", unsigned: true, nullable: true, comment: "FK tới post_lists.id" })
    postListId?: number;

    @ManyToOne(() => PostList, {
        nullable: true,
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "postListId",
        persist: false,
    })
    postList?: PostList;

    @Enum({ items: () => StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    status: StatusCommonEnum & Opt = StatusCommonEnum.ACTIVE;

    @Enum({ items: () => DeletedEnum, default: DeletedEnum.AVAILABLE })
    deleted: DeletedEnum & Opt = DeletedEnum.AVAILABLE;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
