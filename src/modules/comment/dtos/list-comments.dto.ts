import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { CommentTargetTypeEnum } from "../enums";
import { Comment } from "../entities/comment.entity";

export class ListCommentsDto extends PaginationOptionsDto<Comment> {
    @ApiProperty({ enum: CommentTargetTypeEnum })
    @IsNotEmpty()
    @IsEnum(CommentTargetTypeEnum)
    targetType!: CommentTargetTypeEnum;

    @ApiProperty({ example: "12", description: "ID category hoặc product" })
    @IsNotEmpty()
    @Transform(({ value }) => (value == null ? value : String(value)))
    @IsString()
    targetId!: string;
}
