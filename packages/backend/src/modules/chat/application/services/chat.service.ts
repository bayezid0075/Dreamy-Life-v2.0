import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, desc, count, and, sql, or } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class ChatService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async getConversations(userId: string) {
    const memberships = await this.db
      .select({
        conversationId: schema.conversationMembers.conversationId,
        lastReadAt: schema.conversationMembers.lastReadAt,
      })
      .from(schema.conversationMembers)
      .where(eq(schema.conversationMembers.userId, userId));

    const convIds = memberships.map((m) => m.conversationId);
    if (convIds.length === 0) return [];

    const conversations = await this.db
      .select({
        id: schema.conversations.id,
        type: schema.conversations.type,
        name: schema.conversations.name,
        avatarUrl: schema.conversations.avatarUrl,
        createdBy: schema.conversations.createdBy,
        createdAt: schema.conversations.createdAt,
        updatedAt: schema.conversations.updatedAt,
      })
      .from(schema.conversations)
      .where(sql`${schema.conversations.id} IN ${convIds}`)
      .orderBy(desc(schema.conversations.updatedAt));

    const results = await Promise.all(
      conversations.map(async (conv) => {
        const members = await this.getConversationMembers(conv.id);
        const lastMessage = await this.getLastMessage(conv.id);
        const unreadCount = await this.getUnreadCount(conv.id, userId);

        let displayName = conv.name;
        if (conv.type === 'direct' && !displayName) {
          const otherMember = members.find((m) => m.id !== userId);
          displayName = otherMember?.fullName || otherMember?.username || 'Unknown';
        }

        return {
          ...conv,
          displayName,
          members,
          lastMessage,
          unreadCount,
        };
      }),
    );

    return results.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async getConversationMembers(conversationId: string) {
    return this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        fullName: schema.userInfo.fullName,
        avatarUrl: schema.userInfo.avatarUrl,
        role: schema.conversationMembers.role,
        joinedAt: schema.conversationMembers.joinedAt,
      })
      .from(schema.conversationMembers)
      .innerJoin(schema.users, eq(schema.conversationMembers.userId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.conversationMembers.conversationId, conversationId));
  }

  async getLastMessage(conversationId: string) {
    const results = await this.db
      .select({
        id: schema.messages.id,
        content: schema.messages.content,
        mediaUrl: schema.messages.mediaUrl,
        mediaType: schema.messages.mediaType,
        senderId: schema.messages.senderId,
        createdAt: schema.messages.createdAt,
        senderName: schema.users.username,
      })
      .from(schema.messages)
      .innerJoin(schema.users, eq(schema.messages.senderId, schema.users.id))
      .where(eq(schema.messages.conversationId, conversationId))
      .orderBy(desc(schema.messages.createdAt))
      .limit(1);

    return results[0] || null;
  }

  async getUnreadCount(conversationId: string, userId: string) {
    const membership = await this.db.query.conversationMembers.findFirst({
      where: and(
        eq(schema.conversationMembers.conversationId, conversationId),
        eq(schema.conversationMembers.userId, userId),
      ),
    });

    if (!membership?.lastReadAt) return 0;

    const result = await this.db
      .select({ count: count() })
      .from(schema.messages)
      .where(
        and(
          eq(schema.messages.conversationId, conversationId),
          sql`${schema.messages.createdAt} > ${membership.lastReadAt}`,
          sql`${schema.messages.senderId} != ${userId}`,
        ),
      );

    return result[0]?.count || 0;
  }

  async createConversation(creatorId: string, type: 'direct' | 'group', memberIds: string[], name?: string, avatarUrl?: string) {
    if (type === 'direct') {
      const allMembers = [creatorId, ...memberIds];
      if (allMembers.length !== 2) {
        throw new ForbiddenException('Direct conversation requires exactly 2 members');
      }

      const existing = await this.findDirectConversation(allMembers[0], allMembers[1]);
      if (existing) return existing;
    }

    const [conversation] = await this.db
      .insert(schema.conversations)
      .values({
        type,
        name: name || null,
        avatarUrl: avatarUrl || null,
        createdBy: creatorId,
      })
      .returning();

    const allMembers = type === 'group' ? [creatorId, ...memberIds] : [creatorId, ...memberIds];
    const uniqueMembers = [...new Set(allMembers)];

    await this.db.insert(schema.conversationMembers).values(
      uniqueMembers.map((userId) => ({
        conversationId: conversation.id,
        userId,
        role: userId === creatorId ? 'admin' : 'member',
      })),
    );

    return {
      ...conversation,
      members: await this.getConversationMembers(conversation.id),
    };
  }

  async findDirectConversation(userId1: string, userId2: string) {
    const user1Convs = await this.db
      .select({ conversationId: schema.conversationMembers.conversationId })
      .from(schema.conversationMembers)
      .where(eq(schema.conversationMembers.userId, userId1));

    const user2Convs = await this.db
      .select({ conversationId: schema.conversationMembers.conversationId })
      .from(schema.conversationMembers)
      .where(eq(schema.conversationMembers.userId, userId2));

    const user1Ids = user1Convs.map((c) => c.conversationId);
    const user2Ids = user2Convs.map((c) => c.conversationId);
    const commonIds = user1Ids.filter((id) => user2Ids.includes(id));

    if (commonIds.length === 0) return null;

    const conv = await this.db.query.conversations.findFirst({
      where: and(
        sql`${schema.conversations.id} IN ${commonIds}`,
        eq(schema.conversations.type, 'direct'),
      ),
    });

    if (!conv) return null;

    return {
      ...conv,
      members: await this.getConversationMembers(conv.id),
    };
  }

  async getMessages(conversationId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;

    const items = await this.db
      .select({
        id: schema.messages.id,
        conversationId: schema.messages.conversationId,
        senderId: schema.messages.senderId,
        content: schema.messages.content,
        mediaUrl: schema.messages.mediaUrl,
        mediaType: schema.messages.mediaType,
        replyTo: schema.messages.replyTo,
        isEdited: schema.messages.isEdited,
        isDeleted: schema.messages.isDeleted,
        createdAt: schema.messages.createdAt,
        updatedAt: schema.messages.updatedAt,
        senderName: schema.users.username,
        senderAvatar: schema.userInfo.avatarUrl,
      })
      .from(schema.messages)
      .innerJoin(schema.users, eq(schema.messages.senderId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.messages.conversationId, conversationId))
      .orderBy(desc(schema.messages.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: count() })
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId));

    return {
      messages: items.reverse(),
      total: totalResult[0]?.count || 0,
      page,
      limit,
    };
  }

  async sendMessage(conversationId: string, senderId: string, content?: string, mediaUrl?: string, mediaType?: string, replyTo?: string) {
    const [message] = await this.db
      .insert(schema.messages)
      .values({
        conversationId,
        senderId,
        content: content || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        replyTo: replyTo || null,
      })
      .returning();

    await this.db
      .update(schema.conversations)
      .set({ updatedAt: new Date() })
      .where(eq(schema.conversations.id, conversationId));

    const sender = await this.db.query.users.findFirst({
      where: eq(schema.users.id, senderId),
    });

    const senderInfo = await this.db.query.userInfo.findFirst({
      where: eq(schema.userInfo.userId, senderId),
    });

    return {
      ...message,
      senderName: sender?.username || 'Unknown',
      senderAvatar: senderInfo?.avatarUrl || null,
    };
  }

  async markAsRead(conversationId: string, userId: string, messageId: string) {
    await this.db
      .update(schema.conversationMembers)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(schema.conversationMembers.conversationId, conversationId),
          eq(schema.conversationMembers.userId, userId),
        ),
      );

    const existing = await this.db.query.messageReads.findFirst({
      where: and(
        eq(schema.messageReads.messageId, messageId),
        eq(schema.messageReads.userId, userId),
      ),
    });

    if (!existing) {
      await this.db.insert(schema.messageReads).values({
        messageId,
        userId,
      });
    }
  }

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.length < 2) return [];

    const results = await this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        fullName: schema.userInfo.fullName,
        avatarUrl: schema.userInfo.avatarUrl,
      })
      .from(schema.users)
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(
        and(
          sql`(${schema.users.username} ILIKE ${'%' + query + '%'} OR ${schema.userInfo.fullName} ILIKE ${'%' + query + '%'})`,
          sql`${schema.users.id} != ${currentUserId}`,
        ),
      )
      .limit(20);

    return results;
  }

  async getConversationById(conversationId: string) {
    const conv = await this.db.query.conversations.findFirst({
      where: eq(schema.conversations.id, conversationId),
    });
    if (!conv) return null;

    return {
      ...conv,
      members: await this.getConversationMembers(conversationId),
    };
  }

  async addMemberToGroup(conversationId: string, userId: string, addedBy: string) {
    const conv = await this.db.query.conversations.findFirst({
      where: eq(schema.conversations.id, conversationId),
    });
    if (!conv || conv.type !== 'group') {
      throw new ForbiddenException('Can only add members to group conversations');
    }

    const adminCheck = await this.db.query.conversationMembers.findFirst({
      where: and(
        eq(schema.conversationMembers.conversationId, conversationId),
        eq(schema.conversationMembers.userId, addedBy),
      ),
    });
    if (adminCheck?.role !== 'admin') {
      throw new ForbiddenException('Only admins can add members');
    }

    const existing = await this.db.query.conversationMembers.findFirst({
      where: and(
        eq(schema.conversationMembers.conversationId, conversationId),
        eq(schema.conversationMembers.userId, userId),
      ),
    });
    if (existing) return existing;

    const [member] = await this.db
      .insert(schema.conversationMembers)
      .values({ conversationId, userId, role: 'member' })
      .returning();

    return member;
  }

  async removeMemberFromGroup(conversationId: string, userId: string, removedBy: string) {
    const conv = await this.db.query.conversations.findFirst({
      where: eq(schema.conversations.id, conversationId),
    });
    if (!conv || conv.type !== 'group') {
      throw new ForbiddenException('Can only remove members from group conversations');
    }

    const adminCheck = await this.db.query.conversationMembers.findFirst({
      where: and(
        eq(schema.conversationMembers.conversationId, conversationId),
        eq(schema.conversationMembers.userId, removedBy),
      ),
    });
    if (adminCheck?.role !== 'admin') {
      throw new ForbiddenException('Only admins can remove members');
    }

    await this.db
      .delete(schema.conversationMembers)
      .where(
        and(
          eq(schema.conversationMembers.conversationId, conversationId),
          eq(schema.conversationMembers.userId, userId),
        ),
      );
  }

  async getGroupConversations() {
    const groups = await this.db
      .select({
        id: schema.conversations.id,
        type: schema.conversations.type,
        name: schema.conversations.name,
        avatarUrl: schema.conversations.avatarUrl,
        createdBy: schema.conversations.createdBy,
        createdAt: schema.conversations.createdAt,
        updatedAt: schema.conversations.updatedAt,
      })
      .from(schema.conversations)
      .where(eq(schema.conversations.type, 'group'))
      .orderBy(desc(schema.conversations.updatedAt));

    const results = await Promise.all(
      groups.map(async (group) => {
        const members = await this.getConversationMembers(group.id);
        const lastMessage = await this.getLastMessage(group.id);
        return { ...group, members, lastMessage, memberCount: members.length };
      }),
    );

    return results;
  }

  async getGroupMessages(conversationId: string, page = 1, limit = 50) {
    return this.getMessages(conversationId, page, limit);
  }

  async getDownlineUsers(userId: string) {
    const downlineRefs = await this.db
      .select({
        referredId: schema.referrals.referredId,
        level: schema.referrals.level,
      })
      .from(schema.referrals)
      .where(eq(schema.referrals.referrerId, userId))
      .orderBy(schema.referrals.level);

    if (downlineRefs.length === 0) return [];

    const userIds = [...new Set(downlineRefs.map((r) => r.referredId))];

    const users = await this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        fullName: schema.userInfo.fullName,
        avatarUrl: schema.userInfo.avatarUrl,
      })
      .from(schema.users)
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(sql`${schema.users.id} IN ${userIds}`);

    const levelMap = new Map<string, number>();
    downlineRefs.forEach((r) => {
      const existing = levelMap.get(r.referredId);
      if (!existing || r.level < existing) {
        levelMap.set(r.referredId, r.level);
      }
    });

    return users.map((u) => ({
      ...u,
      level: levelMap.get(u.id) || 1,
    }));
  }
}
