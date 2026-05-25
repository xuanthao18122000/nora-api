import { EntityRepository, QueryOrder, raw, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { DeletedEnum } from "@common/enums";
import { paginatedResponse } from "@common/helpers";
import { Customer } from "../entities/customer.entity";
import { CreateCustomerDto } from "../dtos/create-customer.dto";
import { UpdateCustomerDto } from "../dtos/update-customer.dto";
import { ListCustomerDto } from "../dtos/query-customer.dto";

interface FindOrCreateInput {
    name: string;
    phoneNumber: string;
    email?: string;
    address?: string;
}

@Injectable()
export class CustomerService {
    constructor(
        @InjectRepository(Customer)
        private readonly customerRepo: EntityRepository<Customer>,
        private readonly em: EntityManager,
    ) {}

    async create(dto: CreateCustomerDto): Promise<Customer> {
        await this.assertPhoneAvailable(dto.phoneNumber);
        const customer = this.customerRepo.create(dto);
        await this.em.persist(customer).flush();
        return customer;
    }

    async findAll(query: ListCustomerDto) {
        const qb = this.em
            .createQueryBuilder(Customer, "customer")
            .fSetQuery(query)
            .fOnlyActive()
            .fAndWhereLike("name")
            .fAndWhereLike("phoneNumber")
            .fAndWhereLike("email")
            .fAndWhere("status")
            .fAndWhereDateRange("createdAt", query.createdAtFrom, query.createdAtTo)
            .fAndWhereDateRange("updatedAt", query.updatedAtFrom, query.updatedAtTo)
            .fAddPagination()
            .fAddOrderBy({ id: QueryOrder.DESC });

        const [items, total] = await qb.getResultAndCount();
        return paginatedResponse(items, total, query);
    }

    async findOne(id: number) {
        const customer = await this.customerRepo.findOne({
            id,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (!customer) throw new NotFoundException(`Customer #${id} không tồn tại`);
        return customer;
    }

    async findByPhone(phoneNumber: string) {
        return this.customerRepo.findOne({
            phoneNumber,
            deleted: DeletedEnum.AVAILABLE,
        });
    }

    /**
     * Order module gọi khi tạo đơn:
     *   - Tìm customer theo phoneNumber, có rồi → trả về (cập nhật name/email/address nếu thiếu).
     *   - Chưa có → tạo mới.
     */
    async findOrCreateByPhone(input: FindOrCreateInput): Promise<Customer> {
        const existing = await this.findByPhone(input.phoneNumber);
        if (existing) {
            // Bổ sung thông tin còn thiếu nhưng KHÔNG ghi đè dữ liệu đã có
            const patch: Partial<Customer> = {};
            if (!existing.email && input.email) patch.email = input.email;
            if (!existing.address && input.address) patch.address = input.address;
            if (Object.keys(patch).length) {
                wrap(existing).assign(patch);
                await this.em.flush();
            }
            return existing;
        }

        const customer = this.customerRepo.create({
            name: input.name,
            phoneNumber: input.phoneNumber,
            email: input.email,
            address: input.address,
        });
        await this.em.persist(customer).flush();
        return customer;
    }

    /**
     * Order module gọi sau khi tạo order thành công để cập nhật metric khách hàng.
     */
    async incrementOrderStats(customerId: number, orderAmount: number) {
        // Decimal columns được trả về dạng string từ DB, validator của MikroORM
        // không cho phép assign number vào string property → dùng nativeUpdate
        // để tăng atomic, không cần load entity vào identity map.
        await this.em.nativeUpdate(
            Customer,
            { id: customerId },
            {
                totalOrders: raw("totalOrders + 1"),
                totalSpent: raw("totalSpent + ?", [Number(orderAmount)]),
            },
        );
    }

    async update(id: number, dto: UpdateCustomerDto) {
        const customer = await this.findOne(id);

        if (dto.phoneNumber && dto.phoneNumber !== customer.phoneNumber) {
            await this.assertPhoneAvailable(dto.phoneNumber, id);
        }

        wrap(customer).assign(dto, { mergeObjectProperties: true });
        await this.em.flush();
        return customer;
    }

    async remove(id: number): Promise<void> {
        const customer = await this.findOne(id);
        wrap(customer).assign({ deleted: DeletedEnum.DELETED });
        await this.em.flush();
    }

    private async assertPhoneAvailable(phone: string, excludeId?: number) {
        const existed = await this.customerRepo.findOne({
            phoneNumber: phone,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (existed && existed.id !== excludeId) {
            throw new BadRequestException(`SĐT "${phone}" đã có khách hàng khác`);
        }
    }
}
