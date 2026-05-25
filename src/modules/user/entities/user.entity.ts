import { Entity, Enum, PrimaryKey, Property, type Opt } from "@mikro-orm/core";
import { DeletedEnum } from "@common/enums";
import { UserRoleEnum, UserStatusEnum } from "../enums";

@Entity({ tableName: "users" })
export class User {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property({ length: 200, unique: true })
    email!: string;

    @Property({ length: 200, hidden: true, comment: "Bcrypt hash" })
    password!: string;

    @Property({ length: 200 })
    fullName!: string;

    @Property({ length: 200, nullable: true })
    avatar?: string;

    @Property({ length: 15, nullable: true })
    phoneNumber?: string;

    @Property({ length: 500, nullable: true })
    address?: string;

    @Enum({ items: () => UserRoleEnum, default: UserRoleEnum.ADMIN })
    role: UserRoleEnum & Opt = UserRoleEnum.ADMIN;

    @Enum({ items: () => UserStatusEnum, default: UserStatusEnum.ACTIVE })
    status: UserStatusEnum & Opt = UserStatusEnum.ACTIVE;

    @Enum({ items: () => DeletedEnum, default: DeletedEnum.AVAILABLE })
    deleted: DeletedEnum & Opt = DeletedEnum.AVAILABLE;

    @Property({ type: "datetime", nullable: true, comment: "Mốc bắt buộc đăng nhập lại" })
    lastRequireLogoutAt?: Date;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
