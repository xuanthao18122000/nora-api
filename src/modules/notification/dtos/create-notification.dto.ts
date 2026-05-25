import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    ArrayUnique,
    IsArray,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Length,
    ValidateIf,
} from "class-validator";
import { NotificationRedirectTypeEnum, NotificationTypeReceiverEnum } from "../enums";

export class CreateNotificationDto {
    @ApiProperty({ example: "Đơn hàng #123 cần duyệt" })
    @IsString()
    @Length(1, 2000)
    title!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    body?: string;

    @ApiPropertyOptional({
        enum: NotificationTypeReceiverEnum,
        default: NotificationTypeReceiverEnum.PRIVATE,
    })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(NotificationTypeReceiverEnum)
    receiverType?: NotificationTypeReceiverEnum;

    @ApiPropertyOptional({
        type: [Number],
        description: "Bắt buộc khi receiverType = PRIVATE. Bỏ trống khi receiverType = ALL.",
    })
    @ValidateIf((o) => o.receiverType !== NotificationTypeReceiverEnum.ALL)
    @IsArray()
    @ArrayUnique()
    @IsInt({ each: true })
    receivers?: number[];

    @ApiPropertyOptional({
        enum: NotificationRedirectTypeEnum,
        default: NotificationRedirectTypeEnum.ORDER,
    })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(NotificationRedirectTypeEnum)
    redirectType?: NotificationRedirectTypeEnum;

    @ApiPropertyOptional({ description: "ID entity liên quan (vd orderId)" })
    @IsOptional()
    @IsString()
    @Length(0, 36)
    entityRefId?: string;
}
