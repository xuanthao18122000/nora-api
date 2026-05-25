import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { StatusCommonEnum } from "@common/enums";
import { PageSection } from "../../entities/page-section.entity";

export class ListPageSectionDto extends PaginationOptionsDto<PageSection> {
    @ApiPropertyOptional({ description: "Filter theo pageId" })
    @IsOptional()
    @IsString()
    pageId?: string;

    @ApiPropertyOptional({ description: "Filter theo type" })
    @IsOptional()
    @IsString()
    type?: string;

    @ApiPropertyOptional({ description: "Filter theo key" })
    @IsOptional()
    @IsString()
    key?: string;

    @ApiPropertyOptional({ enum: StatusCommonEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
