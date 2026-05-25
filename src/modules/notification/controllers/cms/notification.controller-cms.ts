import {
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { NotificationService } from "../../services/notification.service";
import { CreateNotificationDto } from "../../dtos/create-notification.dto";
import { ListNotificationDto } from "../../dtos/query-notification.dto";
import { MarkSeenDto } from "../../dtos/mark-seen.dto";

/**
 * Tạm thời dùng header `x-user-id` để xác định user hiện tại.
 * Sau khi có auth module, đổi sang `@CurrentUser()` decorator + JWT guard.
 */
const USER_HEADER = "x-user-id";

@Controller("cms/notifications")
@ApiTags("[CMS] NOTIFICATION")
@ApiBearerAuth()
@ApiHeader({ name: USER_HEADER, description: "User id (tạm thời, sẽ thay bằng JWT)" })
export class NotificationControllerForCMS {
    constructor(private readonly notificationService: NotificationService) {}

    @Post()
    @ApiOperation({ summary: "Tạo + fan-out notification cho list user (hoặc ALL)" })
    create(
        @Headers(USER_HEADER) creatorId: string,
        @Body() dto: CreateNotificationDto,
    ) {
        return this.notificationService.create(Number(creatorId), dto);
    }

    @Get()
    @ApiOperation({ summary: "List notification của user hiện tại" })
    findAll(
        @Headers(USER_HEADER) userId: string,
        @Query() query: ListNotificationDto,
    ) {
        return this.notificationService.findAllForUser(Number(userId), query);
    }

    @Get("unread-count")
    @ApiOperation({ summary: "Đếm notification chưa đọc của user (cho badge)" })
    async countUnread(@Headers(USER_HEADER) userId: string) {
        const count = await this.notificationService.countUnread(Number(userId));
        return { count };
    }

    @Patch(":id/seen")
    @ApiOperation({ summary: "Mark 1 notification detail là đã đọc" })
    markOneSeen(
        @Headers(USER_HEADER) userId: string,
        @Param("id", ParseIntPipe) id: number,
    ) {
        return this.notificationService.markOneSeen(Number(userId), id);
    }

    @Patch("seen")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "Mark nhiều / tất cả notification là đã đọc",
        description: "Body bỏ trống ids → mark tất cả của user hiện tại.",
    })
    markManySeen(
        @Headers(USER_HEADER) userId: string,
        @Body() dto: MarkSeenDto,
    ) {
        return this.notificationService.markManySeen(Number(userId), dto);
    }
}
