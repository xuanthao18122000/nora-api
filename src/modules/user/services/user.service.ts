import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { DeletedEnum } from "@common/enums";
import { paginatedResponse } from "@common/helpers";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "../dtos/create-user.dto";
import { UpdateUserDto } from "../dtos/update-user.dto";
import { UpdatePasswordDto } from "../dtos/update-password.dto";
import { ListUserDto } from "../dtos/query-user.dto";

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: EntityRepository<User>,
        private readonly em: EntityManager,
    ) {}

    async create(dto: CreateUserDto): Promise<User> {
        await this.assertEmailAvailable(dto.email);

        const user = this.userRepo.create({
            ...dto,
            password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
        });
        await this.em.persist(user).flush();
        return user;
    }

    async findAll(query: ListUserDto) {
        const qb = this.em
            .createQueryBuilder(User, "user")
            .fSetQuery(query)
            .fOnlyActive()
            .fAndWhereLike("email")
            .fAndWhereLike("fullName")
            .fAndWhere("role")
            .fAndWhere("status")
            .fAndWhereDateRange("createdAt", query.createdAtFrom, query.createdAtTo)
            .fAndWhereDateRange("updatedAt", query.updatedAtFrom, query.updatedAtTo)
            .fAddPagination()
            .fAddOrderBy({ id: QueryOrder.DESC });

        const [items, total] = await qb.getResultAndCount();
        return paginatedResponse(items, total, query);
    }

    async findOne(id: number) {
        const user = await this.userRepo.findOne({ id, deleted: DeletedEnum.AVAILABLE });
        if (!user) throw new NotFoundException(`User #${id} không tồn tại`);
        return user;
    }

    /** Dùng cho auth — load kèm password để verify. */
    async findByEmail(email: string) {
        return this.userRepo.findOne({ email, deleted: DeletedEnum.AVAILABLE });
    }

    async update(id: number, dto: UpdateUserDto) {
        const user = await this.findOne(id);

        if (dto.email && dto.email !== user.email) {
            await this.assertEmailAvailable(dto.email, id);
        }

        wrap(user).assign(dto, { mergeObjectProperties: true });
        await this.em.flush();
        return user;
    }

    async updatePassword(id: number, dto: UpdatePasswordDto): Promise<void> {
        const user = await this.findOne(id);

        const matched = await bcrypt.compare(dto.oldPassword, user.password);
        if (!matched) {
            throw new UnauthorizedException("Mật khẩu hiện tại không đúng");
        }

        wrap(user).assign({
            password: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS),
            lastRequireLogoutAt: new Date(),
        });
        await this.em.flush();
    }

    async remove(id: number): Promise<void> {
        const user = await this.findOne(id);
        wrap(user).assign({ deleted: DeletedEnum.DELETED });
        await this.em.flush();
    }

    private async assertEmailAvailable(email: string, excludeId?: number) {
        const existed = await this.userRepo.findOne({
            email,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (existed && existed.id !== excludeId) {
            throw new BadRequestException(`Email "${email}" đã tồn tại`);
        }
    }
}
