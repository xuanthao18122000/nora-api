import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BrandService } from "../../services/brand.service";
import { ListBrandDto } from "../../dtos/query-brand.dto";

@Controller("fe/brands")
@ApiTags("[FE] BRAND")
export class BrandControllerForFE {
    constructor(private readonly brandService: BrandService) {}

    @Get()
    @ApiOperation({ summary: "Danh sách brand cho storefront" })
    findAll(@Query() query: ListBrandDto) {
        return this.brandService.findAll(query);
    }

    @Get(":slug")
    @ApiOperation({ summary: "Chi tiết brand theo slug" })
    async findBySlug(@Param("slug") slug: string) {
        const brand = await this.brandService.findBySlug(slug);
        if (!brand) throw new NotFoundException(`Brand "${slug}" không tồn tại`);
        return brand;
    }
}
