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
import { CategoryService } from "../../services/category.service";
import { CreateCategoryDto } from "../../dtos/create-category.dto";
import { UpdateCategoryDto } from "../../dtos/update-category.dto";
import { ListCategoryDto } from "../../dtos/query-category.dto";

@Controller("cms/categories")
@ApiTags("[CMS] CATEGORY")
@ApiBearerAuth()
export class CategoryControllerForCMS {
    constructor(private readonly categoryService: CategoryService) {}

    @Post()
    @ApiOperation({ summary: "Tạo category" })
    create(@Body() dto: CreateCategoryDto) {
        return this.categoryService.create(dto);
    }

    @Get()
    @ApiOperation({
        summary: "Danh sách category",
        description: "Set tree=true để trả về cây, ngược lại trả phân trang.",
    })
    findAll(@Query() query: ListCategoryDto) {
        return this.categoryService.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Chi tiết category" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.categoryService.findOne(id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật category" })
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
        return this.categoryService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Xoá mềm category" })
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.categoryService.remove(id);
    }
}
