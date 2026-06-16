import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../../infrastructure/database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class PushTokenService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async register(userId: string, token: string, platform: string) {
    const existing = await this.db.query.pushTokens.findFirst({
      where: eq(schema.pushTokens.token, token),
    });

    if (existing) {
      await this.db
        .update(schema.pushTokens)
        .set({ updatedAt: new Date(), userId })
        .where(eq(schema.pushTokens.id, existing.id));
      return existing;
    }

    const [pushToken] = await this.db
      .insert(schema.pushTokens)
      .values({ userId, token, platform })
      .returning();

    return pushToken;
  }

  async remove(token: string) {
    await this.db
      .delete(schema.pushTokens)
      .where(eq(schema.pushTokens.token, token));

    return { deleted: true };
  }

  async getByUserId(userId: string) {
    return this.db.query.pushTokens.findMany({
      where: eq(schema.pushTokens.userId, userId),
    });
  }
}
