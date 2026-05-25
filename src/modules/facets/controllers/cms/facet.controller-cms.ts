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
import { FacetService } from "../../services/facet.service";
import { CreateFacetDto } from "../../dtos/create-facet.dto";
import { UpdateFacetDto } from "../../dtos/update-facet.dto";
import { ListFacetDto } from "../../dtos/query-facet.dto";

@UseGuards(JwtAuthGuard)
@Controller("cms/facets")
@ApiTags("[CMS] FACET")
@ApiBearerAuth()
export class FacetControllerForCMS {
    constructor(private readonly facetService: FacetService) {}

    @Get()
    @ApiOperation({ summary: "Lấy danh sách facets" })
    find(@Query() query: ListFacetDto) {
        return this.facetService.find(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Lấy chi tiết facet" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.facetService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: "Tạo facet mới" })
    create(@Body() dto: CreateFacetDto) {
        return this.facetService.create(dto);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật facet" })
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateFacetDto) {
        return this.facetService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Xoá mềm facet" })
    async remove(@Param("id", ParseIntPipe) id: number) {
        await this.facetService.remove(id);
    }
}
