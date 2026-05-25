import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    IsArray,
    IsEnum,
    IsInt,
    IsObject,
    IsOptional,
    IsString,
    Length,
    Min,
    ValidateNested,
} from "class-validator";
import { StatusCommonEnum } from "@common/enums";
import { DeviceTypeEnum } from "../../enums";

export class CreatePageSectionItemDto {
    @ApiPropertyOptional({ description: "Loại item (vd banner, list_products, link)" })
    @IsOptional()
    @IsString()
    @Length(0, 255)
    type?: string;

    @ApiPropertyOptional({ description: "Tên item" })
    @IsOptional()
    @IsString()
    @Length(0, 255)
    name?: string;

    @ApiPropertyOptional({ description: "URL đích khi click" })
    @IsOptional()
    @IsString()
    @Length(0, 500)
    targetUrl?: string;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    position?: number;

    @ApiPropertyOptional({ description: "Dữ liệu (string, có thể là JSON stringified)" })
    @IsOptional()
    @IsString()
    data?: string;

    @ApiPropertyOptional({ type: Object })
    @IsOptional()
    @IsObject()
    extra?: Record<string, unknown>;

    @ApiPropertyOptional({ enum: DeviceTypeEnum, default: DeviceTypeEnum.ALL })
    @IsOptional()
    @IsEnum(DeviceTypeEnum)
    deviceType?: DeviceTypeEnum;

    @ApiPropertyOptional({ enum: StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}

export class CreatePageSectionDto {
    @ApiProperty({ description: "ID của page (UUID)", example: "uuid-string" })
    @IsString()
    pageId!: string;

    @ApiProperty({ description: "Loại section (vd banner, product, text, faq)" })
    @IsString()
    @Length(1, 255)
    type!: string;

    @ApiPropertyOptional({ description: "Mã key — FE map sang component" })
    @IsOptional()
    @IsString()
    @Length(0, 255)
    key?: string;

    @ApiPropertyOptional({ description: "Tên section" })
    @IsOptional()
    @IsString()
    @Length(0, 255)
    name?: string;

    @ApiPropertyOptional({ type: Object, description: "Schema/config riêng" })
    @IsOptional()
    @IsObject()
    extra?: Record<string, unknown>;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 255)
    url?: string;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    position?: number;

    @ApiPropertyOptional({ enum: StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;

    @ApiPropertyOptional({ type: [CreatePageSectionItemDto], description: "Items của section" })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePageSectionItemDto)
    items?: CreatePageSectionItemDto[];
}
