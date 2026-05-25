import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { StatusCommonEnum } from "@common/enums";
import { ToBooleanCustom } from "@common/decorators";
import { Category } from "../entities/category.entity";

export class ListCategoryDto extends PaginationOptionsDto<Category> {
    @ApiPropertyOptional({ description: "Search theo tên category" })
    @IsOptional()
    searchName?: string;

    @ApiPropertyOptional({ description: "Search theo slug" })
    @IsOptional()
    searchSlug?: string;

    @ApiPropertyOptional({ description: "Trạng thái", enum: StatusCommonEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;

    @ApiPropertyOptional({ description: "Filter theo parentId (truyền 0 = root only)" })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    parentId?: number;

    @ApiPropertyOptional({ description: "Trả về dạng cây (children lồng nhau)" })
    @IsOptional()
    @ToBooleanCustom()
    @IsBoolean()
    tree?: boolean;
}
