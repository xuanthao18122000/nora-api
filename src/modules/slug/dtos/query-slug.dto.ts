import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { SlugTypeEnum } from "../enums";
import { Slug } from "../entities/slug.entity";

export class ListSlugDto extends PaginationOptionsDto<Slug> {
    @ApiPropertyOptional({ description: "Search theo slug (LIKE)" })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional({ enum: SlugTypeEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(SlugTypeEnum)
    type?: SlugTypeEnum;

    @ApiPropertyOptional({ description: "Filter theo entityId" })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    entityId?: number;
}
