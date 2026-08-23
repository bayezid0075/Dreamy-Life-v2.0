import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, sql, count, and, ilike } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';
import { CreateBlogPostDto } from '../../dto/create-blog-post.dto';
import { UpdateBlogPostDto } from '../../dto/update-blog-post.dto';

@Injectable()
export class BlogService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(dto: CreateBlogPostDto, adminId: string, adminName: string) {
    const slug = dto.slug || await this.generateSlug(dto.title);

    const existing = await this.db.query.blogPosts.findFirst({
      where: eq(schema.blogPosts.slug, slug),
    });
    if (existing) {
      throw new ConflictException('A post with this slug already exists');
    }

    const [post] = await this.db
      .insert(schema.blogPosts)
      .values({
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        body: dto.body,
        coverImageUrl: dto.coverImageUrl,
        authorId: adminId,
        authorName: adminName,
        status: dto.status || 'draft',
        tags: dto.tags || [],
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        publishedAt: dto.status === 'published' ? new Date() : null,
      })
      .returning();

    return post;
  }

  async findAll(page = 1, limit = 12, status?: string) {
    const offset = (page - 1) * limit;
    const conditions = status && status !== 'all'
      ? eq(schema.blogPosts.status, status)
      : undefined;

    const items = await this.db
      .select()
      .from(schema.blogPosts)
      .where(conditions)
      .orderBy(desc(schema.blogPosts.publishedAt), desc(schema.blogPosts.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: count() })
      .from(schema.blogPosts)
      .where(conditions);

    return {
      items,
      total: Number(totalResult[0]?.count || 0),
      page,
      limit,
    };
  }

  async findPublished(page = 1, limit = 12) {
    return this.findAll(page, limit, 'published');
  }

  async findBySlug(slug: string) {
    const post = await this.db.query.blogPosts.findFirst({
      where: eq(schema.blogPosts.slug, slug),
    });
    if (!post) {
      throw new NotFoundException('Blog post not found');
    }
    return post;
  }

  async findById(id: string) {
    const post = await this.db.query.blogPosts.findFirst({
      where: eq(schema.blogPosts.id, id),
    });
    if (!post) {
      throw new NotFoundException('Blog post not found');
    }
    return post;
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const existing = await this.findById(id);

    let slug = dto.slug;
    if (dto.title && !dto.slug) {
      slug = await this.generateSlug(dto.title);
    }

    if (slug && slug !== existing.slug) {
      const duplicate = await this.db.query.blogPosts.findFirst({
        where: eq(schema.blogPosts.slug, slug),
      });
      if (duplicate) {
        throw new ConflictException('A post with this slug already exists');
      }
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (slug !== undefined) updateData.slug = slug;
    if (dto.excerpt !== undefined) updateData.excerpt = dto.excerpt;
    if (dto.body !== undefined) updateData.body = dto.body;
    if (dto.coverImageUrl !== undefined) updateData.coverImageUrl = dto.coverImageUrl;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.metaTitle !== undefined) updateData.metaTitle = dto.metaTitle;
    if (dto.metaDescription !== undefined) updateData.metaDescription = dto.metaDescription;

    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'published' && existing.status !== 'published') {
        updateData.publishedAt = new Date();
      }
    }

    const [updated] = await this.db
      .update(schema.blogPosts)
      .set(updateData)
      .where(eq(schema.blogPosts.id, id))
      .returning();

    return updated;
  }

  async delete(id: string) {
    await this.findById(id);
    await this.db.delete(schema.blogPosts).where(eq(schema.blogPosts.id, id));
    return { deleted: true };
  }

  async incrementViews(slug: string) {
    const [updated] = await this.db
      .update(schema.blogPosts)
      .set({
        viewsCount: sql`${schema.blogPosts.viewsCount} + 1`,
      })
      .where(eq(schema.blogPosts.slug, slug))
      .returning({ viewsCount: schema.blogPosts.viewsCount });

    return { viewsCount: updated?.viewsCount || 0 };
  }

  private async generateSlug(title: string): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 200);

    if (!baseSlug) {
      baseSlug = 'post';
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.db.query.blogPosts.findFirst({
        where: eq(schema.blogPosts.slug, slug),
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
