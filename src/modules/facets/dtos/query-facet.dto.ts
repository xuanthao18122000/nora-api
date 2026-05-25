import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { ToIntArray } from "@common/decorators/transform.decorator";
import { StatusCommonEnum } from "@common/enums";
import { Facet } from "../entities/facet.entity";

export class ListFacetDto extends PaginationOptionsDto<Facet> {
    @ApiPropertyOptional({
        description: "Search theo key hoặc label",
        required: false,
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        enum: StatusCommonEnum,
        description: "Lọc theo trạng thái",
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;

    @ApiPropertyOptional({
        description:
            "Loại bỏ các facet đã được gắn vào category này. " +
            "Dùng khi UI Category cần load list facet 'chưa gắn' để chọn thêm.",
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    excludeCategoryId?: number;

    @ApiPropertyOptional({
        description:
            "Lọc theo danh sách ID category (hỗ trợ format: categoryIds=1,2,3 hoặc categoryIds[]=1&categoryIds[]=2). " +
            "Trả về facet đã được gắn vào ít nhất 1 trong các category này.",
        required: false,
        type: [Number],
        example: [1, 2, 3],
    })
    @IsOptional()
    @ToIntArray()
    @IsArray()
    @IsInt({ each: true })
    categoryIds?: number[];
}
