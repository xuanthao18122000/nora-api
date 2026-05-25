import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from "class-validator";
import { CreatePostDto } from "./create-post.dto";

/**
 * Bulk upsert payload — match theo `slug` (FE truyền slug đã có), không có
 * thì tự sinh từ `title`. Field thừa (vd categoryId, updatedBy, views,
 * publishedAt, author...) sẽ được bỏ qua nhờ ValidationPipe `whitelist: true`.
 */
export class BulkUpsertPostsDto {
    @ApiProperty({ type: [CreatePostDto], description: "Mảng post cần upsert" })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(500)
    @ValidateNested({ each: true })
    @Type(() => CreatePostDto)
    items!: CreatePostDto[];
}
