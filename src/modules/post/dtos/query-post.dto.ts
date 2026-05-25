import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { StatusCommonEnum } from "@common/enums";
import { Post } from "../entities/post.entity";

export class ListPostDto extends PaginationOptionsDto<Post> {
    @ApiPropertyOptional({ description: "Search theo tiêu đề" })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ description: "Search theo slug" })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional({ description: "Filter theo authorId" })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    authorId?: number;

    @ApiPropertyOptional({ description: "Filter theo postListId" })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    postListId?: number;

    @ApiPropertyOptional({
        description: "Tìm kiếm theo title / shortDescription / content (LIKE)",
    })
    @IsOptional()
    @IsString()
    search?: string;
}
