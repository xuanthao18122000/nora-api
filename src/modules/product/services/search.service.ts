import { EntityRepository, QueryOrder } from "@mikro-orm/core";
import type { FilterQuery } from "@mikro-orm/core";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Injectable } from "@nestjs/common";
import { DeletedEnum, StatusCommonEnum } from "@common/enums";
import { Category } from "../../category/entities/category.entity";
import { Product } from "../entities/product.entity";

export interface SearchProductsParams {
    q: string;
    productPage?: number;
    productLimit?: number;
    categoryPage?: number;
    categoryLimit?: number;
    sort?: string;
}

export interface SearchProductResultItem {
    id: string;
    name: string;
    slug: string;
    urlPath: string;
    thumbnailUrl: string | null;
    minPrice: number;
    maxPrice: number;
    listedPrice?: number;
    stock?: number;
    productType?: string;
    avgRating?: number | null;
    reviewCount?: number;
    createdAt?: string;
}

export interface SearchCategoryResultItem {
    id: number;
    name: string;
    slug: string;
    thumbnailUrl?: string | null;
    iconUrl?: string | null;
    parentId?: number;
    level?: number;
    idPath?: string;
}

export interface SearchResponse {
    products: {
        total: number;
        items: SearchProductResultItem[];
        page: number;
        limit: number;
    };
    categories: {
        total: number;
        items: SearchCategoryResultItem[];
        page: number;
        limit: number;
    };
}

@Injectable()
export class SearchService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepo: EntityRepository<Product>,
        @InjectRepository(Category)
        private readonly categoryRepo: EntityRepository<Category>,
    ) {}

    /**
     * Tìm kiếm products + categories theo từ khóa.
     * - Product: match name OR sku OR shortDescription (LIKE)
     * - Category: match name OR description
     */
    async search(params: SearchProductsParams): Promise<SearchResponse> {
        const q = (params.q ?? "").trim();
        const productPage = Math.max(1, params.productPage ?? 1);
        const productLimit = Math.min(50, Math.max(1, params.productLimit ?? 10));
        const categoryPage = Math.max(1, params.categoryPage ?? 1);
        const categoryLimit = Math.min(50, Math.max(1, params.categoryLimit ?? 10));

        if (!q) {
            return {
                products: { total: 0, items: [], page: productPage, limit: productLimit },
                categories: { total: 0, items: [], page: categoryPage, limit: categoryLimit },
            };
        }

        const [productsResult, categoriesResult] = await Promise.all([
            this.searchProducts(q, productPage, productLimit),
            this.searchCategories(q, categoryPage, categoryLimit),
        ]);

        return { products: productsResult, categories: categoriesResult };
    }

    private async searchProducts(
        q: string,
        page: number,
        limit: number,
    ): Promise<SearchResponse["products"]> {
        const like = `%${q}%`;
        const where: FilterQuery<Product> = {
            deleted: DeletedEnum.AVAILABLE,
            status: StatusCommonEnum.ACTIVE,
            $or: [
                { name: { $like: like } },
                { sku: { $like: like } },
                { shortDescription: { $like: like } },
            ],
        };

        const [rows, total] = await this.productRepo.findAndCount(where, {
            limit,
            offset: (page - 1) * limit,
            orderBy: {
                priority: QueryOrder.DESC,
                soldCount: QueryOrder.DESC,
                createdAt: QueryOrder.DESC,
            },
        });

        const items: SearchProductResultItem[] = rows.map((p) => {
            const price = toNumber(p.price);
            const salePrice = toNumber(p.salePrice);
            const hasSale = salePrice > 0 && salePrice < price;
            const currentPrice = hasSale ? salePrice : price;
            const rating = toNumber(p.averageRating);
            return {
                id: String(p.id),
                name: p.name,
                slug: p.slug,
                urlPath: `/${p.slug}`,
                thumbnailUrl: p.thumbnailUrl ?? null,
                minPrice: currentPrice,
                maxPrice: currentPrice,
                listedPrice: hasSale ? price : undefined,
                stock: p.stockQuantity,
                avgRating: rating > 0 ? rating : null,
                reviewCount: p.reviewCount,
                createdAt: p.createdAt?.toISOString(),
            };
        });

        return { total, items, page, limit };
    }

    private async searchCategories(
        q: string,
        page: number,
        limit: number,
    ): Promise<SearchResponse["categories"]> {
        const like = `%${q}%`;
        const where: FilterQuery<Category> = {
            deleted: DeletedEnum.AVAILABLE,
            $or: [
                { name: { $like: like } },
                { description: { $like: like } },
            ],
        };

        const [rows, total] = await this.categoryRepo.findAndCount(where, {
            limit,
            offset: (page - 1) * limit,
            orderBy: {
                position: QueryOrder.ASC,
                id: QueryOrder.ASC,
            },
        });

        const items: SearchCategoryResultItem[] = rows.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            thumbnailUrl: c.thumbnailUrl ?? null,
            iconUrl: c.iconUrl ?? null,
            parentId: c.parent?.id,
            level: c.level,
            idPath: c.idPath,
        }));

        return { total, items, page, limit };
    }
}

function toNumber(v: unknown): number {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}
