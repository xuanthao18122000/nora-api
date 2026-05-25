export interface ErrorDetail {
    code: string;
    message: string;
}

export const SUCESS_RESPONSE = {
    code: "SUCCESS",
    message: "Thành công",
};

export const ErrorCode = {
    BAD_REQUEST: {
        code: "BAD_REQUEST",
        message: "Yêu cầu không hợp lệ",
    },
    UNAUTHORIZED: {
        code: "UNAUTHORIZED",
        message: "Không có quyền truy cập",
    },
    NOT_FOUND: {
        code: "NOT_FOUND",
        message: "Không tìm thấy tài nguyên",
    },
    CONFLICT: {
        code: "CONFLICT",
        message: "Dữ liệu bị xung đột",
    },
    INTERNAL_SERVER_ERROR: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Lỗi hệ thống",
    },
} as const;
