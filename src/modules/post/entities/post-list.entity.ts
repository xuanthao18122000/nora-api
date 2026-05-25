import { Entity, Enum, PrimaryKey, Property, type Opt } from "@mikro-orm/core";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";

@Entity({ tableName: "post_lists" })
export class PostList {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property({ length: 255 })
    name!: string;

    @Property({ length: 255, comment: "Denormalized; uniqueness enforced bởi bảng slugs" })
    slug!: string;

    @Property({ type: "text", nullable: true })
    description?: string;

    @Enum({ items: () => StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    status: StatusCommonEnum & Opt = StatusCommonEnum.ACTIVE;

    @Enum({ items: () => DeletedEnum, default: DeletedEnum.AVAILABLE })
    deleted: DeletedEnum & Opt = DeletedEnum.AVAILABLE;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
