import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
    IsBoolean,
    IsEnum,
    IsObject,
    IsOptional,
    IsString,
    Length,
    MaxLength,
} from "class-validator";
import { StatusCommonEnum } from "@common/enums";
import { PageTypeEnum } from "../../enums";

export class CreatePageDto {
    @ApiPropertyOptional({ description: "Mã code (vd home_page, layout_page)" })
    @IsOptional()
    @IsString()
    @Length(0, 255)
    code?: string;

    @ApiProperty({
        description: "Slug — sẽ được trim ký tự '/' đầu/cuối. Slug rỗng = trang home (route `/`)",
        example: "khuyen-mai-tet",
    })
    @Transform(({ value }: { value: unknown }) => {
        if (typeof value !== "string") return value;
        return value.trim().replace(/^\/+|\/+$/g, "");
    })
    @IsString()
    @MaxLength(255)
    slug!: string;

    @ApiProperty({ enum: PageTypeEnum, example: PageTypeEnum.CUSTOM })
    @IsEnum(PageTypeEnum)
    type!: PageTypeEnum;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({ enum: StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;

    @ApiPropertyOptional({ type: Object })
    @IsOptional()
    @IsObject()
    pageData?: Record<string, unknown>;

    // SEO
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    metaTitle?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(500)
    metaDescription?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    seoImage?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    canonicalUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(255)
    seoKeywords?: string;

    @ApiPropertyOptional({ type: Object })
    @IsOptional()
    @IsObject()
    seoBaseSchema?: Record<string, unknown>;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @Transform(({ value }: { value: unknown }) => {
        if (value === "true" || value === 1 || value === true) return true;
        if (value === "false" || value === 0 || value === false) return false;
        return value;
    })
    @IsBoolean()
    isSitemap?: boolean;

    @ApiPropertyOptional({ default: "noindex,nofollow" })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    seoRobots?: string;
}
