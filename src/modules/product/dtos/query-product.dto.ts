import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { StatusCommonEnum } from "@common/enums";
import { ToBooleanCustom } from "@common/decorators";
import { Product } from "../entities/product.entity";

export class ListProductDto extends PaginationOptionsDto<Product> {
    @ApiPropertyOptional({ description: "Search theo tên sản phẩm" })
    @IsOptional()
    searchName?: string;

    @ApiPropertyOptional({ description: "Search theo SKU" })
    @IsOptional()
    searchSku?: string;

    @ApiPropertyOptional({ description: "Trạng thái", enum: StatusCommonEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;

    @ApiPropertyOptional({ description: "Filter theo brandId" })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    brandId?: number;

    @ApiPropertyOptional({ description: "Filter theo categoryId" })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    categoryId?: number;

    @ApiPropertyOptional({ description: "Chỉ lấy best-seller" })
    @IsOptional()
    @ToBooleanCustom()
    @IsBoolean()
    isBestSeller?: boolean;

    @ApiPropertyOptional({ description: "Giá min (so với cột price)" })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minPrice?: number;

    @ApiPropertyOptional({ description: "Giá max (so với cột price)" })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxPrice?: number;
}
