import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@modules/auth/guards";
import { CategoryFacetService } from "../../services/category-facet.service";
import {
    AddFacetsToCategoryDto,
    UpdateCategoryFacetDto,
} from "../../dtos/category-facet.dto";

@UseGuards(JwtAuthGuard)
@Controller("cms/categories/:categoryId/facets")
@ApiTags("[CMS] CATEGORY FACET")
@ApiBearerAuth()
export class CategoryFacetControllerForCMS {
    constructor(private readonly categoryFacetService: CategoryFacetService) {}

    @Get()
    @ApiOperation({ summary: "Danh sách facets đã gắn vào category" })
    findByCategory(@Param("categoryId", ParseIntPipe) categoryId: number) {
        return this.categoryFacetService.findByCategory(categoryId);
    }

    @Post()
    @ApiOperation({ summary: "Thêm (bulk) nhiều facet vào category" })
    addFacets(
        @Param("categoryId", ParseIntPipe) categoryId: number,
        @Body() dto: AddFacetsToCategoryDto,
    ) {
        return this.categoryFacetService.addFacets(categoryId, dto);
    }

    @Patch(":facetId")
    @ApiOperation({ summary: "Cập nhật mapping facet trong category" })
    updateMapping(
        @Param("categoryId", ParseIntPipe) categoryId: number,
        @Param("facetId", ParseIntPipe) facetId: number,
        @Body() dto: UpdateCategoryFacetDto,
    ) {
        return this.categoryFacetService.updateMapping(categoryId, facetId, dto);
    }

    @Delete(":facetId")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Gỡ facet khỏi category (soft delete)" })
    async removeFacet(
        @Param("categoryId", ParseIntPipe) categoryId: number,
        @Param("facetId", ParseIntPipe) facetId: number,
    ) {
        await this.categoryFacetService.removeFacet(categoryId, facetId);
    }
}
