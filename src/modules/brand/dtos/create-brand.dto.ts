import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Length,
    Min,
} from "class-validator";
import { StatusCommonEnum } from "@common/enums";

export class CreateBrandDto {
    @ApiProperty({ example: "Pinaco" })
    @IsString()
    @Length(1, 255)
    name!: string;

    @ApiPropertyOptional({ description: "Auto-generate từ name nếu để trống" })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    slug?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 500)
    logoUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    priority?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 255)
    metaTitle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    metaDescription?: string;

    @ApiPropertyOptional({ enum: StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    @IsOptional()
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
