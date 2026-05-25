import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { PaginationOptionsDto } from "@common/dtos";
import { OrderStatusEnum, PaymentMethodEnum } from "../enums";
import { Order } from "../entities/order.entity";

export class ListOrderDto extends PaginationOptionsDto<Order> {
    @ApiPropertyOptional({ description: "Search theo tên khách" })
    @IsOptional()
    @IsString()
    customerName?: string;

    @ApiPropertyOptional({ description: "Search theo SĐT" })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ description: "Search theo email" })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ description: "Filter theo customerId" })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    customerId?: number;

    @ApiPropertyOptional({ enum: OrderStatusEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(OrderStatusEnum)
    status?: OrderStatusEnum;

    @ApiPropertyOptional({ enum: PaymentMethodEnum })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(PaymentMethodEnum)
    paymentMethod?: PaymentMethodEnum;
}
