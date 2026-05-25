import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { env } from "@configs/env.config";
import { ContactInformation } from "@modules/contact-information/entities/contact-information.entity";
import { Order } from "@modules/order/entities/order.entity";
import { PaymentMethodEnum } from "@modules/order/enums";

const TELEGRAM_API = "https://api.telegram.org";

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken: string | undefined;
    private readonly chatId: string | undefined;

    constructor() {
        this.botToken = env.TELEGRAM_BOT_TOKEN || undefined;
        this.chatId = env.TELEGRAM_CHAT_ID || undefined;
    }

    isConfigured(): boolean {
        return Boolean(this.botToken && this.chatId);
    }

    async sendMessage(text: string): Promise<void> {
        if (!this.botToken || !this.chatId) return;
        const url = `${TELEGRAM_API}/bot${this.botToken}/sendMessage`;
        await axios.post(url, {
            chat_id: this.chatId,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
        });
    }

    /** Fire-and-forget — lỗi không ảnh hưởng API. */
    sendOrderNotification(order: Order): void {
        if (!this.isConfigured()) return;
        const text = this.formatOrderMessage(order);
        this.sendMessage(text).catch((err) => {
            this.logger.warn(`[Telegram] order notify fail: ${(err as Error).message}`);
        });
    }

    sendContactNotification(contact: ContactInformation): void {
        if (!this.isConfigured()) return;
        const text = this.formatContactMessage(contact);
        this.sendMessage(text).catch((err) => {
            this.logger.warn(`[Telegram] contact notify fail: ${(err as Error).message}`);
        });
    }

    private formatContactMessage(contact: ContactInformation): string {
        const createdAt = contact.createdAt
            ? formatDateDDMMYYYY(new Date(contact.createdAt))
            : formatDateDDMMYYYY(new Date());

        const lines: string[] = [
            "📝 <b>Yêu cầu liên hệ mới</b>",
            "",
            `<b>Mã:</b> #${contact.id}`,
            `<b>Thời gian:</b> ${createdAt}`,
            `<b>Khách hàng:</b> ${escapeHtml(contact.name)}`,
            `<b>SĐT:</b> ${escapeHtml(contact.phone)}`,
        ];
        if (contact.email) lines.push(`<b>Email:</b> ${escapeHtml(contact.email)}`);
        if (contact.address) lines.push(`<b>Địa chỉ:</b> ${escapeHtml(contact.address)}`);
        if (contact.productId) lines.push(`<b>Sản phẩm ID:</b> ${contact.productId}`);
        if (contact.productName)
            lines.push(`<b>Sản phẩm:</b> ${escapeHtml(contact.productName)}`);
        if (contact.notes) lines.push(`<b>Ghi chú:</b> ${escapeHtml(contact.notes)}`);
        return lines.join("\n");
    }

    private formatOrderMessage(order: Order): string {
        const code = `#${order.id}`;
        const paymentLabel =
            order.paymentMethod === PaymentMethodEnum.COD
                ? "COD"
                : order.paymentMethod === PaymentMethodEnum.BANK_TRANSFER
                  ? "Chuyển khoản"
                  : "Khác";
        const total = Number(order.totalAmount);
        const totalFormatted = new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(total);
        const createdAt = order.createdAt
            ? formatDateDDMMYYYY(new Date(order.createdAt))
            : "—";

        const lines: string[] = [
            "📦 <b>Đơn hàng mới</b>",
            "",
            `<b>Mã đơn:</b> ${escapeHtml(code)}`,
            `<b>Thời gian:</b> ${createdAt}`,
            `<b>Khách hàng:</b> ${escapeHtml(order.customerName)}`,
            `<b>SĐT:</b> ${escapeHtml(order.phone)}`,
            `<b>Email:</b> ${escapeHtml(order.email)}`,
            `<b>Địa chỉ:</b> ${escapeHtml(order.shippingAddress)}`,
            `<b>Thanh toán:</b> ${paymentLabel}`,
            `<b>Tổng tiền:</b> ${totalFormatted}`,
        ];
        if (order.note) lines.push(`<b>Ghi chú:</b> ${escapeHtml(order.note)}`);

        const items = order.items?.isInitialized?.() ? order.items.getItems() : [];
        if (items.length) {
            lines.push("");
            lines.push("<b>Chi tiết:</b>");
            for (const item of items) {
                const name = escapeHtml(String(item.productName));
                const qty = item.quantity;
                const price = new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                }).format(Number(item.unitPrice));
                lines.push(` • ${name} x ${qty} — ${price}`);
            }
        }
        return lines.join("\n");
    }
}

function formatDateDDMMYYYY(d: Date): string {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${h}:${m}`;
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
