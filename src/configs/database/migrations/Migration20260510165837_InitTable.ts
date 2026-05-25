import { Migration } from '@mikro-orm/migrations';

export class Migration20260510165837_InitTable extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table \`categories\` change \`parent\` \`parentId\` int unsigned null;`);

    this.addSql(`alter table \`comments\` change \`parent\` \`parentId\` varchar(36) null;`);

    this.addSql(`alter table \`customers\` modify \`totalSpent\` numeric(15,2) not null default 0;`);

    this.addSql(`alter table \`contact_informations\` change \`customer\` \`customerId\` int unsigned null;`);

    this.addSql(`alter table \`orders\` modify \`totalAmount\` numeric(15,2) not null default 0;`);
    this.addSql(`alter table \`orders\` change \`customer\` \`customerId\` int unsigned null;`);

    this.addSql(`alter table \`page_sections\` change \`page\` \`pageId\` varchar(36) not null;`);

    this.addSql(`alter table \`posts\` change \`postList\` \`postListId\` int unsigned null;`);

    this.addSql(`alter table \`products\` modify \`price\` decimal(15, 2) not null default '0', modify \`costPrice\` decimal(15, 2) not null default '0', modify \`averageRating\` decimal(3, 2) not null default '0';`);
    this.addSql(`alter table \`products\` change \`brand\` \`brandId\` int unsigned null;`);

    this.addSql(`alter table \`order_items\` drop column \`order\`, drop column \`product\`;`);

    this.addSql(`alter table \`order_items\` add \`orderId\` int unsigned not null, add \`productId\` int unsigned not null;`);
    this.addSql(`alter table \`order_items\` modify \`totalPrice\` numeric(15,2) not null default 0 comment 'quantity * unitPrice';`);

    this.addSql(`alter table \`product_categories\` drop index \`product_categories_product_category_unique\`;`);
    this.addSql(`alter table \`product_categories\` drop column \`product\`, drop column \`category\`;`);

    this.addSql(`alter table \`product_categories\` add \`productId\` int unsigned not null, add \`categoryId\` int unsigned not null;`);
    this.addSql(`alter table \`product_categories\` add unique \`product_categories_productId_categoryId_unique\`(\`productId\`, \`categoryId\`);`);

    this.addSql(`alter table \`notifications\` change \`creator\` \`creatorId\` int unsigned not null;`);

    this.addSql(`alter table \`notification_details\` drop column \`notification\`, drop column \`user\`;`);

    this.addSql(`alter table \`notification_details\` add \`notificationId\` int unsigned not null, add \`userId\` int unsigned not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table \`categories\` change \`parentId\` \`parent\` int unsigned null;`);

    this.addSql(`alter table \`comments\` change \`parentId\` \`parent\` varchar(36) null;`);

    this.addSql(`alter table \`contact_informations\` change \`customerId\` \`customer\` int unsigned null;`);

    this.addSql(`alter table \`customers\` modify \`totalSpent\` decimal(15,2) not null default 0.00;`);

    this.addSql(`alter table \`notification_details\` drop column \`notificationId\`, drop column \`userId\`;`);

    this.addSql(`alter table \`notification_details\` add \`notification\` int unsigned not null, add \`user\` int unsigned not null;`);

    this.addSql(`alter table \`notifications\` change \`creatorId\` \`creator\` int unsigned not null;`);

    this.addSql(`alter table \`order_items\` drop column \`orderId\`, drop column \`productId\`;`);

    this.addSql(`alter table \`order_items\` add \`order\` int unsigned not null, add \`product\` int unsigned not null;`);
    this.addSql(`alter table \`order_items\` modify \`totalPrice\` decimal(15,2) not null default 0.00 comment 'quantity * unitPrice';`);

    this.addSql(`alter table \`orders\` modify \`totalAmount\` decimal(15,2) not null default 0.00;`);
    this.addSql(`alter table \`orders\` change \`customerId\` \`customer\` int unsigned null;`);

    this.addSql(`alter table \`page_sections\` change \`pageId\` \`page\` varchar(36) not null;`);

    this.addSql(`alter table \`posts\` change \`postListId\` \`postList\` int unsigned null;`);

    this.addSql(`alter table \`product_categories\` drop index \`product_categories_productId_categoryId_unique\`;`);
    this.addSql(`alter table \`product_categories\` drop column \`productId\`, drop column \`categoryId\`;`);

    this.addSql(`alter table \`product_categories\` add \`product\` int unsigned not null, add \`category\` int unsigned not null;`);
    this.addSql(`alter table \`product_categories\` add unique \`product_categories_product_category_unique\`(\`product\`, \`category\`);`);

    this.addSql(`alter table \`products\` modify \`price\` decimal(15,2) not null default 0.00, modify \`costPrice\` decimal(15,2) not null default 0.00, modify \`averageRating\` decimal(3,2) not null default 0.00;`);
    this.addSql(`alter table \`products\` change \`brandId\` \`brand\` int unsigned null;`);
  }

}
