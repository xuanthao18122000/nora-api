import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    Length,
    ValidateNested,
} from "class-validator";
import { PaymentMethodEnum } from "../enums";
import { OrderItemDto } from "./order-item.dto";

/**
 * Customer được tự lookup theo `phone` ở OrderService (findOrCreateByPhone).
 * Caller không truyền customerId.
 */
export class CreateOrderDto {
    @ApiProperty({ example: "Nguyễn Văn A" })
    @IsString()
    @Length(1, 255)
    customerName!: string;

    @ApiProperty({ example: "0901234567" })
    @IsString()
    @Length(8, 20)
    phone!: string;

    @ApiProperty({ example: "user@example.com" })
    @IsEmail()
    @Length(1, 255)
    email!: string;

    @ApiProperty({ example: "Số 1, Đường ABC, Quận 1, TP. HCM" })
    @IsString()
    shippingAddress!: string;

    @ApiPropertyOptional({ description: "Ghi chú khách hàng" })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiPropertyOptional({ enum: PaymentMethodEnum, default: PaymentMethodEnum.COD })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(PaymentMethodEnum)
    paymentMethod?: PaymentMethodEnum;

    @ApiProperty({ type: [OrderItemDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items!: OrderItemDto[];
}
