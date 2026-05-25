import { Entity, PrimaryKey, Property, type Opt } from "@mikro-orm/core";

@Entity({ tableName: "files" })
export class File {
    @PrimaryKey({ autoincrement: true })
    id!: number;

    @Property({ length: 500, comment: "Tên file gốc do user upload" })
    originalName!: string;

    @Property({ length: 500, comment: "Tên file đã đổi (unique) — do CDN server sinh" })
    fileName!: string;

    @Property({
        length: 500,
        comment: "CDN URL public để FE truy cập (vd https://cdn-v2.didongviet.vn/product/123/abc.png)",
    })
    path!: string;

    @Property({ length: 100 })
    mimeType!: string;

    @Property({ type: "bigint", comment: "Kích thước (bytes)" })
    size!: number;

    @Property({ length: 50, nullable: true, comment: "image/video/audio/document/other" })
    fileType?: string;

    @Property({ default: false, comment: "Đã được entity nào dùng chưa — false sẽ bị clean job xoá" })
    isUsed: boolean & Opt = false;

    @Property({ onCreate: () => new Date() })
    createdAt: Date & Opt = new Date();

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date & Opt = new Date();
}
