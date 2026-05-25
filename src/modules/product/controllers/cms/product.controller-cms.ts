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
    UsePipes,
    ValidationPipe,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProductService } from "../../services/product.service";
import { CreateProductDto } from "../../dtos/create-product.dto";
import { UpdateProductDto } from "../../dtos/update-product.dto";
import { ListProductDto } from "../../dtos/query-product.dto";
import { ImportProductsDto } from "../../dtos/import-products.dto";

@Controller("cms/products")
@ApiTags("[CMS] PRODUCT")
@ApiBearerAuth()
export class ProductControllerForCMS {
    constructor(private readonly productService: ProductService) {}

    @Post()
    @ApiOperation({ summary: "Tạo product" })
    create(@Body() dto: CreateProductDto) {
        return this.productService.create(dto);
    }

    @Post("import")
    @ApiOperation({
        summary: "Import nhiều product (theo slug) — có thì update, không có thì tạo mới",
    })
    @UsePipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
        }),
    )
    bulkImport(@Body() dto: ImportProductsDto) {
        return this.productService.bulkImport(dto);
    }

    @Get()
    @ApiOperation({ summary: "Danh sách product" })
    findAll(@Query() query: ListProductDto) {
        return this.productService.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Chi tiết product" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.productService.findOne(id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật product" })
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
        return this.productService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Xoá mềm product" })
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.productService.remove(id);
    }
}
