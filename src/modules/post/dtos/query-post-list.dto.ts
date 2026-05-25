import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { StatusCommonEnum } from "@common/enums";
import { PostList } from "../entities/post-list.entity";

export class ListPostListDto extends PaginationOptionsDto<PostList> {
    @ApiPropertyOptional({ description: "Search theo name" })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ enum: StatusCommonEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
