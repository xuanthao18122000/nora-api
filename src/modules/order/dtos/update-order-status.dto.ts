import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum } from "class-validator";
import { OrderStatusEnum } from "../enums";

export class UpdateOrderStatusDto {
    @ApiProperty({ enum: OrderStatusEnum, description: "Trạng thái mới" })
    @Type(() => Number)
    @IsEnum(OrderStatusEnum)
    status!: OrderStatusEnum;
}
