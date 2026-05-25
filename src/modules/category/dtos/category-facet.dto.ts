import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    Min,
    ValidateNested,
} from "class-validator";
import { StatusCommonEnum } from "@common/enums";

/**
 * Item của bulk-add: 1 facet kèm config (displayOrder, isVisible, status).
 */
export class AddCategoryFacetItemDto {
    @ApiProperty({ description: "ID của facet" })
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    facetId!: number;

    @ApiPropertyOptional({
        description: "Thứ tự hiển thị facet trong category",
        default: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    displayOrder?: number;

    @ApiPropertyOptional({
        description: "Bật/tắt facet trong category",
        default: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isVisible?: boolean;

    @ApiPropertyOptional({
        enum: StatusCommonEnum,
        default: StatusCommonEnum.ACTIVE,
    })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}

/**
 * Body cho `POST /cms/categories/:categoryId/facets` — bulk add nhiều facet vào category.
 */
export class AddFacetsToCategoryDto {
    @ApiProperty({
        description: "Danh sách facets để thêm vào category",
        type: [AddCategoryFacetItemDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AddCategoryFacetItemDto)
    items!: AddCategoryFacetItemDto[];
}

/**
 * Body cho `PATCH /cms/categories/:categoryId/facets/:facetId`.
 */
export class UpdateCategoryFacetDto {
    @ApiPropertyOptional({ description: "Thứ tự hiển thị" })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    displayOrder?: number;

    @ApiPropertyOptional({ description: "Hiển thị trong category" })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isVisible?: boolean;

    @ApiPropertyOptional({ enum: StatusCommonEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
