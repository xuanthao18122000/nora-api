import {
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    Post,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProductService } from "../../services/product.service";
import { ListProductDto } from "../../dtos/query-product.dto";

@Controller("fe/products")
@ApiTags("[FE] PRODUCT")
export class ProductControllerForFE {
    constructor(private readonly productService: ProductService) {}

    @Get()
    @ApiOperation({ summary: "Danh sách product cho storefront" })
    findAll(@Query() query: ListProductDto) {
        return this.productService.findAll(query);
    }

    @Post("by-ids")
    @ApiOperation({
        summary:
            "Lấy thông tin compact của nhiều product theo ids — dùng cho Recently Viewed, Compare bar...",
    })
    byIds(@Body() body: { ids: Array<number | string> }) {
        return this.productService.findByIds(body?.ids ?? []);
    }

    @Get(":slug")
    @ApiOperation({ summary: "Chi tiết product theo slug" })
    async findBySlug(@Param("slug") slug: string) {
        const product = await this.productService.findBySlug(slug);
        if (!product) throw new NotFoundException(`Product "${slug}" không tồn tại`);
        return product;
    }
}
