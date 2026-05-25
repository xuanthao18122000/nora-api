import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { AuthModule } from "@modules/auth/auth.module";
import { CategoryFacet } from "@modules/category/entities/category-facet.entity";
import { Facet, FacetValue } from "./entities";
import {
    FacetControllerForCMS,
    FacetControllerForFE,
    FacetValueControllerForCMS,
} from "./controllers";
import { FacetService } from "./services/facet.service";
import { FacetValueService } from "./services/facet-value.service";
import { FacetFEService } from "./services/facet-fe.service";

@Module({
    imports: [
        MikroOrmModule.forFeature([Facet, FacetValue, CategoryFacet]),
        AuthModule,
    ],
    controllers: [
        FacetControllerForCMS,
        FacetValueControllerForCMS,
        FacetControllerForFE,
    ],
    providers: [FacetService, FacetValueService, FacetFEService],
    exports: [FacetService, FacetValueService, FacetFEService, MikroOrmModule],
})
export class FacetsModule {}
