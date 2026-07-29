import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql, count, eq, gte, desc } from 'drizzle-orm';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class VisitorService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async trackVisitor(data: { userId?: string; platform: string; ip?: string; userAgent?: string }) {
    await this.db.insert(schema.visitors).values({
      userId: data.userId || null,
      platform: data.platform,
      ip: data.ip || null,
      userAgent: data.userAgent || null,
    });
    return { success: true };
  }

  async getVisitorStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalResult] = await this.db.select({ count: count() }).from(schema.visitors);
    const [todayResult] = await this.db.select({ count: count() }).from(schema.visitors).where(gte(schema.visitors.createdAt, todayStart));
    const [weekResult] = await this.db.select({ count: count() }).from(schema.visitors).where(gte(schema.visitors.createdAt, weekAgo));
    const [monthResult] = await this.db.select({ count: count() }).from(schema.visitors).where(gte(schema.visitors.createdAt, monthAgo));

    const platformCounts = await this.db
      .select({ platform: schema.visitors.platform, count: count() })
      .from(schema.visitors)
      .groupBy(schema.visitors.platform);

    const dailyVisitors = await this.db
      .select({
        date: sql<string>`to_char(${schema.visitors.createdAt}, 'YYYY-MM-DD')`.as('date'),
        count: count(),
      })
      .from(schema.visitors)
      .where(gte(schema.visitors.createdAt, weekAgo))
      .groupBy(sql`to_char(${schema.visitors.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${schema.visitors.createdAt}, 'YYYY-MM-DD')`);

    return {
      total: Number(totalResult?.count ?? 0),
      today: Number(todayResult?.count ?? 0),
      thisWeek: Number(weekResult?.count ?? 0),
      thisMonth: Number(monthResult?.count ?? 0),
      byPlatform: platformCounts.map((r) => ({ platform: r.platform, count: Number(r.count) })),
      daily: dailyVisitors.map((r) => ({ date: r.date, count: Number(r.count) })),
    };
  }
}
