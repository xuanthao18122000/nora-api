import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { Category } from "@modules/category/entities/category.entity";
import { PageModule } from "@modules/page/page.module";
import { Post } from "@modules/post/entities/post.entity";
import { Product } from "@modules/product/entities/product.entity";
import { Slug } from "./entities/slug.entity";
import { SlugControllerForCMS, SlugControllerForFE } from "./controllers";
import { SlugResolveService } from "./services/slug-resolve.service";
import { SlugService } from "./services/slug.service";

@Module({
    imports: [MikroOrmModule.forFeature([Slug, Product, Category, Post]), PageModule],
    controllers: [SlugControllerForCMS, SlugControllerForFE],
    providers: [SlugService, SlugResolveService],
    exports: [SlugService, SlugResolveService],
})
export class SlugModule {}
