import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsObject, IsOptional, Min } from "class-validator";

export class OrderItemDto {
    @ApiProperty({ description: "ID sản phẩm" })
    @Type(() => Number)
    @IsInt()
    productId!: number;

    @ApiProperty({ description: "Số lượng", default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity!: number;

    @ApiPropertyOptional({ type: Object, description: "Thuộc tính đã chọn (màu/size/...)" })
    @IsOptional()
    @IsObject()
    selectedAttributes?: Record<string, unknown>;
}
