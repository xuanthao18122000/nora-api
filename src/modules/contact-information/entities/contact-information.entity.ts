import {
    Entity,
    Enum,
    ManyToOne,
    PrimaryKey,
    Property,
    type Opt,
} from "@mikro-orm/core";
import { Customer } from "@modules/customer/entities/customer.entity";
import { ContactStatusEnum } from "../enums/contact-status.enum";

@Entity({ tableName: "contact_informations" })
export class ContactInformation {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @ManyToOne(() => Customer, {
        nullable: true,
        index: false,
        createForeignKeyConstraint: false,
        fieldName: "customerId",
    })
    customer?: Customer;

    @Property({ length: 255, comment: "Tên người liên hệ" })
    name!: string;

    @Property({ length: 20, comment: "Số điện thoại" })
    phone!: string;

    @Property({ length: 255, nullable: true, comment: "Email" })
    email?: string;

    @Property({ type: "text", nullable: true, comment: "Địa chỉ" })
    address?: string;

    @Property({ type: "int", nullable: true, comment: "ID sản phẩm liên quan (nếu có)" })
    productId?: number;

    @Property({ length: 255, nullable: true, comment: "Snapshot tên sản phẩm tại thời điểm liên hệ" })
    productName?: string;

    @Enum({
        items: () => ContactStatusEnum,
        default: ContactStatusEnum.NEW,
    })
    status: ContactStatusEnum & Opt = ContactStatusEnum.NEW;

    @Property({ type: "text", nullable: true, comment: "Ghi chú" })
    notes?: string;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
