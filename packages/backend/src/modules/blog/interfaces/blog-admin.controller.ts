import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminGuard } from '../../admin/guards/admin.guard';
import { BlogService } from '../application/services/blog.service';
import { CreateBlogPostDto } from '../dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../dto/update-blog-post.dto';

@ApiTags('Admin Blog')
@ApiBearerAuth('access-token')
@UseGuards(AdminGuard)
@Controller('admin')
export class BlogAdminController {
  constructor(private blogService: BlogService) {}

  @Get('blog')
  @ApiOperation({ summary: 'List all blog posts (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async listPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.blogService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  @Get('blog/:id')
  @ApiOperation({ summary: 'Get a blog post by ID (admin)' })
  async getPost(@Param('id') id: string) {
    return this.blogService.findById(id);
  }

  @Post('blog')
  @ApiOperation({ summary: 'Create a blog post' })
  async createPost(@Body() dto: CreateBlogPostDto, @Req() req: any) {
    return this.blogService.create(dto, req.user.adminId, req.user.email);
  }

  @Patch('blog/:id')
  @ApiOperation({ summary: 'Update a blog post' })
  async updatePost(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.update(id, dto);
  }

  @Delete('blog/:id')
  @ApiOperation({ summary: 'Delete a blog post' })
  async deletePost(@Param('id') id: string) {
    return this.blogService.delete(id);
  }
}
