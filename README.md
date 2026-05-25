# noravn-api

Backend API cho **NORA VN** (Công ty TNHH Kỹ thuật - Dịch vụ NORA) — gọn nhẹ, kế thừa pattern từ ddv-web-api-v2 nhưng đã loại bỏ Kafka, BullMQ, Elasticsearch, MinIO, microservices, axios, vnpay, moment.

## Stack
- NestJS 11 + MikroORM 6 + MySQL
- JWT (chưa dùng), class-validator, Swagger, zod (env)

## Modules hiện có
- `brand` — CRUD thương hiệu
- `category` — CRUD danh mục cây (parent/child, tree API)
- `product` — CRUD sản phẩm + M:N với category, FK brand

## Setup

```bash
cd noravn/noravn-api
pnpm install
cp .env.example .env  # chỉnh DB_* + JWT_SECRET
```

## Database — quy trình migration

> **User tự chạy migration**, không bao giờ tự động edit snapshot hay file migration.

```bash
# Tạo migration đầu tiên
pnpm mikro:generate Init

# Apply
pnpm mikro:up

# Rollback (nếu cần)
pnpm mikro:down
```

## Run

```bash
pnpm start:dev
# Swagger: http://localhost:3000/docs
# API base: http://localhost:3000/api/v1
```

## Cấu trúc

```
src/
├── common/
│   ├── dtos/          # PaginationDto
│   ├── enums/         # DeletedEnum, StatusCommonEnum, OrderByEnum
│   └── helpers/       # toSlug
├── configs/
│   ├── database/
│   │   └── mikro-orm.config.ts
│   ├── env.config.ts
│   └── index.ts
├── modules/
│   ├── brand/
│   ├── category/
│   └── product/
├── app.controller.ts  # GET /health
├── app.module.ts
└── main.ts
```

## Quy ước

- Doc-first: spec ở `ecom-clone/docs/specs/`, API contract ở `ecom-clone/docs/api/`. Đọc trước khi sửa code.
- Mỗi entity đổi → tạo migration mới, không sửa migration cũ.
- Không dùng raw SQL — luôn dùng EntityManager / EntityRepository / QueryBuilder.
- Soft-delete bằng cột `deleted` (DeletedEnum). Mọi query mặc định filter `deleted = AVAILABLE`.
