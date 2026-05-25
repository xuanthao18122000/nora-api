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
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { BrandService } from "../../services/brand.service";
import { CreateBrandDto } from "../../dtos/create-brand.dto";
import { UpdateBrandDto } from "../../dtos/update-brand.dto";
import { ListBrandDto } from "../../dtos/query-brand.dto";

@Controller("cms/brands")
@ApiTags("[CMS] BRAND")
@ApiBearerAuth()
export class BrandControllerForCMS {
    constructor(private readonly brandService: BrandService) {}

    @Post()
    @ApiOperation({ summary: "Tạo brand" })
    create(@Body() dto: CreateBrandDto) {
        return this.brandService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: "Danh sách brand" })
    findAll(@Query() query: ListBrandDto) {
        return this.brandService.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Chi tiết brand" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.brandService.findOne(id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật brand" })
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateBrandDto) {
        return this.brandService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Xoá mềm brand" })
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.brandService.remove(id);
    }
}
