import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { AuthModule } from "@modules/auth/auth.module";
import { CategoryModule } from "@modules/category/category.module";
import { FacetValue } from "@modules/facets/entities/facet-value.entity";
import { SlugModule } from "@modules/slug/slug.module";
import { Brand } from "../brand/entities/brand.entity";
import { Category } from "../category/entities/category.entity";
import { Product } from "./entities/product.entity";
import { ProductCategory } from "./entities/product-category.entity";
import { ProductFacetValue } from "./entities/product-facet-value.entity";
import {
    ProductControllerForCMS,
    ProductControllerForFE,
    ProductFacetValueControllerForCMS,
    SearchControllerForFE,
} from "./controllers";
import { ProductService } from "./services/product.service";
import { ProductFacetValueService } from "./services/product-facet-value.service";
import { SearchService } from "./services/search.service";

@Module({
    imports: [
        MikroOrmModule.forFeature([
            Product,
            ProductCategory,
            ProductFacetValue,
            Brand,
            Category,
            FacetValue,
        ]),
        SlugModule,
        CategoryModule,
        AuthModule,
    ],
    controllers: [
        ProductControllerForCMS,
        ProductControllerForFE,
        ProductFacetValueControllerForCMS,
        SearchControllerForFE,
    ],
    providers: [ProductService, ProductFacetValueService, SearchService],
    exports: [ProductService, ProductFacetValueService, SearchService],
})
export class ProductModule {}
