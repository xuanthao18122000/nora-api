export enum NotificationTypeReceiverEnum {
    /** Tất cả người dùng */
    ALL = 1,
    /** Riêng tư (Một danh sách người dùng receivers) */
    PRIVATE = 2,
}

/**
 * Khi user click thông báo sẽ được redirect tới đâu.
 * Tạm thời chỉ có ORDER, mở rộng sau khi cần.
 */
export enum NotificationRedirectTypeEnum {
    ORDER = 1,
}
