import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { paginatedResponse } from "@common/helpers";
import { Comment } from "../entities/comment.entity";
import {
    CommentStatusEnum,
    CommentTypeEnum,
} from "../enums";
import { CreateCommentDto } from "../dtos/create-comment.dto";
import { ListCommentsDto } from "../dtos/list-comments.dto";
import { ListRepliesDto } from "../dtos/list-replies.dto";
import { ReplyCommentDto } from "../dtos/reply-comment.dto";

@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepo: EntityRepository<Comment>,
        private readonly em: EntityManager,
    ) {}

    /** Map entity → response cho FE (thêm parentId rút từ ref). */
    private mapForFe(c: Comment) {
        return {
            id: c.id,
            targetType: c.targetType,
            targetId: c.targetId,
            parentId: c.parent ? (c.parent as unknown as Comment).id : null,
            content: c.content,
            customerName: c.customerName ?? null,
            customerCommentType: c.customerCommentType,
            likeCount: c.likeCount,
            replyCount: c.replyCount,
            status: c.status,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        };
    }

    /** GET /fe/comments — list root comments (parent = null) kèm children rút gọn. */
    async findRoots(query: ListCommentsDto) {
        const qb = this.em
            .createQueryBuilder(Comment, "comment")
            .fSetQuery(query)
            .leftJoinAndSelect("comment.children", "children")
            .andWhere({ parent: null })
            .andWhere({ status: CommentStatusEnum.PUBLISHED })
            .andWhere({ targetType: query.targetType })
            .andWhere({ targetId: query.targetId })
            .fAddPagination()
            .fAddOrderBy({ createdAt: QueryOrder.DESC });

        const [items, total] = await qb.getResultAndCount();

        const data = items.map((c) => ({
            ...this.mapForFe(c),
            children: c.children
                .getItems()
                .filter((x) => x.status === CommentStatusEnum.PUBLISHED)
                .map((child) => this.mapForFe(child)),
        }));

        return paginatedResponse(data, total, query as never);
    }

    /** GET /fe/comments/:parentId/replies — list replies của 1 root. */
    async findReplies(parentId: string, query: ListRepliesDto) {
        const qb = this.em
            .createQueryBuilder(Comment, "comment")
            .fSetQuery(query)
            .andWhere({ parent: parentId })
            .andWhere({ status: CommentStatusEnum.PUBLISHED })
            .fAddPagination()
            .fAddOrderBy({ createdAt: QueryOrder.ASC });

        const [items, total] = await qb.getResultAndCount();
        const data = items.map((c) => this.mapForFe(c));
        return paginatedResponse(data, total, query as never);
    }

    /** POST /fe/comments — tạo comment gốc. */
    async create(dto: CreateCommentDto): Promise<{ id: string }> {
        const comment = this.commentRepo.create({
            targetType: dto.targetType,
            targetId: dto.targetId,
            content: dto.content,
            customerName: dto.customerName?.trim() || "Khách hàng",
            customerCommentType: CommentTypeEnum.CUSTOMER,
            status: CommentStatusEnum.PUBLISHED,
        });
        await this.em.persist(comment).flush();
        return { id: comment.id };
    }

    /** POST /fe/comments/:parentId/replies — reply một comment. Tăng replyCount của root. */
    async reply(parentId: string, dto: ReplyCommentDto): Promise<{ id: string }> {
        const parent = await this.commentRepo.findOne({ id: parentId });
        if (!parent) {
            throw new NotFoundException(`Comment ${parentId} không tồn tại`);
        }
        if (parent.status !== CommentStatusEnum.PUBLISHED) {
            throw new BadRequestException("Comment cha không khả dụng");
        }

        // Reply luôn gắn vào root: nếu parent đã là reply thì lấy parent của parent
        const root = parent.parent ?? parent;
        const rootEntity = await this.commentRepo.findOneOrFail({
            id: (root as Comment).id,
        });

        const reply = this.commentRepo.create({
            targetType: dto.targetType,
            targetId: rootEntity.targetId,
            content: dto.content,
            customerName: dto.customerName?.trim() || "Khách hàng",
            customerCommentType: CommentTypeEnum.CUSTOMER,
            status: CommentStatusEnum.PUBLISHED,
            parent: rootEntity,
        });

        await this.em.persist(reply).flush();

        // Tăng replyCount root
        wrap(rootEntity).assign({ replyCount: (rootEntity.replyCount ?? 0) + 1 });
        await this.em.flush();

        return { id: reply.id };
    }
}
