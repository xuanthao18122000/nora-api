import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { Brand } from "./entities/brand.entity";
import { BrandControllerForCMS, BrandControllerForFE } from "./controllers";
import { BrandService } from "./services/brand.service";

@Module({
    imports: [MikroOrmModule.forFeature([Brand])],
    controllers: [BrandControllerForCMS, BrandControllerForFE],
    providers: [BrandService],
    exports: [BrandService, MikroOrmModule],
})
export class BrandModule {}
