import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostService } from '../application/services/post.service';
import { CreatePostDto, CreateCommentDto } from '../dto/create-post.dto';
import { UserGuard } from '../../notifications/guards/user.guard';

@Controller()
@UseGuards(UserGuard)
export class PostController {
  constructor(private postService: PostService) {}

  @Post('posts')
  async createPost(@Body() dto: CreatePostDto, @Req() req: any) {
    return this.postService.create(req.user.userId, dto.content, dto.mediaIds);
  }

  @Get('feed')
  async getFeed(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postService.findAll(
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('posts/:id')
  async getPost(@Param('id') id: string, @Req() req: any) {
    const post = await this.postService.findOne(id);
    if (!post) return { error: 'Post not found' };

    const liked = await this.postService.hasLiked(id, req.user.userId);
    const comments = await this.postService.getComments(id);
    return { ...post, liked, comments };
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string, @Req() req: any) {
    await this.postService.remove(id, req.user.userId);
    return { deleted: true };
  }

  @Post('posts/:id/like')
  async toggleLike(@Param('id') id: string, @Req() req: any) {
    return this.postService.toggleLike(id, req.user.userId);
  }

  @Get('posts/:id/likes')
  async getPostLikers(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postService.getPostLikers(
      id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('posts/:id/comments')
  async getComments(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postService.getComments(
      id,
      parseInt(page || '1'),
      parseInt(limit || '50'),
    );
  }

  @Post('posts/:id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.postService.addComment(id, req.user.userId, dto.content, dto.parentCommentId);
  }

  @Post('comments/:commentId/like')
  async toggleCommentLike(
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    return this.postService.toggleCommentLike(commentId, req.user.userId);
  }

  @Delete('posts/:postId/comments/:commentId')
  async removeComment(
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    await this.postService.removeComment(commentId, postId);
    return { deleted: true };
  }

  @Get('users/:id')
  async getUserProfile(@Param('id') id: string) {
    const profile = await this.postService.getUserProfile(id);
    if (!profile) return { error: 'User not found' };
    return profile;
  }

  @Get('users/:id/posts')
  async getUserPosts(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postService.getUserPosts(
      id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('users/:id/stats')
  async getUserStats(@Param('id') id: string) {
    return this.postService.getUserStats(id);
  }

  @Post('users/:id/follow')
  async toggleFollow(@Param('id') id: string, @Req() req: any) {
    return this.postService.toggleFollow(req.user.userId, id);
  }

  @Get('users/:id/followers')
  async getFollowers(
    @Param('id') id: string,
    @Query('page') page?: string,
  ) {
    return this.postService.getFollowers(id, parseInt(page || '1'));
  }

  @Get('users/:id/following')
  async getFollowing(
    @Param('id') id: string,
    @Query('page') page?: string,
  ) {
    return this.postService.getFollowing(id, parseInt(page || '1'));
  }
}
