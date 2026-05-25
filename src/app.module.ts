import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { mikroOrmConfig } from "@/configs";
import { AppController } from "./app.controller";
import { BrandModule } from "@modules/brand/brand.module";
import { CategoryModule } from "@modules/category/category.module";
import { ProductModule } from "@modules/product/product.module";
import { OrderModule } from "@modules/order/order.module";
import { PostModule } from "@modules/post/post.module";
import { SlugModule } from "@modules/slug/slug.module";
import { CustomerModule } from "@modules/customer/customer.module";
import { UserModule } from "@modules/user/user.module";
import { NotificationModule } from "@modules/notification/notification.module";
import { FileModule } from "@modules/file/file.module";
import { PageModule } from "@modules/page/page.module";
import { SeoModule } from "@modules/seo/seo.module";
import { AuthModule } from "@modules/auth/auth.module";
import { CommentModule } from "@modules/comment/comment.module";
import { ContactInformationModule } from "@modules/contact-information/contact-information.module";
import { MigrationModule } from "@modules/migration/migration.module";
import { RedisModule } from "@modules/redis/redis.module";
import { TelegramModule } from "@modules/telegram/telegram.module";
import { FacetsModule } from "@modules/facets/facets.module";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MikroOrmModule.forRoot(mikroOrmConfig),
        RedisModule,
        TelegramModule,
        ContactInformationModule,
        SlugModule,
        UserModule,
        AuthModule,
        CustomerModule,
        FileModule,
        BrandModule,
        CategoryModule,
        ProductModule,
        OrderModule,
        PostModule,
        NotificationModule,
        PageModule,
        SeoModule,
        CommentModule,
        FacetsModule,
        MigrationModule,
    ],
    controllers: [AppController],
})
export class AppModule {}
