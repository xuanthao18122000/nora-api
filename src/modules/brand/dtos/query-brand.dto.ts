import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { StatusCommonEnum } from "@common/enums";
import { Brand } from "../entities/brand.entity";

export class ListBrandDto extends PaginationOptionsDto<Brand> {
    @ApiPropertyOptional({ description: "Search theo tên brand" })
    @IsOptional()
    searchName?: string;

    @ApiPropertyOptional({ description: "Trạng thái", enum: StatusCommonEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
