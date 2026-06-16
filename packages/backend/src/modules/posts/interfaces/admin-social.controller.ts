import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostService } from '../application/services/post.service';
import { AdminGuard } from '../../admin/guards/admin.guard';

@Controller('admin/social')
@UseGuards(AdminGuard)
export class AdminSocialController {
  constructor(private postService: PostService) {}

  @Get('stats')
  async getStats() {
    const stats = await this.postService.getAdminStats();
    return stats;
  }

  @Get('posts')
  async getPosts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postService.findAll(
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string) {
    await this.postService.remove(id, '');
    return { deleted: true };
  }
}
