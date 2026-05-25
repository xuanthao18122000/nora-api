import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CategoryService } from "../../services/category.service";
import { ListCategoryDto } from "../../dtos/query-category.dto";

@Controller("fe/categories")
@ApiTags("[FE] CATEGORY")
export class CategoryControllerForFE {
    constructor(private readonly categoryService: CategoryService) {}

    @Get()
    @ApiOperation({ summary: "Danh sách category cho storefront" })
    findAll(@Query() query: ListCategoryDto) {
        return this.categoryService.findAll(query);
    }

    @Get("tree")
    @ApiOperation({ summary: "Cây category cho menu storefront" })
    findTree() {
        return this.categoryService.findTree();
    }

    @Get("by-id/:id")
    @ApiOperation({ summary: "Chi tiết category theo id (storefront sau khi resolve slug)" })
    async findById(@Param("id") id: string) {
        const category = await this.categoryService.findOne(Number(id));
        if (!category) throw new NotFoundException(`Category #${id} không tồn tại`);
        return category;
    }

    @Get(":slug")
    @ApiOperation({ summary: "Chi tiết category theo slug" })
    async findBySlug(@Param("slug") slug: string) {
        const category = await this.categoryService.findBySlug(slug);
        if (!category) throw new NotFoundException(`Category "${slug}" không tồn tại`);
        return category;
    }
}
