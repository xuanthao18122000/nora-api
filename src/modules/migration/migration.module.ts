import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { Brand } from "@modules/brand/entities/brand.entity";
import { Category } from "@modules/category/entities/category.entity";
import { Post } from "@modules/post/entities/post.entity";
import { ProductCategory } from "@modules/product/entities/product-category.entity";
import { Product } from "@modules/product/entities/product.entity";
import { Slug } from "@modules/slug/entities/slug.entity";
import { MigrationControllerForCMS } from "./controllers";
import { MigrationService } from "./services/migration.service";

@Module({
    imports: [
        MikroOrmModule.forFeature([Brand, Category, Product, ProductCategory, Post, Slug]),
    ],
    controllers: [MigrationControllerForCMS],
    providers: [MigrationService],
})
export class MigrationModule {}
