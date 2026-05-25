import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { OrderService } from "../../services/order.service";
import { CreateOrderDto } from "../../dtos/create-order.dto";
import { ListOrderDto } from "../../dtos/query-order.dto";
import { CheckoutSummaryDto } from "../../dtos/checkout-summary.dto";

@Controller("fe/orders")
@ApiTags("[FE] ORDER")
export class OrderControllerForFE {
    constructor(private readonly orderService: OrderService) {}

    @Post("checkout-summary")
    @ApiOperation({ summary: "Lấy thông tin sản phẩm để hiển thị trang checkout" })
    checkoutSummary(@Body() dto: CheckoutSummaryDto) {
        return this.orderService.checkoutSummary(dto);
    }

    @Get("by-phone")
    @ApiOperation({ summary: "Tra cứu đơn theo SĐT khách hàng" })
    findByPhone(@Query("phone") phone: string) {
        return this.orderService.findByPhone(phone ?? "");
    }

    @Get(":id/tracking")
    @ApiOperation({ summary: "Tra cứu đơn theo id + phone (bảo vệ)" })
    tracking(
        @Param("id", ParseIntPipe) id: number,
        @Query("phone") phone: string,
    ) {
        return this.orderService.findTracking(id, phone ?? "");
    }

    @Post()
    @ApiOperation({ summary: "Khách hàng đặt đơn" })
    create(@Body() dto: CreateOrderDto) {
        return this.orderService.create(dto);
    }

    @Get(":id")
    @ApiOperation({ summary: "Tra cứu đơn theo id" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.orderService.findOne(id);
    }

    @Get("customer/:customerId")
    @ApiOperation({ summary: "Lịch sử đơn của 1 customer" })
    findByCustomer(
        @Param("customerId", ParseIntPipe) customerId: number,
        @Query() query: ListOrderDto,
    ) {
        return this.orderService.findByCustomer(customerId, query);
    }
}
