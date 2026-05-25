import { PaginationOptionsDto } from "../dtos";

export function buildPaginationResponse<T>(
    items: T[],
    total: number,
    pagination: PaginationOptionsDto<T>,
) {
    return {
        data: items,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
    };
}

export { buildPaginationResponse as paginatedResponse };
