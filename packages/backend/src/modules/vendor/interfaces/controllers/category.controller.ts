import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CategoryService } from '../../application/services/category.service';
import { AdminGuard } from '../../../admin/guards/admin.guard';
import { CreateCategoryDto, UpdateCategoryDto, CreateSubcategoryDto, UpdateSubcategoryDto } from '../dto/category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active categories with subcategories' })
  async getAllActive() {
    const categories = await this.categoryService.getAllActive();
    return { success: true, data: categories };
  }

  @Get('all')
  @ApiBearerAuth('access-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all categories including inactive (admin)' })
  async getAll() {
    const categories = await this.categoryService.getAll();
    return { success: true, data: categories };
  }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a new category (admin)' })
  async createCategory(@Body() body: CreateCategoryDto) {
    const category = await this.categoryService.createCategory(body);
    return { success: true, data: category };
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update a category (admin)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async updateCategory(
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    const category = await this.categoryService.updateCategory(id, body);
    return { success: true, data: category };
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete a category (admin)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async deleteCategory(@Param('id') id: string) {
    const result = await this.categoryService.deleteCategory(id);
    return { success: true, data: result };
  }

  @Post(':id/subcategories')
  @ApiBearerAuth('access-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a subcategory under a category (admin)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async createSubcategory(
    @Param('id') id: string,
    @Body() body: CreateSubcategoryDto,
  ) {
    const subcategory = await this.categoryService.createSubcategory(id, body);
    return { success: true, data: subcategory };
  }

  @Patch('subcategories/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update a subcategory (admin)' })
  @ApiParam({ name: 'id', description: 'Subcategory ID' })
  async updateSubcategory(
    @Param('id') id: string,
    @Body() body: UpdateSubcategoryDto,
  ) {
    const subcategory = await this.categoryService.updateSubcategory(id, body);
    return { success: true, data: subcategory };
  }

  @Delete('subcategories/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete a subcategory (admin)' })
  @ApiParam({ name: 'id', description: 'Subcategory ID' })
  async deleteSubcategory(@Param('id') id: string) {
    const result = await this.categoryService.deleteSubcategory(id);
    return { success: true, data: result };
  }
}
