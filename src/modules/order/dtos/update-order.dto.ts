import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateOrderDto } from "./create-order.dto";

/**
 * Admin chỉ được sửa thông tin liên hệ/giao hàng/ghi chú/payment method.
 * Items KHÔNG sửa qua đây — đơn đã chốt thì không sửa item; nếu sai thì hủy + tạo mới.
 * Status có endpoint riêng update-status.
 */
export class UpdateOrderDto extends PartialType(OmitType(CreateOrderDto, ["items"] as const)) {}
