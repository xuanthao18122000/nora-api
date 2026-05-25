import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { CommentControllerForFE } from "./controllers";
import { Comment } from "./entities/comment.entity";
import { CommentService } from "./services/comment.service";

@Module({
    imports: [MikroOrmModule.forFeature([Comment])],
    controllers: [CommentControllerForFE],
    providers: [CommentService],
    exports: [CommentService],
})
export class CommentModule {}
