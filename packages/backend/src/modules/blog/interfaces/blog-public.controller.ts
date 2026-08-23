import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BlogService } from '../application/services/blog.service';

@ApiTags('Blog')
@Controller()
export class BlogPublicController {
  constructor(private blogService: BlogService) {}

  @Get('blog')
  @ApiOperation({ summary: 'Get published blog posts (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPublishedPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.blogService.findPublished(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 12,
    );
    return result;
  }

  @Get('blog/:slug')
  @ApiOperation({ summary: 'Get a blog post by slug' })
  async getPostBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Post('blog/:slug/view')
  @ApiOperation({ summary: 'Increment blog post view count' })
  async incrementViews(@Param('slug') slug: string) {
    return this.blogService.incrementViews(slug);
  }
}
