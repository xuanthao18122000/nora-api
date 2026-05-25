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
import { SlugService } from "@modules/slug/services/slug.service";
import { SlugTypeEnum } from "@modules/slug/enums";
import { Category } from "../entities/category.entity";
import { CreateCategoryDto } from "../dtos/create-category.dto";
import { UpdateCategoryDto } from "../dtos/update-category.dto";
import { ListCategoryDto } from "../dtos/query-category.dto";

export interface CategoryTreeNode extends Category {
    children: CategoryTreeNode[] & any;
}

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepo: EntityRepository<Category>,
        private readonly em: EntityManager,
        private readonly slugService: SlugService,
    ) {}

    async create(dto: CreateCategoryDto): Promise<Category> {
        let parent: Category | undefined;
        let level = 0;
        let idPathPrefix = "";

        if (dto.parentId) {
            parent = await this.findOne(dto.parentId);
            level = parent.level + 1;
            idPathPrefix = parent.idPath ? `${parent.idPath}/${parent.id}` : `${parent.id}`;
        }

        const { slug: customSlug, parentId: _p, ...rest } = dto;

        const category = this.categoryRepo.create({
            ...rest,
            slug: "",
            parent,
            level,
            idPath: idPathPrefix,
        });
        await this.em.persist(category).flush();

        category.slug = await this.slugService.create({
            raw: dto.name,
            custom: customSlug,
            type: SlugTypeEnum.CATEGORY,
            entityId: category.id,
        });
        await this.em.flush();

        return category;
    }

    async findAll(query: ListCategoryDto) {
        if (query.tree) {
            return this.findTree(query.status);
        }

        const qb = this.em
            .createQueryBuilder(Category, "category")
            .fSetQuery(query)
            .fOnlyActive()
            .fAndWhereLike("name", query.searchName)
            .fAndWhereLike("slug", query.searchSlug)
            .fAndWhere("status")
            .fAndWhere("parentId", query.parentId)
            .fAndWhereDateRange("createdAt", query.createdAtFrom, query.createdAtTo)
            .fAndWhereDateRange("updatedAt", query.updatedAtFrom, query.updatedAtTo)
            .fAddPagination()
            .fAddOrderBy({ position: QueryOrder.ASC, priority: QueryOrder.DESC });

        const [items, total] = await qb.getResultAndCount();
        return paginatedResponse(items, total, query);
    }

    async findTree(status?: number): Promise<CategoryTreeNode[]> {
        const qb = this.em
            .createQueryBuilder(Category, "category")
            .fOnlyActive()
            .fOrderBy({ position: QueryOrder.ASC, priority: QueryOrder.DESC });

        if (status !== undefined) qb.andWhere({ status });

        const all = await qb.getResult();

        const byId = new Map<number, CategoryTreeNode>();
        all.forEach((c) => byId.set(c.id, Object.assign(c, { children: [] }) as CategoryTreeNode));

        const roots: CategoryTreeNode[] = [];
        for (const node of byId.values()) {
            const parentId = node.parent?.id;
            if (parentId && byId.has(parentId)) {
                byId.get(parentId)!.children.push(node);
            } else {
                roots.push(node);
            }
        }
        return roots;
    }

    async findBySlug(slug: string) {
        return this.categoryRepo.findOne(
            { slug, deleted: DeletedEnum.AVAILABLE },
            { populate: ["parent"] },
        );
    }

    async findOne(id: number) {
        const category = await this.em.findOne(
            Category,
            { id, deleted: DeletedEnum.AVAILABLE },
            { populate: ["parent"] },
        );
        if (!category) throw new NotFoundException(`Category #${id} không tồn tại`);
        return category;
    }

    /**
     * Lấy id của category gốc + toàn bộ con cháu trong nhánh.
     * Dùng cho query products: "tất cả sản phẩm thuộc danh mục cha hoặc con cháu của nó".
     * idPath lưu path tới parent (không kèm self), nên match self bằng id, descendants bằng idPath LIKE.
     */
    async findDescendantIds(rootId: number): Promise<number[]> {
        const root = await this.categoryRepo.findOne({
            id: rootId,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (!root) return [];

        // Path của descendants: nếu root.idPath = "" → descendants có idPath bắt đầu bằng "{id}"
        //                      ngược lại → descendants có idPath bắt đầu bằng "{root.idPath}/{id}"
        const selfPath = root.idPath ? `${root.idPath}/${root.id}` : `${root.id}`;

        const descendants = await this.categoryRepo.find(
            {
                deleted: DeletedEnum.AVAILABLE,
                $or: [
                    { idPath: selfPath }, // con trực tiếp
                    { idPath: { $like: `${selfPath}/%` } }, // cháu sâu hơn
                ],
            },
            { fields: ["id"] },
        );

        return [rootId, ...descendants.map((c) => c.id)];
    }

    async update(id: number, dto: UpdateCategoryDto) {
        const category = await this.findOne(id);

        if (dto.parentId !== undefined) {
            if (dto.parentId === id) {
                throw new BadRequestException("Không thể chọn chính nó làm parent");
            }
            if (dto.parentId === null) {
                category.parent = undefined;
                category.level = 0;
                category.idPath = "";
            } else {
                const parent = await this.findOne(dto.parentId);
                if (parent.idPath?.split("/").includes(String(id))) {
                    throw new BadRequestException("Không thể chọn con cháu làm parent (vòng lặp)");
                }
                category.parent = parent;
                category.level = parent.level + 1;
                category.idPath = parent.idPath ? `${parent.idPath}/${parent.id}` : `${parent.id}`;
            }
        }

        if (dto.slug || dto.name) {
            category.slug = await this.slugService.update({
                raw: dto.name ?? category.name,
                custom: dto.slug,
                type: SlugTypeEnum.CATEGORY,
                entityId: category.id,
            });
        }

        const { parentId: _p, slug: _s, ...rest } = dto;
        wrap(category).assign(rest, { mergeObjectProperties: true });
        await this.em.flush();
        return category;
    }

    async remove(id: number): Promise<void> {
        const category = await this.findOne(id);

        const childCount = await this.categoryRepo.count({
            parent: id,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (childCount > 0) {
            throw new BadRequestException("Không thể xoá category còn category con");
        }

        wrap(category).assign({ deleted: DeletedEnum.DELETED });
        await this.em.flush();
        await this.slugService.remove(SlugTypeEnum.CATEGORY, id);
    }
}
