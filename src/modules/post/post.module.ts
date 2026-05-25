import { MikroOrmModule } from "@mikro-orm/nestjs";
import { forwardRef, Module } from "@nestjs/common";
import { PageModule } from "@modules/page/page.module";
import { SlugModule } from "@modules/slug/slug.module";
import { Post } from "./entities/post.entity";
import { PostList } from "./entities/post-list.entity";
import {
    PostControllerForCMS,
    PostControllerForFE,
    PostListControllerForCMS,
} from "./controllers";
import { PostService } from "./services/post.service";
import { PostListService } from "./services/post-list.service";

@Module({
    imports: [
        MikroOrmModule.forFeature([Post, PostList]),
        SlugModule,
        forwardRef(() => PageModule),
    ],
    controllers: [
        PostControllerForCMS,
        PostControllerForFE,
        PostListControllerForCMS,
    ],
    providers: [PostService, PostListService],
    exports: [PostService, PostListService],
})
export class PostModule {}
