import { Inject, Injectable } from '@nestjs/common';
import { eq, desc, count, and, sql } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class PostService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(authorId: string, content: string, mediaUrls: string[] = []) {
    const [post] = await this.db
      .insert(schema.posts)
      .values({ authorId, content, mediaUrls })
      .returning();
    return post;
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const items = await this.db
      .select({
        id: schema.posts.id,
        content: schema.posts.content,
        mediaUrls: schema.posts.mediaUrls,
        likesCount: schema.posts.likesCount,
        commentsCount: schema.posts.commentsCount,
        createdAt: schema.posts.createdAt,
        updatedAt: schema.posts.updatedAt,
        authorId: schema.users.id,
        authorName: schema.users.username,
        authorAvatar: schema.userInfo.avatarUrl,
      })
      .from(schema.posts)
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .orderBy(desc(schema.posts.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: count() })
      .from(schema.posts);

    return {
      items,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const results = await this.db
      .select({
        id: schema.posts.id,
        content: schema.posts.content,
        mediaUrls: schema.posts.mediaUrls,
        likesCount: schema.posts.likesCount,
        commentsCount: schema.posts.commentsCount,
        createdAt: schema.posts.createdAt,
        updatedAt: schema.posts.updatedAt,
        authorId: schema.users.id,
        authorName: schema.users.username,
        authorAvatar: schema.userInfo.avatarUrl,
      })
      .from(schema.posts)
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.posts.id, id))
      .limit(1);

    return results[0] || null;
  }

  async remove(id: string, userId: string) {
    await this.db
      .delete(schema.comments)
      .where(eq(schema.comments.postId, id));

    await this.db
      .delete(schema.postLikes)
      .where(eq(schema.postLikes.postId, id));

    if (userId) {
      await this.db
        .delete(schema.posts)
        .where(and(eq(schema.posts.id, id), eq(schema.posts.authorId, userId)));
    } else {
      await this.db
        .delete(schema.posts)
        .where(eq(schema.posts.id, id));
    }
  }

  async toggleLike(postId: string, userId: string) {
    const existing = await this.db.query.postLikes.findFirst({
      where: and(
        eq(schema.postLikes.postId, postId),
        eq(schema.postLikes.userId, userId),
      ),
    });

    if (existing) {
      await this.db
        .delete(schema.postLikes)
        .where(eq(schema.postLikes.id, existing.id));
      await this.db
        .update(schema.posts)
        .set({ likesCount: sql`${schema.posts.likesCount} - 1` })
        .where(eq(schema.posts.id, postId));
      return { liked: false };
    } else {
      await this.db.insert(schema.postLikes).values({ postId, userId });
      await this.db
        .update(schema.posts)
        .set({ likesCount: sql`${schema.posts.likesCount} + 1` })
        .where(eq(schema.posts.id, postId));
      return { liked: true };
    }
  }

  async getPostLikers(postId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        avatarUrl: schema.userInfo.avatarUrl,
        likedAt: schema.postLikes.createdAt,
      })
      .from(schema.postLikes)
      .innerJoin(schema.users, eq(schema.postLikes.userId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.postLikes.postId, postId))
      .orderBy(desc(schema.postLikes.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async addComment(postId: string, authorId: string, content: string, parentCommentId?: string) {
    const [comment] = await this.db
      .insert(schema.comments)
      .values({ postId, authorId, content, parentCommentId: parentCommentId || null })
      .returning();

    await this.db
      .update(schema.posts)
      .set({ commentsCount: sql`${schema.posts.commentsCount} + 1` })
      .where(eq(schema.posts.id, postId));

    const results = await this.db
      .select({
        id: schema.comments.id,
        content: schema.comments.content,
        parentCommentId: schema.comments.parentCommentId,
        likesCount: schema.comments.likesCount,
        createdAt: schema.comments.createdAt,
        authorId: schema.users.id,
        authorName: schema.users.username,
        authorAvatar: schema.userInfo.avatarUrl,
      })
      .from(schema.comments)
      .innerJoin(schema.users, eq(schema.comments.authorId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.comments.id, comment.id))
      .limit(1);

    return results[0];
  }

  async getComments(postId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    return this.db
      .select({
        id: schema.comments.id,
        content: schema.comments.content,
        parentCommentId: schema.comments.parentCommentId,
        likesCount: schema.comments.likesCount,
        createdAt: schema.comments.createdAt,
        authorId: schema.users.id,
        authorName: schema.users.username,
        authorAvatar: schema.userInfo.avatarUrl,
      })
      .from(schema.comments)
      .innerJoin(schema.users, eq(schema.comments.authorId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.comments.postId, postId))
      .orderBy(desc(schema.comments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async toggleCommentLike(commentId: string, userId: string) {
    const existing = await this.db.query.commentLikes.findFirst({
      where: and(
        eq(schema.commentLikes.commentId, commentId),
        eq(schema.commentLikes.userId, userId),
      ),
    });

    if (existing) {
      await this.db
        .delete(schema.commentLikes)
        .where(eq(schema.commentLikes.id, existing.id));
      await this.db
        .update(schema.comments)
        .set({ likesCount: sql`${schema.comments.likesCount} - 1` })
        .where(eq(schema.comments.id, commentId));
      return { liked: false };
    } else {
      await this.db.insert(schema.commentLikes).values({ commentId, userId });
      await this.db
        .update(schema.comments)
        .set({ likesCount: sql`${schema.comments.likesCount} + 1` })
        .where(eq(schema.comments.id, commentId));
      return { liked: true };
    }
  }

  async hasLikedComment(commentId: string, userId: string) {
    const existing = await this.db.query.commentLikes.findFirst({
      where: and(
        eq(schema.commentLikes.commentId, commentId),
        eq(schema.commentLikes.userId, userId),
      ),
    });
    return !!existing;
  }

  async removeComment(commentId: string, postId: string) {
    await this.db
      .delete(schema.comments)
      .where(and(eq(schema.comments.id, commentId), eq(schema.comments.authorId, commentId)));

    await this.db
      .update(schema.posts)
      .set({ commentsCount: sql`${schema.posts.commentsCount} - 1` })
      .where(eq(schema.posts.id, postId));
  }

  async getUserPosts(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const items = await this.db
      .select({
        id: schema.posts.id,
        content: schema.posts.content,
        mediaUrls: schema.posts.mediaUrls,
        likesCount: schema.posts.likesCount,
        commentsCount: schema.posts.commentsCount,
        createdAt: schema.posts.createdAt,
        updatedAt: schema.posts.updatedAt,
        authorId: schema.users.id,
        authorName: schema.users.username,
        authorAvatar: schema.userInfo.avatarUrl,
      })
      .from(schema.posts)
      .innerJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.posts.authorId, userId))
      .orderBy(desc(schema.posts.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: count() })
      .from(schema.posts)
      .where(eq(schema.posts.authorId, userId));

    return {
      items,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) return null;

    const info = await this.db.query.userInfo.findFirst({
      where: eq(schema.userInfo.userId, userId),
    });

    return {
      id: user.id,
      username: user.username,
      memberStatus: user.memberStatus,
      createdAt: user.createdAt,
      info: info
        ? {
            fullName: info.fullName,
            avatarUrl: info.avatarUrl,
            bio: info.bio,
            coverImage: info.coverImage,
          }
        : null,
    };
  }

  async getUserStats(userId: string) {
    const postsCount = await this.db
      .select({ count: count() })
      .from(schema.posts)
      .where(eq(schema.posts.authorId, userId));

    const followersCount = await this.db
      .select({ count: count() })
      .from(schema.follows)
      .where(eq(schema.follows.followingId, userId));

    const followingCount = await this.db
      .select({ count: count() })
      .from(schema.follows)
      .where(eq(schema.follows.followerId, userId));

    return {
      postsCount: postsCount[0]?.count || 0,
      followersCount: followersCount[0]?.count || 0,
      followingCount: followingCount[0]?.count || 0,
    };
  }

  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const existing = await this.db.query.follows.findFirst({
      where: and(
        eq(schema.follows.followerId, followerId),
        eq(schema.follows.followingId, followingId),
      ),
    });

    if (existing) {
      await this.db
        .delete(schema.follows)
        .where(eq(schema.follows.id, existing.id));
      return { following: false };
    } else {
      await this.db.insert(schema.follows).values({ followerId, followingId });
      return { following: true };
    }
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        avatarUrl: schema.userInfo.avatarUrl,
        followedAt: schema.follows.createdAt,
      })
      .from(schema.follows)
      .innerJoin(schema.users, eq(schema.follows.followerId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.follows.followingId, userId))
      .orderBy(desc(schema.follows.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        avatarUrl: schema.userInfo.avatarUrl,
        followedAt: schema.follows.createdAt,
      })
      .from(schema.follows)
      .innerJoin(schema.users, eq(schema.follows.followingId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.follows.followerId, userId))
      .orderBy(desc(schema.follows.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async isFollowing(followerId: string, followingId: string) {
    const existing = await this.db.query.follows.findFirst({
      where: and(
        eq(schema.follows.followerId, followerId),
        eq(schema.follows.followingId, followingId),
      ),
    });
    return !!existing;
  }

  async hasLiked(postId: string, userId: string) {
    const existing = await this.db.query.postLikes.findFirst({
      where: and(
        eq(schema.postLikes.postId, postId),
        eq(schema.postLikes.userId, userId),
      ),
    });
    return !!existing;
  }

  async getAdminStats() {
    const totalPosts = await this.db.select({ count: count() }).from(schema.posts);
    const totalLikes = await this.db.select({ count: count() }).from(schema.postLikes);
    const totalComments = await this.db.select({ count: count() }).from(schema.comments);
    const totalFollows = await this.db.select({ count: count() }).from(schema.follows);

    return {
      totalPosts: totalPosts[0]?.count || 0,
      totalLikes: totalLikes[0]?.count || 0,
      totalComments: totalComments[0]?.count || 0,
      totalFollows: totalFollows[0]?.count || 0,
    };
  }
}
