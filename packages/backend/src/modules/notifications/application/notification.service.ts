import { Inject, Injectable } from '@nestjs/common';
import { eq, desc, count, sql, and } from 'drizzle-orm';
import * as schema from '../../../infrastructure/database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: {
    title: string;
    body: string;
    icon?: string;
    type?: string;
    scheduledAt?: Date;
    createdBy: string;
  }) {
    const [notification] = await this.db
      .insert(schema.notifications)
      .values({
        title: data.title,
        body: data.body,
        icon: data.icon,
        type: data.type || 'broadcast',
        status: data.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: data.scheduledAt,
        createdBy: data.createdBy,
      })
      .returning();

    return notification;
  }

  async broadcast(notificationId: string) {
    const notification = await this.db.query.notifications.findFirst({
      where: eq(schema.notifications.id, notificationId),
    });

    if (!notification) throw new Error('Notification not found');

    const allUsers = await this.db
      .select({ id: schema.users.id })
      .from(schema.users);

    if (allUsers.length > 0) {
      await this.db.insert(schema.notificationRecipients).values(
        allUsers.map((u) => ({
          notificationId,
          userId: u.id,
          sent: true,
          sentAt: new Date(),
        })),
      );
    }

    await this.db
      .update(schema.notifications)
      .set({
        status: 'sent',
        sentAt: new Date(),
        totalRecipients: allUsers.length,
      })
      .where(eq(schema.notifications.id, notificationId));

    return { notificationId, totalRecipients: allUsers.length };
  }

  async findAll(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;

    const whereClause = status
      ? and(
          eq(schema.notifications.status, status),
        )
      : undefined;

    const items = await this.db
      .select()
      .from(schema.notifications)
      .where(whereClause)
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: count() })
      .from(schema.notifications)
      .where(whereClause);

    return {
      items,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    return this.db.query.notifications.findFirst({
      where: eq(schema.notifications.id, id),
    });
  }

  async getDeliveryStats(id: string) {
    const sent = await this.db
      .select({ count: count() })
      .from(schema.notificationRecipients)
      .where(
        and(
          eq(schema.notificationRecipients.notificationId, id),
          eq(schema.notificationRecipients.sent, true),
        ),
      );

    const read = await this.db
      .select({ count: count() })
      .from(schema.notificationRecipients)
      .where(
        and(
          eq(schema.notificationRecipients.notificationId, id),
          eq(schema.notificationRecipients.read, true),
        ),
      );

    return {
      sent: sent[0]?.count || 0,
      read: read[0]?.count || 0,
    };
  }

  async remove(id: string) {
    await this.db
      .delete(schema.notificationRecipients)
      .where(eq(schema.notificationRecipients.notificationId, id));

    await this.db
      .delete(schema.notifications)
      .where(eq(schema.notifications.id, id));

    return { deleted: true };
  }

  async getOverallStats() {
    const totalNotifications = await this.db
      .select({ count: count() })
      .from(schema.notifications);

    const sentNotifications = await this.db
      .select({ count: count() })
      .from(schema.notifications)
      .where(eq(schema.notifications.status, 'sent'));

    const draftNotifications = await this.db
      .select({ count: count() })
      .from(schema.notifications)
      .where(eq(schema.notifications.status, 'draft'));

    const scheduledNotifications = await this.db
      .select({ count: count() })
      .from(schema.notifications)
      .where(eq(schema.notifications.status, 'scheduled'));

    const totalRecipients = await this.db
      .select({ count: count() })
      .from(schema.notificationRecipients);

    const totalRead = await this.db
      .select({ count: count() })
      .from(schema.notificationRecipients)
      .where(eq(schema.notificationRecipients.read, true));

    const recipientCount = totalRecipients[0]?.count || 0;
    const readCount = totalRead[0]?.count || 0;

    return {
      totalNotifications: totalNotifications[0]?.count || 0,
      sentNotifications: sentNotifications[0]?.count || 0,
      draftNotifications: draftNotifications[0]?.count || 0,
      scheduledNotifications: scheduledNotifications[0]?.count || 0,
      totalRecipients: recipientCount,
      totalRead: readCount,
      readRate: recipientCount > 0 ? Math.round((readCount / recipientCount) * 100) : 0,
    };
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const items = await this.db
      .select({
        id: schema.notifications.id,
        title: schema.notifications.title,
        body: schema.notifications.body,
        icon: schema.notifications.icon,
        type: schema.notifications.type,
        sentAt: schema.notifications.sentAt,
        createdAt: schema.notifications.createdAt,
        read: schema.notificationRecipients.read,
        readAt: schema.notificationRecipients.readAt,
        recipientId: schema.notificationRecipients.id,
      })
      .from(schema.notifications)
      .innerJoin(
        schema.notificationRecipients,
        eq(schema.notifications.id, schema.notificationRecipients.notificationId),
      )
      .where(eq(schema.notificationRecipients.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const unreadCount = await this.db
      .select({ count: count() })
      .from(schema.notificationRecipients)
      .innerJoin(
        schema.notifications,
        eq(schema.notificationRecipients.notificationId, schema.notifications.id),
      )
      .where(
        and(
          eq(schema.notificationRecipients.userId, userId),
          eq(schema.notificationRecipients.read, false),
          eq(schema.notifications.status, 'sent'),
        ),
      );

    return {
      items,
      unreadCount: unreadCount[0]?.count || 0,
      page,
      limit,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const recipient = await this.db.query.notificationRecipients.findFirst({
      where: and(
        eq(schema.notificationRecipients.notificationId, notificationId),
        eq(schema.notificationRecipients.userId, userId),
      ),
    });

    if (recipient && !recipient.read) {
      await this.db
        .update(schema.notificationRecipients)
        .set({ read: true, readAt: new Date() })
        .where(eq(schema.notificationRecipients.id, recipient.id));

      await this.db
        .update(schema.notifications)
        .set({
          totalRead: sql`${schema.notifications.totalRead} + 1`,
        })
        .where(eq(schema.notifications.id, notificationId));
    }

    return { success: true };
  }

  async markAllAsRead(userId: string) {
    const recipients = await this.db
      .select()
      .from(schema.notificationRecipients)
      .where(
        and(
          eq(schema.notificationRecipients.userId, userId),
          eq(schema.notificationRecipients.read, false),
        ),
      );

    for (const r of recipients) {
      await this.db
        .update(schema.notificationRecipients)
        .set({ read: true, readAt: new Date() })
        .where(eq(schema.notificationRecipients.id, r.id));

      await this.db
        .update(schema.notifications)
        .set({ totalRead: sql`${schema.notifications.totalRead} + 1` })
        .where(eq(schema.notifications.id, r.notificationId));
    }

    return { updated: recipients.length };
  }

  async getUnreadCount(userId: string) {
    const result = await this.db
      .select({ count: count() })
      .from(schema.notificationRecipients)
      .innerJoin(
        schema.notifications,
        eq(schema.notificationRecipients.notificationId, schema.notifications.id),
      )
      .where(
        and(
          eq(schema.notificationRecipients.userId, userId),
          eq(schema.notificationRecipients.read, false),
          eq(schema.notifications.status, 'sent'),
        ),
      );

    return result[0]?.count || 0;
  }
}
