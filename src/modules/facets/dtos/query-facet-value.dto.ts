import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { StatusCommonEnum } from "@common/enums";
import { FacetValue } from "../entities/facet-value.entity";

export class ListFacetValueDto extends PaginationOptionsDto<FacetValue> {
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
}
