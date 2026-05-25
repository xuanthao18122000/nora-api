import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { ToBooleanCustom } from "@common/decorators";
import { NotificationRedirectTypeEnum } from "../enums";
import { NotificationDetail } from "../entities/notification-detail.entity";

/**
 * List notification của user hiện tại — trả về NotificationDetail (mỗi user 1 row riêng để track seen).
 */
export class ListNotificationDto extends PaginationOptionsDto<NotificationDetail> {
    @ApiPropertyOptional({ description: "Search theo title" })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ description: "Chỉ lấy chưa đọc" })
    @IsOptional()
    @ToBooleanCustom()
    @IsBoolean()
    unreadOnly?: boolean;

    @ApiPropertyOptional({ enum: NotificationRedirectTypeEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(NotificationRedirectTypeEnum)
    redirectType?: NotificationRedirectTypeEnum;
}
