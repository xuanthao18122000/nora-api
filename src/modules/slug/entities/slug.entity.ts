import { Entity, Enum, PrimaryKey, Property, type Opt } from "@mikro-orm/core";
import { SlugTypeEnum } from "../enums";

@Entity({ tableName: "slugs" })
export class Slug {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Enum({ items: () => SlugTypeEnum, default: SlugTypeEnum.PRODUCT })
    type: SlugTypeEnum & Opt = SlugTypeEnum.PRODUCT;

    @Property({ length: 255, unique: true, comment: "Slug duy nhất xuyên suốt mọi entity" })
    slug!: string;

    @Property({ nullable: true, comment: "ID entity tương ứng (product/category/post/page)" })
    entityId?: number;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
