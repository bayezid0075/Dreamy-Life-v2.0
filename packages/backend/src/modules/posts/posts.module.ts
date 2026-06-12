import { Module } from '@nestjs/common';
import { PostService } from './application/services/post.service';

@Module({
  providers: [PostService],
  exports: [PostService],
})
export class PostsModule {}
