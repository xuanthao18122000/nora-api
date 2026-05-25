import { ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsInt, IsOptional } from "class-validator";

/**
 * Đánh dấu nhiều NotificationDetail là đã đọc.
 * Bỏ trống ids → đánh dấu tất cả thông báo của user hiện tại.
 */
export class MarkSeenDto {
    @ApiPropertyOptional({
        type: [Number],
        description: "List notificationDetail.id cần mark seen. Bỏ trống = mark all.",
    })
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsInt({ each: true })
    ids?: number[];
}
