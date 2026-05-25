import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
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
    ValidateNested,
} from "class-validator";
import { StatusCommonEnum } from "@common/enums";

export class ImportProductItem {
    @ApiProperty({ description: "Slug — dùng để tra cứu (có thì update, không có thì tạo mới)" })
    @IsString()
    @Length(1, 255)
    slug!: string;

    @ApiProperty()
    @IsString()
    @Length(1, 255)
    name!: string;

    @ApiProperty()
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

    @ApiProperty({ description: "Có thể truyền dạng string '3290000.00'" })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    price!: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    salePrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    costPrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
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

    @ApiPropertyOptional({ description: "ID brand" })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    brandId?: number;

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

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    priority?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    viewCount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    soldCount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    averageRating?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    reviewCount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isBestSeller?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isNew?: boolean;

    @ApiPropertyOptional()
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

    @ApiPropertyOptional()
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

    @ApiPropertyOptional({ enum: StatusCommonEnum })
    @IsOptional()
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}

export class ImportProductsDto {
    @ApiProperty({ type: [ImportProductItem] })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(500)
    @ValidateNested({ each: true })
    @Type(() => ImportProductItem)
    items!: ImportProductItem[];
}

export interface ImportProductResult {
    slug: string;
    sku: string;
    action: "created" | "updated" | "skipped";
    id?: number;
    error?: string;
}

export interface ImportProductsResponse {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    results: ImportProductResult[];
}
