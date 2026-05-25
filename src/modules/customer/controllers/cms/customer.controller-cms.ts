import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CustomerService } from "../../services/customer.service";
import { CreateCustomerDto } from "../../dtos/create-customer.dto";
import { UpdateCustomerDto } from "../../dtos/update-customer.dto";
import { ListCustomerDto } from "../../dtos/query-customer.dto";

@Controller("cms/customers")
@ApiTags("[CMS] CUSTOMER")
@ApiBearerAuth()
export class CustomerControllerForCMS {
    constructor(private readonly customerService: CustomerService) {}

    @Post()
    @ApiOperation({ summary: "Tạo khách hàng" })
    create(@Body() dto: CreateCustomerDto) {
        return this.customerService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: "Danh sách khách hàng" })
    findAll(@Query() query: ListCustomerDto) {
        return this.customerService.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Chi tiết khách hàng" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.customerService.findOne(id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật khách hàng" })
    update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCustomerDto) {
        return this.customerService.update(id, dto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Xoá mềm khách hàng" })
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.customerService.remove(id);
    }
}
