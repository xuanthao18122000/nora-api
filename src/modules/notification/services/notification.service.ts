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
import { User } from "../../user/entities/user.entity";
import { Notification } from "../entities/notification.entity";
import { NotificationDetail } from "../entities/notification-detail.entity";
import { NotificationTypeReceiverEnum } from "../enums";
import { CreateNotificationDto } from "../dtos/create-notification.dto";
import { ListNotificationDto } from "../dtos/query-notification.dto";
import { MarkSeenDto } from "../dtos/mark-seen.dto";

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: EntityRepository<Notification>,
        @InjectRepository(NotificationDetail)
        private readonly detailRepo: EntityRepository<NotificationDetail>,
        @InjectRepository(User)
        private readonly userRepo: EntityRepository<User>,
        private readonly em: EntityManager,
    ) {}

    /**
     * Tạo notification + fan-out NotificationDetail cho từng user nhận.
     * Module khác có thể gọi trực tiếp method này (vd OrderService khi đơn mới → noti cho admin).
     */
    async create(creatorId: number, dto: CreateNotificationDto): Promise<Notification> {
        const receiverType = dto.receiverType ?? NotificationTypeReceiverEnum.PRIVATE;

        // Resolve list userId nhận
        let receiverIds: number[];
        if (receiverType === NotificationTypeReceiverEnum.ALL) {
            const users = await this.userRepo.find(
                { deleted: DeletedEnum.AVAILABLE },
                { fields: ["id"] },
            );
            receiverIds = users.map((u) => u.id);
        } else {
            if (!dto.receivers?.length) {
                throw new BadRequestException("receivers không được rỗng khi receiverType = PRIVATE");
            }
            receiverIds = [...new Set(dto.receivers)];
        }

        if (!receiverIds.length) {
            throw new BadRequestException("Không có người nhận hợp lệ");
        }

        const creator = await this.userRepo.findOne({
            id: creatorId,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (!creator) throw new BadRequestException(`Creator #${creatorId} không tồn tại`);

        const notification = this.notificationRepo.create({
            title: dto.title,
            body: dto.body,
            receiverType,
            receivers: receiverIds,
            creator,
            redirectType: dto.redirectType ?? undefined,
        });

        for (const userId of receiverIds) {
            const detail = this.detailRepo.create({
                notification,
                user: this.em.getReference(User, userId),
                entityRefId: dto.entityRefId,
            });
            notification.details.add(detail);
        }

        await this.em.persist(notification).flush();
        return notification;
    }

    /**
     * List notification của 1 user (truy vấn trên NotificationDetail để lấy trạng thái seen).
     */
    async findAllForUser(userId: number, query: ListNotificationDto) {
        const qb = this.em
            .createQueryBuilder(NotificationDetail, "detail")
            .fSetQuery(query)
            .leftJoinAndSelect("detail.notification", "notification")
            .where({ user: userId })
            .fAndWhereLike("notification.title", query.title)
            .fAndWhereDateRange("detail.createdAt", query.createdAtFrom, query.createdAtTo)
            .fAddPagination()
            .fAddOrderBy({ id: QueryOrder.DESC });

        if (query.unreadOnly) {
            qb.andWhere({ seen: false });
        }
        if (query.redirectType !== undefined) {
            qb.andWhere({ notification: { redirectType: query.redirectType } });
        }

        const [items, total] = await qb.getResultAndCount();
        return paginatedResponse(items, total, query);
    }

    /** Đếm số notification chưa đọc của user — dùng cho badge ở header CMS. */
    async countUnread(userId: number): Promise<number> {
        return this.detailRepo.count({ user: userId, seen: false });
    }

    /** Mark 1 detail là đã đọc. */
    async markOneSeen(userId: number, detailId: number) {
        const detail = await this.detailRepo.findOne({ id: detailId, user: userId });
        if (!detail) throw new NotFoundException(`Notification detail #${detailId} không tồn tại`);
        if (detail.seen) return detail;

        wrap(detail).assign({ seen: true, seenAt: new Date() });
        await this.em.flush();
        return detail;
    }

    /** Mark nhiều detail (hoặc toàn bộ nếu ids rỗng) là đã đọc. */
    async markManySeen(userId: number, dto: MarkSeenDto): Promise<{ updated: number }> {
        const where: any = { user: userId, seen: false };
        if (dto.ids?.length) where.id = { $in: dto.ids };

        const updated = await this.detailRepo.nativeUpdate(where, {
            seen: true,
            seenAt: new Date(),
        });
        return { updated };
    }
}
