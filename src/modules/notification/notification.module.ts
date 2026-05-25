import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { User } from "../user/entities/user.entity";
import { Notification } from "./entities/notification.entity";
import { NotificationDetail } from "./entities/notification-detail.entity";
import { NotificationControllerForCMS } from "./controllers";
import { NotificationService } from "./services/notification.service";

@Module({
    imports: [MikroOrmModule.forFeature([Notification, NotificationDetail, User])],
    controllers: [NotificationControllerForCMS],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {}
