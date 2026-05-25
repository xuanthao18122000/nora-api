import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { CommentTargetTypeEnum } from "../enums";

export class CreateCommentDto {
    @ApiProperty({ enum: CommentTargetTypeEnum })
    @IsNotEmpty()
    @IsEnum(CommentTargetTypeEnum)
    targetType!: CommentTargetTypeEnum;

    @ApiProperty({ example: "123", description: "ID category/product (number hoặc string đều OK)" })
    @IsNotEmpty()
    @Transform(({ value }) => (value == null ? value : String(value)))
    @IsString()
    targetId!: string;

    @ApiProperty({ example: "Sản phẩm này còn hàng không ạ?" })
    @IsNotEmpty()
    @IsString()
    @MaxLength(2000)
    content!: string;

    @ApiPropertyOptional({ example: "Nguyễn Văn A" })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    customerName?: string;
}
