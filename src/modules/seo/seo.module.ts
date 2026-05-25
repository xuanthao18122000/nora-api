import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { Category } from "@modules/category/entities/category.entity";
import { Page } from "@modules/page/entities/page.entity";
import { Post } from "@modules/post/entities/post.entity";
import { Product } from "@modules/product/entities/product.entity";
import { SitemapController } from "./sitemap.controller";
import { SitemapService } from "./sitemap.service";

@Module({
    imports: [MikroOrmModule.forFeature([Product, Category, Post, Page])],
    controllers: [SitemapController],
    providers: [SitemapService],
    exports: [SitemapService],
})
export class SeoModule {}
