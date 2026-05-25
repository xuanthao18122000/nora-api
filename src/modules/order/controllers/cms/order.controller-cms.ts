import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { OrderService } from "../../services/order.service";
import { CreateOrderDto } from "../../dtos/create-order.dto";
import { UpdateOrderDto } from "../../dtos/update-order.dto";
import { UpdateOrderStatusDto } from "../../dtos/update-order-status.dto";
import { ListOrderDto } from "../../dtos/query-order.dto";

@Controller("cms/orders")
@ApiTags("[CMS] ORDER")
@ApiBearerAuth()
export class OrderControllerForCMS {
    constructor(private readonly orderService: OrderService) {}

    @Post()
    @ApiOperation({ summary: "Tạo order (admin tạo thay khách)" })
    create(@Body() dto: CreateOrderDto) {
        return this.orderService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: "Danh sách order" })
    findAll(@Query() query: ListOrderDto) {
        return this.orderService.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Chi tiết order" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.orderService.findOne(id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật thông tin order (không sửa items)" })
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
        return this.orderService.update(id, dto);
    }

    @Patch(":id/status")
    @ApiOperation({ summary: "Đổi trạng thái order theo quy trình" })
    updateStatus(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateOrderStatusDto,
    ) {
        return this.orderService.updateStatus(id, dto);
    }
}
