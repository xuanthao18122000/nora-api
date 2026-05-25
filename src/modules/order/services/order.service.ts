import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { DeletedEnum } from "@common/enums";
import { paginatedResponse } from "@common/helpers";
import { CustomerService } from "@modules/customer/services/customer.service";
import { TelegramService } from "@modules/telegram/telegram.service";
import { Product } from "../../product/entities/product.entity";
import { Order } from "../entities/order.entity";
import { OrderItem } from "../entities/order-item.entity";
import { OrderStatusEnum } from "../enums";
import { CreateOrderDto } from "../dtos/create-order.dto";
import { UpdateOrderDto } from "../dtos/update-order.dto";
import { UpdateOrderStatusDto } from "../dtos/update-order-status.dto";
import { ListOrderDto } from "../dtos/query-order.dto";
import { CheckoutSummaryDto } from "../dtos/checkout-summary.dto";

const STATUS_TRANSITIONS: Record<OrderStatusEnum, OrderStatusEnum[]> = {
    [OrderStatusEnum.NEW]: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.CONFIRMED]: [OrderStatusEnum.SHIPPING, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.SHIPPING]: [OrderStatusEnum.COMPLETED, OrderStatusEnum.CANCELLED],
    [OrderStatusEnum.COMPLETED]: [],
    [OrderStatusEnum.CANCELLED]: [],
};

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepo: EntityRepository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepo: EntityRepository<OrderItem>,
        @InjectRepository(Product)
        private readonly productRepo: EntityRepository<Product>,
        private readonly em: EntityManager,
        private readonly customerService: CustomerService,
        private readonly telegramService: TelegramService,
    ) {}

    async create(dto: CreateOrderDto): Promise<Order> {
        // 1. Tìm hoặc tạo customer theo phone (định danh khách hàng)
        const customer = await this.customerService.findOrCreateByPhone({
            name: dto.customerName,
            phoneNumber: dto.phone,
            email: dto.email,
            address: dto.shippingAddress,
        });

        // 2. Validate products + snapshot
        const productIds = dto.items.map((i) => i.productId);
        const products = await this.productRepo.find({
            id: { $in: productIds },
            deleted: DeletedEnum.AVAILABLE,
        });
        const productMap = new Map(products.map((p) => [p.id, p]));

        const missing = productIds.filter((id) => !productMap.has(id));
        if (missing.length) {
            throw new BadRequestException(
                `Sản phẩm không tồn tại hoặc đã bị xoá: ${missing.join(", ")}`,
            );
        }

        // 3. Tạo order gắn với customer
        const order = this.orderRepo.create({
            customer,
            customerName: dto.customerName,
            phone: dto.phone,
            email: dto.email,
            shippingAddress: dto.shippingAddress,
            note: dto.note,
            paymentMethod: dto.paymentMethod ?? undefined,
            totalAmount: 0,
        });

        let totalAmount = 0;
        for (const itemDto of dto.items) {
            const product = productMap.get(itemDto.productId)!;
            const unitPrice = Number(product.salePrice ?? product.price);
            const totalPrice = unitPrice * itemDto.quantity;

            const item = this.orderItemRepo.create({
                order,
                product,
                productName: product.name,
                productSlug: product.slug,
                quantity: itemDto.quantity,
                unitPrice,
                totalPrice,
                selectedAttributes: itemDto.selectedAttributes,
            });
            order.items.add(item);
            totalAmount += totalPrice;
        }
        order.totalAmount = totalAmount;

        await this.em.persist(order).flush();

        // 4. Cập nhật metric customer (đặt cuối để không kẹt order nếu lỗi)
        await this.customerService.incrementOrderStats(customer.id, totalAmount);

        // 5. Notify Telegram (fire-and-forget)
        this.telegramService.sendOrderNotification(order);

        return this.findOne(order.id);
    }

    async findAll(query: ListOrderDto) {
        const qb = this.em
            .createQueryBuilder(Order, "order")
            .fSetQuery(query)
            .fAndWhereLike("customerName")
            .fAndWhereLike("phone")
            .fAndWhereLike("email")
            .fAndWhere("customerId")
            .fAndWhere("status")
            .fAndWhere("paymentMethod")
            .fAndWhereDateRange("createdAt", query.createdAtFrom, query.createdAtTo)
            .fAndWhereDateRange("updatedAt", query.updatedAtFrom, query.updatedAtTo)
            .fAddPagination()
            .fAddOrderBy({ id: QueryOrder.DESC });

        const [orders, total] = await qb.getResultAndCount();

        if (orders.length > 0) {
            await this.em.populate(orders, ["customer", "items", "items.product"]);
        }

        return paginatedResponse(orders, total, query);
    }

    async findOne(id: number) {
        const order = await this.em.findOne(
            Order,
            { id },
            { populate: ["customer", "items", "items.product"] },
        );
        if (!order) throw new NotFoundException(`Order #${id} không tồn tại`);
        return order;
    }

    async update(id: number, dto: UpdateOrderDto) {
        const order = await this.findOne(id);

        if (
            order.status === OrderStatusEnum.COMPLETED ||
            order.status === OrderStatusEnum.CANCELLED
        ) {
            throw new BadRequestException("Đơn đã hoàn tất/hủy, không thể sửa");
        }

        wrap(order).assign(dto, { mergeObjectProperties: true });
        await this.em.flush();
        return order;
    }

    async updateStatus(id: number, dto: UpdateOrderStatusDto) {
        const order = await this.findOne(id);
        const allowed = STATUS_TRANSITIONS[order.status];
        if (!allowed.includes(dto.status)) {
            throw new BadRequestException(
                `Không thể chuyển status từ ${order.status} → ${dto.status}`,
            );
        }

        const patch: Partial<Order> = { status: dto.status };
        if (dto.status === OrderStatusEnum.CONFIRMED) patch.confirmedAt = new Date();
        if (dto.status === OrderStatusEnum.COMPLETED) patch.completedAt = new Date();

        wrap(order).assign(patch);
        await this.em.flush();
        return order;
    }

    async findByCustomer(customerId: number, query: ListOrderDto) {
        return this.findAll({ ...query, customerId });
    }

    /** Tra cứu chi tiết: id + phone phải khớp (bảo vệ chủ đơn). */
    async findTracking(id: number, phone: string) {
        const order = await this.findOne(id);
        const phoneTrimmed = phone.trim();
        if (!phoneTrimmed || order.phone !== phoneTrimmed) {
            throw new NotFoundException(`Không tìm thấy đơn hàng.`);
        }
        return order;
    }

    /** Storefront tra cứu: list đơn theo SĐT (exact match), sort mới nhất trước. */
    async findByPhone(phone: string) {
        const phoneTrimmed = phone.trim();
        if (!phoneTrimmed) return { items: [] as Order[] };

        const orders = await this.em.find(
            Order,
            { phone: phoneTrimmed },
            {
                populate: ["items", "items.product"],
                orderBy: { createdAt: QueryOrder.DESC, id: QueryOrder.DESC },
                limit: 50,
            },
        );
        return { items: orders };
    }

    /**
     * Trả về thông tin sản phẩm để hiển thị trang checkout.
     * FE truyền danh sách { productId, quantity }, BE lookup giá hiện tại + snapshot info.
     */
    async checkoutSummary(dto: CheckoutSummaryDto) {
        const productIds = dto.items.map((i) => i.productId);
        const products = await this.productRepo.find({
            id: { $in: productIds },
            deleted: DeletedEnum.AVAILABLE,
        });
        const productMap = new Map(products.map((p) => [p.id, p]));

        const missing = productIds.filter((id) => !productMap.has(id));
        if (missing.length) {
            throw new BadRequestException(
                `Sản phẩm không tồn tại hoặc đã bị xoá: ${missing.join(", ")}`,
            );
        }

        let subtotal = 0;
        const items = dto.items.map((line) => {
            const product = productMap.get(line.productId)!;
            const unitPrice = Number(product.salePrice ?? product.price);
            const originalPrice = Number(product.price);
            const lineTotal = unitPrice * line.quantity;
            subtotal += lineTotal;

            return {
                productId: product.id,
                name: product.name,
                slug: product.slug,
                sku: product.sku,
                thumbnailUrl: product.thumbnailUrl ?? null,
                unitPrice,
                originalPrice:
                    product.salePrice && originalPrice > unitPrice
                        ? originalPrice
                        : null,
                quantity: line.quantity,
                lineTotal,
            };
        });

        return {
            items,
            subtotal,
            shippingFee: 0,
            total: subtotal,
        };
    }
}
