import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { File } from "./entities/file.entity";
import { FileControllerForCMS } from "./controllers";
import { FileService } from "./services/file.service";

@Module({
    imports: [MikroOrmModule.forFeature([File])],
    controllers: [FileControllerForCMS],
    providers: [FileService],
    exports: [FileService],
})
export class FileModule {}
