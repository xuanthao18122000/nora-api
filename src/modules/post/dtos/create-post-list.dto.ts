import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, Length } from "class-validator";
import { StatusCommonEnum } from "@common/enums";

export class CreatePostListDto {
    @ApiProperty({ example: "Tin tức" })
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

    @ApiPropertyOptional({ enum: StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    @IsOptional()
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
