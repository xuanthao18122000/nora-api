import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { CommentTargetTypeEnum } from "../enums";

export class ReplyCommentDto {
    @ApiProperty({ enum: CommentTargetTypeEnum })
    @IsNotEmpty()
    @IsEnum(CommentTargetTypeEnum)
    targetType!: CommentTargetTypeEnum;

    @ApiProperty({ example: "Cảm ơn bạn đã quan tâm." })
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
