import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SlugService } from "../../services/slug.service";
import { ListSlugDto } from "../../dtos/query-slug.dto";
import { ResolveEntitiesDto } from "../../dtos/resolve-entities.dto";

@Controller("cms/slugs")
@ApiTags("[CMS] SLUG")
@ApiBearerAuth()
export class SlugControllerForCMS {
    constructor(private readonly slugService: SlugService) {}

    @Get()
    @ApiOperation({ summary: "Danh sách slug — list only" })
    findAll(@Query() query: ListSlugDto) {
        return this.slugService.findAll(query);
    }

    @Post("resolve-entities")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "Batch resolve list (type, entityId) → tên/slug entity",
        description:
            "FE list slugs gom unique pairs gọi 1 lần để hiện tên product/category/post thay vì id thuần.",
    })
    resolveEntities(@Body() dto: ResolveEntitiesDto) {
        return this.slugService.resolveEntities(dto.items);
    }
}
