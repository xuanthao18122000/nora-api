import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsEnum,
    IsInt,
    IsObject,
    IsOptional,
    IsString,
    Length,
    Min,
} from "class-validator";
import { StatusCommonEnum } from "@common/enums";

export class CreateCategoryDto {
    @ApiPropertyOptional({ description: "ID category cha (null = root)" })
    @IsOptional()
    @IsInt()
    parentId?: number;

    @ApiProperty({ example: "Thiết bị hồ bơi" })
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
    description?: string;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    priority?: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    position?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 500)
    iconUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 500)
    thumbnailUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 500)
    canonicalUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 255)
    metaTitle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    metaDescription?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 500)
    metaKeywords?: string;

    @ApiPropertyOptional({ default: "noindex,nofollow" })
    @IsOptional()
    @IsString()
    @Length(0, 50)
    metaRobots?: string;

    @ApiPropertyOptional({ type: Object })
    @IsOptional()
    @IsObject()
    seoBaseSchema?: Record<string, unknown>;

    @ApiPropertyOptional({ enum: StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    @IsOptional()
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
