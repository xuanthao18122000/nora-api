import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Length,
} from "class-validator";
import { StatusCommonEnum } from "@common/enums";

export class CreatePostDto {
    @ApiProperty({ example: "Hướng dẫn lắp đặt thiết bị hồ bơi gia đình" })
    @IsString()
    @Length(1, 255)
    title!: string;

    @ApiPropertyOptional({ description: "Auto-generate từ title nếu để trống" })
    @IsOptional()
    @IsString()
    @Length(1, 255)
    slug?: string;

    @ApiPropertyOptional({ description: "Nội dung HTML" })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({ description: "Mô tả ngắn / tóm tắt" })
    @IsOptional()
    @IsString()
    shortDescription?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @Length(0, 500)
    featuredImage?: string;

    @ApiPropertyOptional({ description: "ID tác giả" })
    @IsOptional()
    @IsInt()
    authorId?: number;

    @ApiPropertyOptional({ description: "ID danh sách bài viết (PostList)" })
    @IsOptional()
    @IsInt()
    postListId?: number;

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

    @ApiPropertyOptional({ enum: StatusCommonEnum, default: StatusCommonEnum.ACTIVE })
    @IsOptional()
    @IsEnum(StatusCommonEnum)
    status?: StatusCommonEnum;
}
