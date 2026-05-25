import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    ValidateNested,
} from "class-validator";

/**
 * Import products từ web cũ.
 *
 * Mỗi product có `categories[]` flat với `id` + `parentId` (số nguyên của hệ cũ).
 * Service tự build tree theo `parentId` map → upsert Category theo slug, link parent,
 * rồi link M:N với product.
 *
 * Re-run safe: slug/SKU đã tồn tại → skip (default) hoặc upsert.
 */

/** Category nested trong product — schema từ web cũ (parentId là số). */
export class ImportCategoryRefDto {
    @ApiProperty({ description: "ID hệ cũ (dùng để link parent qua parentId trong cùng payload)" })
    @IsInt()
    id!: number;

    @ApiProperty({ example: "Thiết bị hồ bơi" })
    @IsString()
    name!: string;

    @ApiProperty({ example: "thiet-bi-ho-boi" })
    @IsString()
    slug!: string;

    @ApiPropertyOptional({ description: "parentId hệ cũ — null nếu là cấp 1" })
    @IsOptional()
    parentId?: number | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    displayOrder?: number;
}

/**
 * Product item — chấp nhận các field dư của web cũ (id, viewCount, isFeatured, isNew, ...).
 * DTO không validate strict (whitelist global pipe sẽ strip), service chỉ map field cần.
 */
export class ImportProductItemDto {
    @ApiProperty({ example: "Máy lọc nước hồ bơi Hayward Super Pump 1.5HP" })
    @IsString()
    name!: string;

    @ApiProperty({ example: "ac-quy-gs-mf-q85-12v-65ah" })
    @IsString()
    slug!: string;

    @ApiProperty({ example: "CQQGMQ68512" })
    @IsString()
    sku!: string;

    @ApiPropertyOptional({ description: "String hoặc number — service cast sang number" })
    @IsOptional()
    price?: string | number;

    @ApiPropertyOptional()
    @IsOptional()
    salePrice?: string | number | null;

    @ApiPropertyOptional()
    @IsOptional()
    costPrice?: string | number | null;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    stockQuantity?: number;

    @ApiPropertyOptional()
    @IsOptional()
    shortDescription?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    description?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    unit?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    thumbnailUrl?: string | null;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    images?: string[] | null;

    @ApiPropertyOptional()
    @IsOptional()
    origin?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    barcode?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    priority?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isBestSeller?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    showPrice?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    metaTitle?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    metaDescription?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    metaKeywords?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    metaRobots?: string;

    @ApiPropertyOptional()
    @IsOptional()
    canonicalUrl?: string | null;

    @ApiPropertyOptional({ type: Object })
    @IsOptional()
    @IsObject()
    seoBaseSchema?: Record<string, unknown> | null;

    @ApiPropertyOptional({
        type: [ImportCategoryRefDto],
        description: "Categories nested — service tự build tree theo parentId.",
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImportCategoryRefDto)
    categories?: ImportCategoryRefDto[];
}

export class ImportPayloadDto {
    @ApiPropertyOptional({
        description:
            "skip = nếu slug/SKU tồn tại thì bỏ qua (default). upsert = update record cũ.",
        enum: ["skip", "upsert"],
        default: "skip",
    })
    @IsOptional()
    @IsString()
    mode?: "skip" | "upsert";

    @ApiProperty({ type: [ImportProductItemDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ImportProductItemDto)
    products!: ImportProductItemDto[];
}
