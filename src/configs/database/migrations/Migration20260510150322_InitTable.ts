import { Migration } from '@mikro-orm/migrations';

export class Migration20260510150322_InitTable extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`brands\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) not null, \`slug\` varchar(255) not null, \`logoUrl\` varchar(500) null, \`description\` text null, \`priority\` int not null default 0, \`metaTitle\` varchar(255) null, \`metaDescription\` text null, \`status\` tinyint not null default 1, \`deleted\` tinyint not null default 0, \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`brands\` add unique \`brands_slug_unique\`(\`slug\`);`);

    this.addSql(`create table \`categories\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) not null, \`slug\` varchar(255) not null comment 'Denormalized; uniqueness enforced bởi bảng slugs', \`description\` text null, \`idPath\` varchar(500) not null default '', \`priority\` int not null default 0, \`position\` int not null default 0 comment 'Vị trí sắp xếp (số nhỏ hiển thị trước)', \`iconUrl\` varchar(500) null, \`thumbnailUrl\` varchar(500) null, \`canonicalUrl\` varchar(500) null, \`level\` int not null default 0 comment 'Level 0 = root', \`metaTitle\` varchar(255) null, \`metaDescription\` text null, \`metaKeywords\` varchar(500) null, \`metaRobots\` varchar(50) not null default 'noindex,nofollow', \`seoBaseSchema\` json null, \`status\` tinyint not null default 1, \`deleted\` tinyint not null default 0, \`createdAt\` datetime not null, \`updatedAt\` datetime not null, \`parent\` int unsigned null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`comments\` (\`id\` varchar(36) not null, \`targetType\` enum('CATEGORY', 'PRODUCT') not null comment 'CATEGORY | PRODUCT', \`targetId\` varchar(64) not null comment 'ID category / product (string vì product có thể UUID)', \`parent\` varchar(36) null, \`content\` text not null comment 'Nội dung comment', \`customerName\` varchar(255) null comment 'Tên người comment', \`customerCommentType\` enum('CUSTOMER', 'ADMIN') not null default 'CUSTOMER' comment 'CUSTOMER | ADMIN', \`likeCount\` int not null default 0 comment 'Lượt like', \`replyCount\` int not null default 0 comment 'Số lượt reply', \`status\` enum('PUBLISHED', 'PENDING', 'HIDDEN') not null default 'PUBLISHED' comment 'Trạng thái show comment', \`createdAt\` datetime not null, \`updatedAt\` datetime not null, primary key (\`id\`)) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`customers\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) not null, \`phoneNumber\` varchar(20) not null comment 'Định danh khách hàng', \`email\` varchar(255) null, \`address\` text null comment 'Địa chỉ gần nhất', \`totalOrders\` int not null default 0, \`totalSpent\` numeric(15,2) not null default 0, \`status\` tinyint not null default 1, \`deleted\` tinyint not null default 0, \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`customers\` add unique \`customers_phoneNumber_unique\`(\`phoneNumber\`);`);

    this.addSql(`create table \`contact_informations\` (\`id\` int unsigned not null auto_increment primary key, \`customer\` int unsigned null, \`name\` varchar(255) not null comment 'Tên người liên hệ', \`phone\` varchar(20) not null comment 'Số điện thoại', \`email\` varchar(255) null comment 'Email', \`address\` text null comment 'Địa chỉ', \`productId\` int null comment 'ID sản phẩm liên quan (nếu có)', \`productName\` varchar(255) null comment 'Snapshot tên sản phẩm tại thời điểm liên hệ', \`status\` enum('new', 'contacted', 'completed', 'cancelled') not null default 'new', \`notes\` text null comment 'Ghi chú', \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`facets\` (\`id\` int unsigned not null auto_increment primary key comment 'ID của facet', \`key\` varchar(100) not null comment 'Khóa duy nhất: ram, storage, chipset, usage_need', \`label\` varchar(255) not null comment 'Nhãn hiển thị: Dung lượng RAM, Bộ nhớ trong', \`displayOrder\` int not null default 0 comment 'Thứ tự hiển thị', \`status\` tinyint not null default 1 comment 'Trạng thái: 1=ACTIVE, -1=INACTIVE', \`deleted\` tinyint not null default 0 comment 'Trạng thái xóa: 0=AVAILABLE, 1=DELETED', \`type\` tinyint not null default 2 comment 'Loại facet: 1=SINGLE_SELECT, 2=MULTI_SELECT, 3=RANGE, 4=BOOLEAN', \`userCreated\` int null comment 'Người tạo', \`userUpdated\` int null comment 'Người cập nhật', \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`category_facets\` (\`categoryId\` int unsigned not null comment 'ID của category', \`facetId\` int unsigned not null comment 'ID của facet', \`displayOrder\` int not null default 0 comment 'Thứ tự hiển thị facet trong category', \`isVisible\` tinyint(1) not null default true comment 'Bật/tắt facet trong category: true=visible, false=hidden', \`status\` tinyint not null default 1 comment 'Trạng thái: 1=ACTIVE, -1=INACTIVE', \`deleted\` tinyint not null default 0 comment 'Trạng thái xóa: 0=AVAILABLE, 1=DELETED', \`userCreated\` int null comment 'Người tạo', \`userUpdated\` int null comment 'Người cập nhật', \`createdAt\` datetime not null, \`updatedAt\` datetime not null, primary key (\`categoryId\`, \`facetId\`)) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`facet_values\` (\`id\` int unsigned not null auto_increment primary key comment 'ID của facet value', \`facetId\` int unsigned not null comment 'ID của facet', \`key\` varchar(100) not null comment 'Khóa: gaming, 8gb, snapdragon', \`label\` varchar(255) not null comment 'Nhãn hiển thị: Chơi game, 8 GB, Snapdragon', \`icon\` varchar(255) null comment 'Icon URL hoặc emoji', \`meta\` json null comment 'Metadata JSON: {"hex":"#FF0000","image":"url"}', \`status\` tinyint not null default 1 comment 'Trạng thái: 1=ACTIVE, -1=INACTIVE', \`deleted\` tinyint not null default 0 comment 'Trạng thái xóa: 0=AVAILABLE, 1=DELETED', \`userCreated\` int null comment 'Người tạo', \`userUpdated\` int null comment 'Người cập nhật', \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`files\` (\`id\` int unsigned not null auto_increment primary key, \`originalName\` varchar(500) not null comment 'Tên file gốc do user upload', \`fileName\` varchar(500) not null comment 'Tên file đã đổi (unique) — do CDN server sinh', \`path\` varchar(500) not null comment 'CDN URL public để FE truy cập (vd https://cdn-v2.didongviet.vn/product/123/abc.png)', \`mimeType\` varchar(100) not null, \`size\` bigint not null comment 'Kích thước (bytes)', \`fileType\` varchar(50) null comment 'image/video/audio/document/other', \`isUsed\` tinyint(1) not null default false comment 'Đã được entity nào dùng chưa — false sẽ bị clean job xoá', \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`orders\` (\`id\` int unsigned not null auto_increment primary key, \`customer\` int unsigned null, \`customerName\` varchar(255) not null, \`phone\` varchar(20) not null, \`email\` varchar(255) not null, \`shippingAddress\` text not null, \`note\` text null, \`totalAmount\` numeric(15,2) not null default 0, \`status\` tinyint not null default 1, \`paymentMethod\` tinyint not null default 1, \`confirmedAt\` datetime null, \`completedAt\` datetime null, \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`pages\` (\`id\` varchar(36) not null, \`slug\` varchar(255) not null comment 'Slug, vd \\'khuyen-mai-tet\\'', \`code\` varchar(255) null comment 'Mã code, vd \\'home_page\\'', \`type\` enum('custom', 'system') not null comment 'custom | system', \`title\` varchar(255) null, \`status\` tinyint not null default 1, \`pageData\` json null comment 'Cấu hình trang (banner, redirect, form...)', \`metaTitle\` varchar(255) null, \`metaDescription\` text null, \`seoImage\` varchar(255) null, \`canonicalUrl\` text null, \`seoKeywords\` varchar(255) null, \`seoBaseSchema\` json null, \`isSitemap\` tinyint(1) not null default false, \`seoRobots\` varchar(50) not null default 'noindex,nofollow', \`description\` text null, \`createdAt\` datetime not null, \`updatedAt\` datetime not null, primary key (\`id\`)) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`pages\` add unique \`pages_slug_unique\`(\`slug\`);`);

    this.addSql(`create table \`page_sections\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) null comment 'Tên section (admin tự đặt)', \`key\` varchar(255) null comment 'Khoá định danh — FE dùng để map component (vd hero_banner, layout_menu)', \`page\` varchar(36) not null, \`type\` varchar(255) not null comment 'Loại section (vd banner, product, text, faq, link_item)', \`extra\` json null comment 'Schema/config riêng của section', \`url\` varchar(255) null, \`position\` int not null default 0, \`status\` tinyint not null default 1, \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`page_section_items\` (\`id\` int unsigned not null auto_increment primary key, \`pageSectionId\` int unsigned not null, \`deviceType\` enum('mobile', 'desktop', 'all') not null default 'all', \`name\` varchar(255) null, \`targetUrl\` varchar(500) null comment 'URL đích khi click item', \`type\` varchar(255) null comment 'Loại item (vd banner, list_products, link)', \`position\` int not null default 0, \`data\` text null comment 'Dữ liệu (string, có thể là JSON stringified)', \`extra\` json null comment 'Cấu hình mở rộng', \`status\` tinyint not null default 1, \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`post_lists\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) not null, \`slug\` varchar(255) not null comment 'Denormalized; uniqueness enforced bởi bảng slugs', \`description\` text null, \`status\` tinyint not null default 1, \`deleted\` tinyint not null default 0, \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`posts\` (\`id\` int unsigned not null auto_increment primary key, \`title\` varchar(255) not null, \`slug\` varchar(255) not null comment 'Denormalized; uniqueness enforced bởi bảng slugs', \`content\` text null comment 'Nội dung HTML', \`shortDescription\` text null comment 'Mô tả ngắn / tóm tắt', \`featuredImage\` varchar(500) null, \`views\` int not null default 0, \`authorId\` int null comment 'FK tới users.id (nullable)', \`metaTitle\` varchar(255) null, \`metaDescription\` text null, \`metaKeywords\` varchar(500) null, \`postList\` int unsigned null, \`status\` tinyint not null default 1, \`deleted\` tinyint not null default 0, \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`products\` (\`id\` int unsigned not null auto_increment primary key, \`name\` varchar(255) not null, \`slug\` varchar(255) not null comment 'Denormalized; uniqueness enforced bởi bảng slugs', \`sku\` varchar(50) not null, \`shortDescription\` varchar(500) null, \`description\` text null, \`price\` decimal(15, 2) not null default '0', \`salePrice\` decimal(15, 2) null, \`costPrice\` decimal(15, 2) not null default '0', \`stockQuantity\` int not null default 0, \`unit\` varchar(50) null, \`thumbnailUrl\` varchar(500) null, \`images\` json null, \`brand\` int unsigned null, \`origin\` varchar(255) null, \`barcode\` varchar(100) null, \`priority\` int not null default 0, \`viewCount\` int not null default 0, \`soldCount\` int not null default 0, \`averageRating\` decimal(3, 2) not null default '0', \`reviewCount\` int not null default 0, \`isBestSeller\` tinyint(1) not null default false, \`showPrice\` tinyint(1) not null default true, \`metaTitle\` varchar(255) null, \`metaDescription\` text null, \`metaKeywords\` varchar(500) null, \`metaRobots\` varchar(50) not null default 'index,follow', \`canonicalUrl\` varchar(500) null, \`seoBaseSchema\` json null, \`status\` tinyint not null default 1, \`deleted\` tinyint not null default 0, \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`products\` add unique \`products_sku_unique\`(\`sku\`);`);

    this.addSql(`create table \`order_items\` (\`id\` int unsigned not null auto_increment primary key, \`order\` int unsigned not null, \`product\` int unsigned not null, \`productName\` varchar(255) not null comment 'Tên sản phẩm snapshot tại lúc đặt', \`productSlug\` varchar(255) null comment 'Slug sản phẩm snapshot', \`quantity\` int not null default 1, \`unitPrice\` numeric(15,2) not null comment 'Đơn giá snapshot', \`totalPrice\` numeric(15,2) not null default 0 comment 'quantity * unitPrice', \`selectedAttributes\` json null comment 'Thuộc tính đã chọn (màu, size, ...)', \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`product_categories\` (\`id\` int unsigned not null auto_increment primary key, \`product\` int unsigned not null, \`category\` int unsigned not null, \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`product_categories\` add unique \`product_categories_product_category_unique\`(\`product\`, \`category\`);`);

    this.addSql(`create table \`product_facet_values\` (\`id\` int unsigned not null auto_increment primary key comment 'ID của product facet value', \`productId\` int unsigned not null comment 'ID của product', \`facetValueId\` int unsigned not null comment 'ID của facet value', \`deleted\` tinyint not null default 0 comment 'Trạng thái xóa: 0=AVAILABLE, 1=DELETED', \`userCreated\` int null comment 'Người tạo', \`userUpdated\` int null comment 'Người cập nhật', \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`product_facet_values\` add unique \`product_facet_values_productId_facetValueId_unique\`(\`productId\`, \`facetValueId\`);`);

    this.addSql(`create table \`slugs\` (\`id\` int unsigned not null auto_increment primary key, \`type\` tinyint not null default 1, \`slug\` varchar(255) not null comment 'Slug duy nhất xuyên suốt mọi entity', \`entityId\` int null comment 'ID entity tương ứng (product/category/post/page)', \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`slugs\` add unique \`slugs_slug_unique\`(\`slug\`);`);

    this.addSql(`create table \`users\` (\`id\` int unsigned not null auto_increment primary key, \`email\` varchar(200) not null, \`password\` varchar(200) not null comment 'Bcrypt hash', \`fullName\` varchar(200) not null, \`avatar\` varchar(200) null, \`phoneNumber\` varchar(15) null, \`address\` varchar(500) null, \`role\` tinyint not null default 1, \`status\` tinyint not null default 1, \`deleted\` tinyint not null default 0, \`lastRequireLogoutAt\` datetime null comment 'Mốc bắt buộc đăng nhập lại', \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`users\` add unique \`users_email_unique\`(\`email\`);`);

    this.addSql(`create table \`notifications\` (\`id\` int unsigned not null auto_increment primary key, \`title\` varchar(2000) not null, \`body\` text null, \`receiverType\` tinyint not null default 2, \`receivers\` json not null comment 'Snapshot list userId nhận thông báo', \`creator\` int unsigned not null, \`redirectType\` tinyint not null default 1, \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);

    this.addSql(`create table \`notification_details\` (\`id\` int unsigned not null auto_increment primary key, \`notification\` int unsigned not null, \`user\` int unsigned not null, \`entityRefId\` varchar(36) null comment 'ID entity liên quan (orderId/productId/...)', \`seen\` tinyint(1) not null default false, \`seenAt\` datetime null, \`createdAt\` datetime not null, \`updatedAt\` datetime not null) default character set utf8mb4 engine = InnoDB;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists \`brands\`;`);

    this.addSql(`drop table if exists \`categories\`;`);

    this.addSql(`drop table if exists \`comments\`;`);

    this.addSql(`drop table if exists \`customers\`;`);

    this.addSql(`drop table if exists \`contact_informations\`;`);

    this.addSql(`drop table if exists \`facets\`;`);

    this.addSql(`drop table if exists \`category_facets\`;`);

    this.addSql(`drop table if exists \`facet_values\`;`);

    this.addSql(`drop table if exists \`files\`;`);

    this.addSql(`drop table if exists \`orders\`;`);

    this.addSql(`drop table if exists \`pages\`;`);

    this.addSql(`drop table if exists \`page_sections\`;`);

    this.addSql(`drop table if exists \`page_section_items\`;`);

    this.addSql(`drop table if exists \`post_lists\`;`);

    this.addSql(`drop table if exists \`posts\`;`);

    this.addSql(`drop table if exists \`products\`;`);

    this.addSql(`drop table if exists \`order_items\`;`);

    this.addSql(`drop table if exists \`product_categories\`;`);

    this.addSql(`drop table if exists \`product_facet_values\`;`);

    this.addSql(`drop table if exists \`slugs\`;`);

    this.addSql(`drop table if exists \`users\`;`);

    this.addSql(`drop table if exists \`notifications\`;`);

    this.addSql(`drop table if exists \`notification_details\`;`);
  }

}
