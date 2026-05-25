import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";
import { StatusCommonEnum } from "@common/enums";

export class CreateFacetValueDto {
    @ApiProperty({ description: "ID của facet" })
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    facetId!: number;

    @ApiProperty({ description: "Khóa: gaming, 8gb, snapdragon" })
    @IsNotEmpty()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    key!: string;

    @ApiProperty({ description: "Nhãn hiển thị: Chơi game, 8 GB, Snapdragon" })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    label!: string;

    @ApiPropertyOptional({ description: "Icon URL hoặc emoji" })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    @Transform(({ value }: { value: unknown }): unknown => (value === "" ? null : value))
    icon?: string;

    @ApiPropertyOptional({
        description: 'Metadata JSON: {"hex":"#FF0000","image":"url"}',
        type: Object,
    })
    @IsOptional()
    @IsObject()
    meta?: Record<string, unknown>;

    @ApiPropertyOptional({ enum: StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    @IsOptional()
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
