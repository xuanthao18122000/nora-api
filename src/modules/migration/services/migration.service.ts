import { wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { Injectable } from "@nestjs/common";
import { DeletedEnum } from "@common/enums";
import { Category } from "@modules/category/entities/category.entity";
import { ProductCategory } from "@modules/product/entities/product-category.entity";
import { Product } from "@modules/product/entities/product.entity";
import { Slug } from "@modules/slug/entities/slug.entity";
import { SlugTypeEnum } from "@modules/slug/enums";
import {
    ImportCategoryRefDto,
    ImportPayloadDto,
    ImportProductItemDto,
} from "../dtos/import-payload.dto";

export interface SectionResult {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: { slug: string; message: string }[];
}

export interface ImportResult {
    products: SectionResult;
    categories: SectionResult;
    durationMs: number;
}

const newSection = (): SectionResult => ({
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
});

function toNumber(v: unknown, fallback = 0): number {
    if (v === null || v === undefined || v === "") return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function toNullableNumber(v: unknown): number | undefined {
    if (v === null || v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

function toDecimalString(v: unknown, fallback = "0"): string {
    if (v === null || v === undefined || v === "") return fallback;
    if (typeof v === "string") return v;
    const n = Number(v);
    return Number.isFinite(n) ? n.toString() : fallback;
}

function toNullableDecimalString(v: unknown): string | undefined {
    if (v === null || v === undefined || v === "") return undefined;
    if (typeof v === "string") return v;
    const n = Number(v);
    return Number.isFinite(n) ? n.toString() : undefined;
}

@Injectable()
export class MigrationService {
    constructor(private readonly em: EntityManager) {}

    async import(payload: ImportPayloadDto): Promise<ImportResult> {
        payload.products = [];
        const start = Date.now();
        const mode = payload.mode ?? "skip";

        const result: ImportResult = {
            products: newSection(),
            categories: newSection(),
            durationMs: 0,
        };

        // 1. Upsert tất cả category unique (qua id hệ cũ + slug) → trả map slug → entity
        const categoryMap = await this.upsertCategoriesFromProducts(
            payload.products,
            result.categories,
        );

        // 2. Import products
        await this.importProducts(payload.products, mode, result.products, categoryMap);

        result.durationMs = Date.now() - start;
        return result;
    }

    // ─── CATEGORIES ──────────────────────────────────────────────
    /**
     * Build tree từ flat list `categories[]` của tất cả products.
     *  - Gom unique theo slug
     *  - Pass 1: tạo / fetch tất cả category (chưa link parent)
     *  - Pass 2: link parent qua `parentId` map (legacyId → entity)
     */
    private async upsertCategoriesFromProducts(
        products: ImportProductItemDto[],
        section: SectionResult,
    ): Promise<Map<string, Category>> {
        const uniqueBySlug = new Map<string, ImportCategoryRefDto>();
        for (const p of products) {
            for (const c of p.categories ?? []) {
                if (!uniqueBySlug.has(c.slug)) uniqueBySlug.set(c.slug, c);
            }
        }
        section.total = uniqueBySlug.size;

        const slugMap = new Map<string, Category>();
        const legacyIdMap = new Map<number, Category>();

        // Pass 1 — tạo hoặc fetch
        for (const c of uniqueBySlug.values()) {
            try {
                const existing = await this.em.findOne(Category, {
                    slug: c.slug,
                    deleted: DeletedEnum.AVAILABLE,
                });
                let entity: Category;
                if (existing) {
                    entity = existing;
                    section.skipped++;
                } else {
                    entity = this.em.create(Category, {
                        name: c.name,
                        slug: c.slug,
                        position: c.displayOrder ?? 0,
                    });
                    this.em.persist(entity);
                    await this.em.flush();
                    section.created++;
                }
                slugMap.set(c.slug, entity);
                legacyIdMap.set(c.id, entity);
                await this.ensureSlugRecord(SlugTypeEnum.CATEGORY, entity.id, c.slug);
            } catch (e: any) {
                section.errors.push({ slug: c.slug, message: e?.message ?? "unknown" });
            }
        }

        // Pass 2 — link parent qua legacy parentId
        for (const c of uniqueBySlug.values()) {
            if (!c.parentId) continue;
            const child = slugMap.get(c.slug);
            const parent = legacyIdMap.get(c.parentId);
            if (!child || !parent || child.parent?.id === parent.id) continue;
            try {
                child.parent = parent;
                child.level = parent.level + 1;
                child.idPath = parent.idPath ? `${parent.idPath}/${parent.id}` : `${parent.id}`;
                await this.em.flush();
            } catch (e: any) {
                section.errors.push({
                    slug: c.slug,
                    message: `parent link: ${e?.message ?? "unknown"}`,
                });
            }
        }

        return slugMap;
    }

    // ─── PRODUCTS ────────────────────────────────────────────────
    private async importProducts(
        items: ImportProductItemDto[],
        mode: "skip" | "upsert",
        section: SectionResult,
        categoryMap: Map<string, Category>,
    ) {
        section.total = items.length;

        for (const item of items) {
            try {
                const existingBySlug = await this.em.findOne(Product, {
                    slug: item.slug,
                    deleted: DeletedEnum.AVAILABLE,
                });
                const existingBySku = !existingBySlug
                    ? await this.em.findOne(Product, {
                          sku: item.sku,
                          deleted: DeletedEnum.AVAILABLE,
                      })
                    : null;
                const existing = existingBySlug ?? existingBySku;

                if (existing && mode === "skip") {
                    section.skipped++;
                    continue;
                }

                const data = this.mapProductData(item);

                let product: Product;
                if (existing) {
                    wrap(existing).assign(data, { mergeObjectProperties: true });
                    product = existing;
                    section.updated++;
                } else {
                    product = this.em.create(Product, data);
                    this.em.persist(product);
                    section.created++;
                }
                await this.em.flush();
                await this.ensureSlugRecord(SlugTypeEnum.PRODUCT, product.id, item.slug);

                // Sync M:N category
                if (item.categories?.length) {
                    const cats = item.categories
                        .map((c) => categoryMap.get(c.slug))
                        .filter((c): c is Category => !!c);
                    await this.syncProductCategories(product, cats);
                }
            } catch (e: any) {
                section.errors.push({ slug: item.slug, message: e?.message ?? "unknown" });
            }
        }
    }

    /** Map field từ payload web cũ sang Product entity — cast string-decimal → number, bỏ field dư. */
    private mapProductData(item: ImportProductItemDto) {
        return {
            name: item.name,
            slug: item.slug,
            sku: item.sku,
            shortDescription: item.shortDescription ?? undefined,
            description: item.description ?? undefined,
            price: toDecimalString(item.price, "0"),
            salePrice: toNullableDecimalString(item.salePrice),
            costPrice: toDecimalString(item.costPrice, "0"),
            stockQuantity: toNumber(item.stockQuantity, 0),
            unit: item.unit ?? undefined,
            thumbnailUrl: item.thumbnailUrl ?? undefined,
            images: item.images ?? undefined,
            origin: item.origin ?? undefined,
            barcode: item.barcode ?? undefined,
            priority: item.priority ?? 0,
            isBestSeller: item.isBestSeller ?? false,
            showPrice: item.showPrice ?? true,
            metaTitle: item.metaTitle ?? undefined,
            metaDescription: item.metaDescription ?? undefined,
            metaKeywords: item.metaKeywords ?? undefined,
            metaRobots: item.metaRobots ?? "index,follow",
            canonicalUrl: item.canonicalUrl ?? undefined,
            seoBaseSchema: item.seoBaseSchema ?? undefined,
        };
    }

    private async syncProductCategories(product: Product, categories: Category[]) {
        if (!categories.length) return;
        await this.em.nativeDelete(ProductCategory, { product: product.id });
        for (const cat of categories) {
            const pc = this.em.create(ProductCategory, { product, category: cat });
            this.em.persist(pc);
        }
        await this.em.flush();
    }

    // ─── SLUG REGISTRY ───────────────────────────────────────────
    private async ensureSlugRecord(type: SlugTypeEnum, entityId: number, slug: string) {
        const existing = await this.em.findOne(Slug, { slug });
        if (existing) {
            if (existing.type === type && existing.entityId !== entityId) {
                wrap(existing).assign({ entityId });
                await this.em.flush();
            }
            return;
        }
        const record = this.em.create(Slug, { slug, type, entityId });
        this.em.persist(record);
        await this.em.flush();
    }
}
