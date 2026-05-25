import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Injectable, NotFoundException } from "@nestjs/common";
import { paginatedResponse } from "@common/helpers";
import { CustomerService } from "@modules/customer/services/customer.service";
import { TelegramService } from "@modules/telegram/telegram.service";
import { CreateContactInformationDto } from "../dtos/create-contact-information.dto";
import { ListContactInformationDto } from "../dtos/list-contact-information.dto";
import { UpdateContactInformationDto } from "../dtos/update-contact-information.dto";
import { ContactInformation } from "../entities/contact-information.entity";
import { ContactStatusEnum } from "../enums/contact-status.enum";

@Injectable()
export class ContactInformationService {
    constructor(
        @InjectRepository(ContactInformation)
        private readonly contactRepo: EntityRepository<ContactInformation>,
        private readonly em: EntityManager,
        private readonly customerService: CustomerService,
        private readonly telegramService: TelegramService,
    ) {}

    async create(dto: CreateContactInformationDto): Promise<ContactInformation> {
        // Tìm/tạo customer theo phone — giữ snapshot ở contact
        const customer = await this.customerService.findOrCreateByPhone({
            name: dto.name,
            phoneNumber: dto.phone,
            email: dto.email,
            address: dto.address,
        });

        const contact = this.contactRepo.create({
            customer,
            name: dto.name,
            phone: dto.phone,
            email: dto.email,
            address: dto.address,
            productId: dto.productId,
            productName: dto.productName,
            notes: dto.notes,
            status: dto.status ?? ContactStatusEnum.NEW,
        });

        await this.em.persist(contact).flush();

        // Fire-and-forget Telegram notification
        this.telegramService.sendContactNotification(contact);

        return contact;
    }

    async findAll(query: ListContactInformationDto) {
        const qb = this.em
            .createQueryBuilder(ContactInformation, "contact")
            .fSetQuery(query)
            .fAndWhere("status")
            .fAddPagination()
            .fAddOrderBy({ id: QueryOrder.DESC });

        if (query.search) {
            const s = `%${query.search}%`;
            qb.andWhere({
                $or: [{ name: { $like: s } }, { phone: { $like: s } }, { email: { $like: s } }],
            });
        }

        const [items, total] = await qb.getResultAndCount();
        return paginatedResponse(items, total, query);
    }

    async findOne(id: number): Promise<ContactInformation> {
        const contact = await this.contactRepo.findOne({ id });
        if (!contact) throw new NotFoundException(`Contact #${id} không tồn tại`);
        return contact;
    }

    async update(id: number, dto: UpdateContactInformationDto): Promise<ContactInformation> {
        const contact = await this.findOne(id);
        wrap(contact).assign(dto, { mergeObjectProperties: true });
        await this.em.flush();
        return contact;
    }

    async remove(id: number): Promise<void> {
        const contact = await this.findOne(id);
        await this.em.removeAndFlush(contact);
    }
}
