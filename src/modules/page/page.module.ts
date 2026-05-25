import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { Page } from "./entities/page.entity";
import { PageSection } from "./entities/page-section.entity";
import { PageSectionItem } from "./entities/page-section-item.entity";
import {
    PageControllerForCMS,
    PageControllerForFE,
    PageSectionControllerForCMS,
} from "./controllers";
import { PageService } from "./services/page.service";
import { PageSectionService } from "./services/page-section.service";

@Module({
    imports: [MikroOrmModule.forFeature([Page, PageSection, PageSectionItem])],
    controllers: [PageControllerForCMS, PageSectionControllerForCMS, PageControllerForFE],
    providers: [PageService, PageSectionService],
    exports: [PageService, PageSectionService],
})
export class PageModule {}
