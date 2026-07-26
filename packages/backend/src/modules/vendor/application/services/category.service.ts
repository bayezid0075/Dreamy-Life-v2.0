import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';

@Injectable()
export class CategoryService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getAllActive() {
    const categories = await this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.isActive, true))
      .orderBy(schema.categories.sortOrder);

    const result: Array<Record<string, unknown>> = [];
    for (const category of categories) {
      const subcategories = await this.db
        .select()
        .from(schema.subcategories)
        .where(eq(schema.subcategories.categoryId, category.id))
        .orderBy(schema.subcategories.sortOrder);

      result.push({
        ...category,
        subcategories,
      });
    }

    return result;
  }

  async getAll() {
    const categories = await this.db
      .select()
      .from(schema.categories)
      .orderBy(desc(schema.categories.createdAt));

    const result: Array<Record<string, unknown>> = [];
    for (const category of categories) {
      const subcategories = await this.db
        .select()
        .from(schema.subcategories)
        .where(eq(schema.subcategories.categoryId, category.id))
        .orderBy(schema.subcategories.sortOrder);

      result.push({
        ...category,
        subcategories,
      });
    }

    return result;
  }

  async createCategory(data: { name: string; slug?: string; icon?: string; sortOrder?: number }) {
    const slug = data.slug || this.generateSlug(data.name);

    const existing = await this.db.query.categories.findFirst({
      where: eq(schema.categories.slug, slug),
    });

    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }

    const [category] = await this.db
      .insert(schema.categories)
      .values({
        name: data.name,
        slug,
        icon: data.icon,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();

    return category;
  }

  async updateCategory(id: string, data: { name?: string; slug?: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
    const category = await this.db.query.categories.findFirst({
      where: eq(schema.categories.id, id),
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (data.slug && data.slug !== category.slug) {
      const existing = await this.db.query.categories.findFirst({
        where: eq(schema.categories.slug, data.slug),
      });
      if (existing) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updated] = await this.db
      .update(schema.categories)
      .set(updateData)
      .where(eq(schema.categories.id, id))
      .returning();

    return updated;
  }

  async deleteCategory(id: string) {
    const category = await this.db.query.categories.findFirst({
      where: eq(schema.categories.id, id),
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const productsUsingCategory = await this.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.category, category.slug))
      .limit(1);

    if (productsUsingCategory.length > 0) {
      throw new ConflictException('Cannot delete category: products are still using it');
    }

    await this.db.delete(schema.subcategories).where(eq(schema.subcategories.categoryId, id));
    await this.db.delete(schema.categories).where(eq(schema.categories.id, id));

    return { message: 'Category deleted successfully' };
  }

  async createSubcategory(categoryId: string, data: { name: string; slug?: string; sortOrder?: number }) {
    const category = await this.db.query.categories.findFirst({
      where: eq(schema.categories.id, categoryId),
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const slug = data.slug || this.generateSlug(data.name);

    const existing = await this.db.query.subcategories.findFirst({
      where: eq(schema.subcategories.slug, slug),
    });

    if (existing) {
      throw new ConflictException('Subcategory with this slug already exists');
    }

    const [subcategory] = await this.db
      .insert(schema.subcategories)
      .values({
        categoryId,
        name: data.name,
        slug,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();

    return subcategory;
  }

  async updateSubcategory(id: string, data: { name?: string; slug?: string; sortOrder?: number; isActive?: boolean }) {
    const subcategory = await this.db.query.subcategories.findFirst({
      where: eq(schema.subcategories.id, id),
    });

    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    if (data.slug && data.slug !== subcategory.slug) {
      const existing = await this.db.query.subcategories.findFirst({
        where: eq(schema.subcategories.slug, data.slug),
      });
      if (existing) {
        throw new ConflictException('Subcategory with this slug already exists');
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updated] = await this.db
      .update(schema.subcategories)
      .set(updateData)
      .where(eq(schema.subcategories.id, id))
      .returning();

    return updated;
  }

  async deleteSubcategory(id: string) {
    const subcategory = await this.db.query.subcategories.findFirst({
      where: eq(schema.subcategories.id, id),
    });

    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }

    const productsUsingSubcategory = await this.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.subcategory, subcategory.slug))
      .limit(1);

    if (productsUsingSubcategory.length > 0) {
      throw new ConflictException('Cannot delete subcategory: products are still using it');
    }

    await this.db.delete(schema.subcategories).where(eq(schema.subcategories.id, id));

    return { message: 'Subcategory deleted successfully' };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
