import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { AuthModule } from "@modules/auth/auth.module";
import { Facet } from "@modules/facets/entities/facet.entity";
import { SlugModule } from "@modules/slug/slug.module";
import { Category } from "./entities/category.entity";
import { CategoryFacet } from "./entities/category-facet.entity";
import {
    CategoryControllerForCMS,
    CategoryControllerForFE,
    CategoryFacetControllerForCMS,
} from "./controllers";
import { CategoryService } from "./services/category.service";
import { CategoryFacetService } from "./services/category-facet.service";

@Module({
    imports: [
        MikroOrmModule.forFeature([Category, CategoryFacet, Facet]),
        SlugModule,
        AuthModule,
    ],
    controllers: [
        CategoryControllerForCMS,
        CategoryControllerForFE,
        CategoryFacetControllerForCMS,
    ],
    providers: [CategoryService, CategoryFacetService],
    exports: [CategoryService, CategoryFacetService, MikroOrmModule],
})
export class CategoryModule {}
