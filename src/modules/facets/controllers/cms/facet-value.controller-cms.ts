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
    Query,
    UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@modules/auth/guards";
import { FacetValueService } from "../../services/facet-value.service";
import { CreateFacetValueDto } from "../../dtos/create-facet-value.dto";
import { UpdateFacetValueDto } from "../../dtos/update-facet-value.dto";
import { ListFacetValueDto } from "../../dtos/query-facet-value.dto";

@UseGuards(JwtAuthGuard)
@Controller("cms/facets/:facetId/values")
@ApiTags("[CMS] FACET VALUE")
@ApiBearerAuth()
export class FacetValueControllerForCMS {
    constructor(private readonly facetValueService: FacetValueService) {}

    @Get()
    @ApiOperation({ summary: "Lấy danh sách facet values" })
    findByFacetId(
        @Param("facetId", ParseIntPipe) facetId: number,
        @Query() query: ListFacetValueDto,
    ) {
        return this.facetValueService.findByFacetId(facetId, query);
    }

    @Get(":valueId")
    @ApiOperation({ summary: "Lấy chi tiết facet value" })
    findOne(@Param("valueId", ParseIntPipe) valueId: number) {
        return this.facetValueService.findOne(valueId);
    }

    @Post()
    @ApiOperation({ summary: "Tạo facet value mới" })
    create(
        @Param("facetId", ParseIntPipe) facetId: number,
        @Body() dto: CreateFacetValueDto,
    ) {
        return this.facetValueService.create(facetId, dto);
    }

    @Patch(":valueId")
    @ApiOperation({ summary: "Cập nhật facet value" })
    update(
        @Param("facetId", ParseIntPipe) facetId: number,
        @Param("valueId", ParseIntPipe) valueId: number,
        @Body() dto: UpdateFacetValueDto,
    ) {
        return this.facetValueService.update(facetId, valueId, dto);
    }

    @Delete(":valueId")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Xoá mềm facet value" })
    async remove(
        @Param("facetId", ParseIntPipe) facetId: number,
        @Param("valueId", ParseIntPipe) valueId: number,
    ) {
        await this.facetValueService.remove(facetId, valueId);
    }
}
