import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Put,
    UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@modules/auth/guards";
import { ProductFacetValueService } from "../../services/product-facet-value.service";
import { BulkSetProductFacetValuesDto } from "../../dtos/bulk-set-product-facet-values.dto";

@UseGuards(JwtAuthGuard)
@Controller("cms/products/:productId/facet-values")
@ApiTags("[CMS] PRODUCT FACET VALUE")
@ApiBearerAuth()
export class ProductFacetValueControllerForCMS {
    constructor(private readonly productFacetValueService: ProductFacetValueService) {}

    @Get()
    @ApiOperation({ summary: "Danh sách facet values đã gắn cho product" })
    findByProduct(@Param("productId", ParseIntPipe) productId: number) {
        return this.productFacetValueService.findByProduct(productId);
    }

    @Put()
    @ApiOperation({
        summary: "Replace toàn bộ facet values cho product (bulk set)",
    })
    bulkSet(
        @Param("productId", ParseIntPipe) productId: number,
        @Body() dto: BulkSetProductFacetValuesDto,
    ) {
        return this.productFacetValueService.bulkSet(productId, dto);
    }

    @Delete(":valueId")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Gỡ 1 facet value khỏi product (soft delete)" })
    async removeOne(
        @Param("productId", ParseIntPipe) productId: number,
        @Param("valueId", ParseIntPipe) valueId: number,
    ) {
        await this.productFacetValueService.removeOne(productId, valueId);
    }
}
