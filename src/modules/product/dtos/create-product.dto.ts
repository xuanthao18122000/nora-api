import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    Length,
    Min,
} from "class-validator";
import { StatusCommonEnum } from "@common/enums";

export class CreateProductDto {
    @ApiProperty({ example: "Máy bơm hồ bơi Hayward Super Pump 1.5HP" })
    @IsString()
    @Length(1, 255)
    name!: string;

    @ApiPropertyOptional({ description: "Auto-generate từ name nếu để trống" })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    slug?: string;

    @ApiProperty({ example: "PNC-N50-001" })
    @IsString()
    @Length(1, 50)
    sku!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 500)
    shortDescription?: string;

    @ApiPropertyOptional({ description: "HTML content" })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ default: 0 })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price!: number;

    @ApiPropertyOptional({ description: "Giá khuyến mãi" })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salePrice?: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    costPrice?: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    stockQuantity?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 50)
    unit?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 500)
    thumbnailUrl?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    images?: string[];

    @ApiPropertyOptional({ description: "ID của brand" })
    @IsOptional()
    @IsInt()
    brandId?: number;

    @ApiPropertyOptional({ description: "Danh sách ID category", type: [Number] })
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsInt({ each: true })
    categoryIds?: number[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 255)
    origin?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 100)
    barcode?: string;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    priority?: number;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    isBestSeller?: boolean;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    showPrice?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 255)
    metaTitle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    metaDescription?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 500)
    metaKeywords?: string;

    @ApiPropertyOptional({ default: "index,follow" })
    @IsOptional()
    @IsString()
    @Length(0, 50)
    metaRobots?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 500)
    canonicalUrl?: string;

    @ApiPropertyOptional({ type: Object })
    @IsOptional()
    @IsObject()
    seoBaseSchema?: Record<string, unknown>;

    @ApiPropertyOptional({ enum: StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    @IsOptional()
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
