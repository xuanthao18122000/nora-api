import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { UserControllerForCMS } from "./controllers";
import { UserService } from "./services/user.service";

@Module({
    imports: [MikroOrmModule.forFeature([User])],
    controllers: [UserControllerForCMS],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
