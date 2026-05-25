import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { StatusCommonEnum } from "@common/enums";
import { PageTypeEnum } from "../../enums";
import { Page } from "../../entities/page.entity";

export class ListPageDto extends PaginationOptionsDto<Page> {
    @ApiPropertyOptional({ description: "Search theo title" })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ description: "Search theo slug" })
    @IsOptional()
    @IsString()
    slug?: string;

    @ApiPropertyOptional({ description: "Search theo code" })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional({ enum: PageTypeEnum })
    @IsOptional()
    @IsEnum(PageTypeEnum)
    type?: PageTypeEnum;

    @ApiPropertyOptional({ enum: StatusCommonEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
