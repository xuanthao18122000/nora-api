import { EntityRepository, QueryOrder, wrap } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/mysql";
import { InjectRepository } from "@mikro-orm/nestjs";
import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { DeletedEnum } from "@common/enums";
import { paginatedResponse } from "@common/helpers";
import { CategoryService } from "@modules/category/services/category.service";
import { SlugService } from "@modules/slug/services/slug.service";
import { SlugTypeEnum } from "@modules/slug/enums";
import { Brand } from "../../brand/entities/brand.entity";
import { Category } from "../../category/entities/category.entity";
import { Product } from "../entities/product.entity";
import { ProductCategory } from "../entities/product-category.entity";
import { CreateProductDto } from "../dtos/create-product.dto";
import { UpdateProductDto } from "../dtos/update-product.dto";
import { ListProductDto } from "../dtos/query-product.dto";
import {
    ImportProductItem,
    ImportProductResult,
    ImportProductsDto,
    ImportProductsResponse,
} from "../dtos/import-products.dto";

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepo: EntityRepository<Product>,
        @InjectRepository(ProductCategory)
        private readonly productCategoryRepo: EntityRepository<ProductCategory>,
        @InjectRepository(Brand)
        private readonly brandRepo: EntityRepository<Brand>,
        @InjectRepository(Category)
        private readonly categoryRepo: EntityRepository<Category>,
        private readonly em: EntityManager,
        private readonly slugService: SlugService,
        private readonly categoryService: CategoryService,
    ) {}

    async create(dto: CreateProductDto): Promise<Product> {
        await this.assertSkuAvailable(dto.sku);

        const brand = dto.brandId ? await this.findBrand(dto.brandId) : undefined;
        const { brandId: _b, categoryIds, slug: customSlug, ...rest } = dto;

        const normalized = this.toEntityShape(rest);
        const product = this.productRepo.create({ ...normalized, slug: "", brand });
        await this.em.persist(product).flush();

        product.slug = await this.slugService.create({
            raw: dto.name,
            custom: customSlug,
            type: SlugTypeEnum.PRODUCT,
            entityId: product.id,
        });
        await this.em.flush();

        if (categoryIds?.length) {
            await this.syncCategories(product, categoryIds);
        }

        return this.findOne(product.id);
    }

    async findAll(query: ListProductDto) {
        const qb = this.em
            .createQueryBuilder(Product, "product")
            .fSetQuery(query)
            .fOnlyActive()
            .leftJoinAndSelect("product.brand", "brand")
            .fAndWhereLikeAny(["name", "sku"], query.searchName)
            .fAndWhereLike("sku", query.searchSku)
            .fAndWhere("status")
            .fAndWhere("brandId", query.brandId)
            .fAndWhere("isBestSeller")
            .fAndWhereBetween("price", query.minPrice, query.maxPrice)
            .fAndWhereDateRange("createdAt", query.createdAtFrom, query.createdAtTo)
            .fAndWhereDateRange("updatedAt", query.updatedAtFrom, query.updatedAtTo)
            .fAddPagination();

        // Sort: whitelist các field cho phép sort
        const SORTABLE_FIELDS = new Set(["price", "createdAt", "updatedAt", "name", "id"]);
        const sortField = SORTABLE_FIELDS.has(query.sortBy ?? "")
            ? (query.sortBy as string)
            : "id";
        const sortOrder =
            query.order && String(query.order).toUpperCase() === "ASC"
                ? QueryOrder.ASC
                : QueryOrder.DESC;
        qb.fAddOrderBy({ [sortField]: sortOrder } as Record<string, QueryOrder>);

        if (query.categoryId !== undefined) {
            // Mở rộng theo cây: lấy products thuộc category gốc + tất cả con cháu
            const categoryIds = await this.categoryService.findDescendantIds(query.categoryId);
            const productIds = categoryIds.length
                ? await this.productCategoryRepo
                      .find({ category: { $in: categoryIds } }, { fields: ["product"] })
                      .then((rows) => [...new Set(rows.map((r) => r.product.id))])
                : [];
            qb.fAndWhereIn("id", productIds.length ? productIds : [-1]);
        }

        const [products, total] = await qb.getResultAndCount();
        if (products.length > 0) {
            await this.em.populate(products, ["productCategories", "productCategories.category"]);
        }

        return paginatedResponse(products, total, query);
    }

    async findBySlug(slug: string) {
        return this.productRepo.findOne(
            { slug, deleted: DeletedEnum.AVAILABLE },
            { populate: ["brand", "productCategories", "productCategories.category"] },
        );
    }

    /**
     * Lấy thông tin compact của nhiều product theo ids — phục vụ Recently
     * Viewed, Compare bar trên storefront. Bỏ qua id không tồn tại / đã xóa.
     */
    async findByIds(ids: Array<number | string>): Promise<unknown[]> {
        const numericIds = (ids ?? [])
            .map((v) => (typeof v === "number" ? v : Number(v)))
            .filter((n) => Number.isFinite(n) && n > 0);
        if (numericIds.length === 0) return [];

        const products = await this.productRepo.find({
            id: { $in: numericIds },
            deleted: DeletedEnum.AVAILABLE,
        });

        return products.map((p) => {
            const price = p.price;
            const salePrice = p.salePrice ?? null;
            const hasSale =
                salePrice != null &&
                Number(salePrice) > 0 &&
                Number(salePrice) < Number(price);
            const current = hasSale ? salePrice : price;
            return {
                id: String(p.id),
                name: p.name,
                slug: p.slug,
                urlPath: `/${p.slug}`,
                thumbnailUrl: p.thumbnailUrl ?? null,
                minPrice: String(current),
                maxPrice: String(current),
                status: p.status,
                listedPrice: hasSale ? String(price) : undefined,
                isInstallmentZero: false,
                createdAt: p.createdAt?.toISOString(),
            };
        });
    }

    async findOne(id: number) {
        const product = await this.em.findOne(
            Product,
            { id, deleted: DeletedEnum.AVAILABLE },
            { populate: ["brand", "productCategories", "productCategories.category"] },
        );
        if (!product) throw new NotFoundException(`Product #${id} không tồn tại`);
        return product;
    }

    async update(id: number, dto: UpdateProductDto) {
        const product = await this.findOne(id);

        if (dto.sku && dto.sku !== product.sku) {
            await this.assertSkuAvailable(dto.sku, id);
        }

        if (dto.brandId !== undefined) {
            product.brand = dto.brandId ? await this.findBrand(dto.brandId) : undefined;
        }

        if (dto.slug || dto.name) {
            product.slug = await this.slugService.update({
                raw: dto.name ?? product.name,
                custom: dto.slug,
                type: SlugTypeEnum.PRODUCT,
                entityId: product.id,
            });
        }

        const { brandId: _b, categoryIds, slug: _s, ...rest } = dto;
        const normalized = this.toEntityShape(rest);
        wrap(product).assign(normalized, { mergeObjectProperties: true });
        await this.em.flush();

        if (categoryIds !== undefined) {
            await this.syncCategories(product, categoryIds);
        }

        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const product = await this.findOne(id);
        wrap(product).assign({ deleted: DeletedEnum.DELETED });
        await this.em.flush();
        await this.slugService.remove(SlugTypeEnum.PRODUCT, id);
    }

    private async syncCategories(product: Product, categoryIds: number[]) {
        if (categoryIds.length) {
            const found = await this.categoryRepo.count({
                id: { $in: categoryIds },
                deleted: DeletedEnum.AVAILABLE,
            });
            if (found !== categoryIds.length) {
                throw new BadRequestException("Một hoặc nhiều categoryId không hợp lệ");
            }
        }

        await this.productCategoryRepo.nativeDelete({ product: product.id });

        for (const categoryId of categoryIds) {
            const pc = this.productCategoryRepo.create({
                product,
                category: this.em.getReference(Category, categoryId),
            });
            this.em.persist(pc);
        }
        await this.em.flush();
    }

    private async assertSkuAvailable(sku: string, excludeId?: number) {
        const existed = await this.productRepo.findOne({
            sku,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (existed && existed.id !== excludeId) {
            throw new BadRequestException(`SKU "${sku}" đã tồn tại`);
        }
    }

    private async findBrand(id: number): Promise<Brand> {
        const brand = await this.brandRepo.findOne({
            id,
            deleted: DeletedEnum.AVAILABLE,
        });
        if (!brand) throw new BadRequestException(`Brand #${id} không tồn tại`);
        return brand;
    }

    /**
     * Bulk import products. Tra cứu theo slug:
     * - Đã tồn tại → update các trường được phép (không động vào categories).
     * - Chưa tồn tại → tạo mới (slug giữ nguyên từ payload).
     * Lỗi từng item không làm fail cả batch — gom kết quả per-item.
     */
    async bulkImport(dto: ImportProductsDto): Promise<ImportProductsResponse> {
        // ─── Hardcode upsert Categories trước khi import products ───
        // Match theo slug (skip slug rỗng/invalid). parentId nếu có thì
        // resolve qua slug của parent (set ở vòng 2 sau khi tất cả đã tạo).
        // Field thừa từ JSON (id, idPath, level, createdAt,...) bỏ qua.
        const HARDCODED_CATEGORIES: Array<{
            slug: string;
            parentSlug?: string;
            name: string;
            description?: string | null;
            iconUrl?: string | null;
            thumbnailUrl?: string | null;
            position?: number;
            metaRobots?: string;
        }> = [
        ] as any;

        const validCats = HARDCODED_CATEGORIES.filter(
            (c) => c.slug && c.slug !== "#" && c.slug.trim() !== "",
        );

        if (validCats.length > 0) {
            // Build map `sourceId → slug` TRƯỚC khi delete c['id'] ở vòng 1.
            // Map dùng ở vòng 2 để resolve parentId từ source data → slug
            // → lookup category trong DB để lấy id thật.
            const sourceIdToSlug = new Map<number, string>();
            for (const c of HARDCODED_CATEGORIES) {
                if (c['id'] != null && c.slug) {
                    sourceIdToSlug.set(c['id'], c.slug);
                }
            }
            // Lưu parentId source vào map riêng (theo slug) — vì vòng 1 sẽ
            // xoá `c['id']` và `parentId` cũng có thể bị mutate.
            const slugToParentId = new Map<string, number>();
            for (const c of HARDCODED_CATEGORIES) {
                if (c.slug && c['parentId'] != null) {
                    slugToParentId.set(c.slug, c['parentId']);
                }
            }

            // Vòng 1: upsert theo slug (chưa set parent). Track các category
            // mới tạo để insert slug record (type=CATEGORY) sau flush.
            const newlyCreatedSlugs: string[] = [];
            for (const c of validCats) {
              delete c['id'];
                let cat = await this.em.findOne(Category, {
                    slug: c.slug,
                    deleted: DeletedEnum.AVAILABLE,
                });
                if (cat) {
                    wrap(cat).assign(
                        {
                            name: c.name,
                            description: c.description ?? cat.description,
                            iconUrl: c.iconUrl ?? cat.iconUrl,
                            thumbnailUrl: c.thumbnailUrl ?? cat.thumbnailUrl,
                            position: c.position ?? cat.position,
                            metaRobots: c.metaRobots ?? cat.metaRobots,
                        },
                        { mergeObjectProperties: true },
                    );
                } else {
                    cat = this.em.create(Category, {
                        name: c.name,
                        slug: c.slug,
                        description: c.description ?? undefined,
                        iconUrl: c.iconUrl ?? undefined,
                        thumbnailUrl: c.thumbnailUrl ?? undefined,
                        position: c.position ?? 0,
                        metaRobots: c.metaRobots ?? "noindex,nofollow",
                    });
                    this.em.persist(cat);
                    newlyCreatedSlugs.push(c.slug);
                }
            }
            await this.em.flush();

            // Insert slug record (type=CATEGORY) cho TẤT CẢ category trong
            // validCats nếu chưa có entry tương ứng trong bảng `slugs`. Đảm
            // bảo cả category mới tạo lẫn category cũ (chưa có slug record)
            // đều được resolve được qua /fe/resolve.
            for (const c of validCats) {
                const cat = await this.em.findOne(Category, { slug: c.slug });
                if (!cat) continue;
                const existing = await this.slugService.findBySlug(c.slug);
                if (existing) continue;
                try {
                    await this.slugService.create({
                        raw: cat.name,
                        custom: cat.slug,
                        type: SlugTypeEnum.CATEGORY,
                        entityId: cat.id,
                    });
                    this.logger.log(
                        `[bulkImport] Created slug record (CATEGORY) for "${c.slug}" → categoryId=${cat.id}`,
                    );
                } catch (err) {
                    this.logger.warn(
                        `[bulkImport] Failed to create slug "${c.slug}": ${
                            err instanceof Error ? err.message : String(err)
                        }`,
                    );
                }
            }

            // Vòng 2: set parent dùng map đã build ở đầu block.
            //   1. Lookup parentId source từ `slugToParentId` (theo slug hiện tại)
            //   2. Map parentId → parentSlug qua `sourceIdToSlug`
            //   3. Query Category theo parentSlug → lấy id thật trong DB
            for (const c of validCats) {
                const parentIdSource = slugToParentId.get(c.slug);
                if (parentIdSource == null) continue;
                const parentSlug = sourceIdToSlug.get(parentIdSource);
                if (!parentSlug) continue;

                const cat = await this.em.findOne(Category, { slug: c.slug });
                const parent = await this.em.findOne(Category, {
                    slug: parentSlug,
                });
                if (cat && parent && cat.id !== parent.id) {
                    cat.parent = parent;
                    // Format chuẩn theo CategoryService.create:
                    //   - Root: idPath = ""
                    //   - Cấp 1 (parent root): idPath = "{parent.id}"
                    //   - Cấp 2+: idPath = "{parent.idPath}/{parent.id}"
                    cat.idPath = parent.idPath
                        ? `${parent.idPath}/${parent.id}`
                        : `${parent.id}`;
                    cat.level = (parent.level ?? 0) + 1;
                }
            }
            await this.em.flush();
        }

        dto.items = ([
        ] as unknown) as ImportProductItem[];
        const results: ImportProductResult[] = [];
        let created = 0;
        let updated = 0;
        let skipped = 0;

        for (const item of dto.items) {
            try {
                const existing = await this.productRepo.findOne({
                    slug: item.slug,
                    deleted: DeletedEnum.AVAILABLE,
                });

                let productId: number;
                if (existing) {
                    await this.applyImportUpdate(existing, item);
                    productId = existing.id;
                    updated += 1;
                    results.push({
                        slug: item.slug,
                        sku: item.sku,
                        action: "updated",
                        id: existing.id,
                    });
                } else {
                    productId = await this.applyImportCreate(item);
                    created += 1;
                    results.push({
                        slug: item.slug,
                        sku: item.sku,
                        action: "created",
                        id: productId,
                    });
                }

                // Sync product_categories từ field `categories` của item (replace).
                await this.syncProductCategoriesFromImport(productId, item);

                // Backfill thumbnail cho category (chỉ ghi khi chưa có), dùng ảnh từ product hiện tại
                await this.backfillCategoryThumbnails(item);
            } catch (err) {
                skipped += 1;
                results.push({
                    slug: item.slug,
                    sku: item.sku,
                    action: "skipped",
                    error: err instanceof Error ? err.message : String(err),
                });
                this.em.clear();
            }
        }

        return {
            total: dto.items.length,
            created,
            updated,
            skipped,
            results,
        };
    }

    private async applyImportCreate(item: ImportProductItem): Promise<number> {
        await this.assertSkuAvailable(item.sku);

        const brand = item.brandId ? await this.findBrand(item.brandId) : undefined;
        const {
            brandId: _b,
            slug: customSlug,
            isFeatured: _isFeatured,
            isNew: _isNew,
            id: _id,
            createdAt: _createdAt,
            updatedAt: _updatedAt,
            categories: _categories,
            ...rest
        } = item as ImportProductItem & {
            id?: number;
            createdAt?: unknown;
            updatedAt?: unknown;
            categories?: unknown;
        };

        const normalized = this.toEntityShape(rest);
        const product = this.productRepo.create({ ...normalized, slug: "", brand });
        await this.em.persist(product).flush();

        product.slug = await this.slugService.create({
            raw: item.name,
            custom: customSlug,
            type: SlugTypeEnum.PRODUCT,
            entityId: product.id,
        });
        await this.em.flush();

        return product.id;
    }

    private async applyImportUpdate(product: Product, item: ImportProductItem): Promise<void> {
        if (item.sku && item.sku !== product.sku) {
            await this.assertSkuAvailable(item.sku, product.id);
        }

        if (item.brandId !== undefined) {
            product.brand = item.brandId ? await this.findBrand(item.brandId) : undefined;
        }

        const {
            brandId: _b,
            slug: _s,
            isFeatured: _isFeatured,
            isNew: _isNew,
            id: _id,
            createdAt: _createdAt,
            updatedAt: _updatedAt,
            categories: _categories,
            ...rest
        } = item as ImportProductItem & {
            id?: number;
            createdAt?: unknown;
            updatedAt?: unknown;
            categories?: unknown;
        };
        const normalized = this.toEntityShape(rest);

        // Sản phẩm chưa có đánh giá thật (reviewCount = 0) → random rating 3.5–5.0 để hiển thị
        const reviewCount = Number(
            (normalized as Record<string, unknown>).reviewCount ?? product.reviewCount ?? 0,
        );
        if (reviewCount === 0) {
            (normalized as Record<string, unknown>).averageRating = this.randomRating();
        }

        wrap(product).assign(normalized, { mergeObjectProperties: true });
        await this.em.flush();
    }

    /**
     * Sync product_categories theo field `categories: [{ slug }]` từ import item.
     * Replace strategy: xóa hết link cũ rồi insert lại theo slug. Skip silent
     * nếu category chưa tồn tại trong DB (không auto-tạo).
     */
    private async syncProductCategoriesFromImport(
        productId: number,
        item: ImportProductItem,
    ): Promise<void> {
        const cats = (
            item as ImportProductItem & {
                categories?: Array<{ slug?: string | null } | null>;
            }
        ).categories;
        if (!Array.isArray(cats) || cats.length === 0) return;

        const slugs = Array.from(
            new Set(
                cats
                    .map((c) => c?.slug?.trim())
                    .filter((s): s is string => Boolean(s) && s !== "#"),
            ),
        );
        if (slugs.length === 0) return;

        // Tìm các Category tồn tại theo slug.
        const categories = await this.em.find(Category, {
            slug: { $in: slugs },
            deleted: DeletedEnum.AVAILABLE,
        });
        if (categories.length === 0) return;

        // Replace: xóa toàn bộ link cũ.
        await this.productCategoryRepo.nativeDelete({ product: productId });

        // Insert lại link mới (1 ProductCategory / category).
        for (const cat of categories) {
            const pc = this.productCategoryRepo.create({
                product: productId as unknown as Product,
                category: cat,
            });
            this.em.persist(pc);
        }
        await this.em.flush();
    }

    private async backfillCategoryThumbnails(item: ImportProductItem): Promise<void> {
        const thumb = (item as ImportProductItem & { thumbnailUrl?: string | null })
            .thumbnailUrl;
        const cats = (item as ImportProductItem & { categories?: { slug?: string }[] })
            .categories;
        if (!thumb || !cats?.length) return;

        const slugs = cats.map((c) => c?.slug).filter((s): s is string => !!s);
        if (!slugs.length) return;

        const categories = await this.categoryRepo.find({
            slug: { $in: slugs },
            deleted: DeletedEnum.AVAILABLE,
        });

        let dirty = false;
        for (const cat of categories) {
            if (!cat.thumbnailUrl) {
                cat.thumbnailUrl = thumb;
                dirty = true;
            }
        }
        if (dirty) await this.em.flush();
    }

    private randomRating(): string {
        // Random 3.5 → 5.0, làm tròn về bước 0.1, trả string cho cột decimal
        const min = 3.5;
        const max = 5.0;
        const raw = min + Math.random() * (max - min);
        const rounded = Math.round(raw * 10) / 10;
        return rounded.toFixed(2);
    }

    private toEntityShape(input: Record<string, unknown>): Record<string, unknown> {
        // Entity decimal fields khai TS là `string` → giữ string (convert number → string nếu cần).
        const DECIMAL_FIELDS = ["price", "salePrice", "costPrice", "averageRating"] as const;
        // Entity integer fields → coerce sang number.
        const INTEGER_FIELDS = [
            "stockQuantity",
            "priority",
            "viewCount",
            "soldCount",
            "reviewCount",
        ] as const;

        const out: Record<string, unknown> = { ...input };

        for (const key of DECIMAL_FIELDS) {
            const v = out[key];
            if (typeof v === "number" && Number.isFinite(v)) {
                out[key] = v.toString();
            } else if (typeof v === "string" && v.trim() === "") {
                out[key] = undefined;
            }
        }

        for (const key of INTEGER_FIELDS) {
            const v = out[key];
            if (typeof v === "string" && v.trim() !== "") {
                const n = Number(v);
                if (!Number.isNaN(n)) out[key] = n;
            }
        }

        return out;
    }
}
