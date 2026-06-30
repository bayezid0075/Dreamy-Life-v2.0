import { Inject, Injectable } from '@nestjs/common';
import { eq, desc, count, and, sql, or, inArray } from 'drizzle-orm';
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

  // ─── Friend Request Methods ──────────────────────────────────────────

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new Error('Cannot send friend request to yourself');
    }

    const receiver = await this.db.query.users.findFirst({
      where: eq(schema.users.id, receiverId),
    });
    if (!receiver) throw new Error('User not found');

    const existingRequest = await this.db.query.friendRequests.findFirst({
      where: or(
        and(
          eq(schema.friendRequests.senderId, senderId),
          eq(schema.friendRequests.receiverId, receiverId),
        ),
        and(
          eq(schema.friendRequests.senderId, receiverId),
          eq(schema.friendRequests.receiverId, senderId),
        ),
      ),
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        throw new Error('Friend request already pending');
      }
      if (existingRequest.status === 'accepted') {
        throw new Error('Already friends');
      }
    }

    const existingFriend = await this.db.query.friends.findFirst({
      where: or(
        and(eq(schema.friends.userId, senderId), eq(schema.friends.friendId, receiverId)),
        and(eq(schema.friends.userId, receiverId), eq(schema.friends.friendId, senderId)),
      ),
    });
    if (existingFriend) throw new Error('Already friends');

    const [request] = await this.db
      .insert(schema.friendRequests)
      .values({ senderId, receiverId })
      .returning();

    return request;
  }

  async acceptFriendRequest(requestId: string, userId: string) {
    const request = await this.db.query.friendRequests.findFirst({
      where: eq(schema.friendRequests.id, requestId),
    });
    if (!request) throw new Error('Friend request not found');
    if (request.receiverId !== userId) throw new Error('Not authorized');
    if (request.status !== 'pending') throw new Error('Request already processed');

    await this.db
      .update(schema.friendRequests)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(schema.friendRequests.id, requestId));

    await this.db.insert(schema.friends).values([
      { userId: request.senderId, friendId: request.receiverId },
      { userId: request.receiverId, friendId: request.senderId },
    ]);

    return { success: true };
  }

  async rejectFriendRequest(requestId: string, userId: string) {
    const request = await this.db.query.friendRequests.findFirst({
      where: eq(schema.friendRequests.id, requestId),
    });
    if (!request) throw new Error('Friend request not found');
    if (request.receiverId !== userId) throw new Error('Not authorized');
    if (request.status !== 'pending') throw new Error('Request already processed');

    await this.db
      .update(schema.friendRequests)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(schema.friendRequests.id, requestId));

    return { success: true };
  }

  async cancelFriendRequest(requestId: string, senderId: string) {
    const request = await this.db.query.friendRequests.findFirst({
      where: eq(schema.friendRequests.id, requestId),
    });
    if (!request) throw new Error('Friend request not found');
    if (request.senderId !== senderId) throw new Error('Not authorized');
    if (request.status !== 'pending') throw new Error('Request already processed');

    await this.db
      .delete(schema.friendRequests)
      .where(eq(schema.friendRequests.id, requestId));

    return { success: true };
  }

  async getFriendRequests(userId: string) {
    const requests = await this.db
      .select({
        id: schema.friendRequests.id,
        userId: schema.users.id,
        username: schema.users.username,
        fullName: schema.userInfo.fullName,
        avatarUrl: schema.userInfo.avatarUrl,
        createdAt: schema.friendRequests.createdAt,
      })
      .from(schema.friendRequests)
      .innerJoin(schema.users, eq(schema.friendRequests.senderId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(
        and(
          eq(schema.friendRequests.receiverId, userId),
          eq(schema.friendRequests.status, 'pending'),
        ),
      )
      .orderBy(desc(schema.friendRequests.createdAt));

    return { requests, total: requests.length };
  }

  async getSentFriendRequests(userId: string) {
    const requests = await this.db
      .select({
        id: schema.friendRequests.id,
        userId: schema.users.id,
        username: schema.users.username,
        fullName: schema.userInfo.fullName,
        avatarUrl: schema.userInfo.avatarUrl,
        createdAt: schema.friendRequests.createdAt,
      })
      .from(schema.friendRequests)
      .innerJoin(schema.users, eq(schema.friendRequests.receiverId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(
        and(
          eq(schema.friendRequests.senderId, userId),
          eq(schema.friendRequests.status, 'pending'),
        ),
      )
      .orderBy(desc(schema.friendRequests.createdAt));

    return { requests, total: requests.length };
  }

  async getFriends(userId: string) {
    const friendships = await this.db
      .select({
        id: schema.friends.id,
        friendId: schema.friends.friendId,
        username: schema.users.username,
        fullName: schema.userInfo.fullName,
        avatarUrl: schema.userInfo.avatarUrl,
        bio: schema.userInfo.bio,
        memberStatus: schema.users.memberStatus,
        createdAt: schema.friends.createdAt,
      })
      .from(schema.friends)
      .innerJoin(schema.users, eq(schema.friends.friendId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.friends.userId, userId))
      .orderBy(desc(schema.friends.createdAt));

    return { friends: friendships, total: friendships.length };
  }

  async getFriendIds(userId: string): Promise<Set<string>> {
    const friendships = await this.db
      .select({ friendId: schema.friends.friendId })
      .from(schema.friends)
      .where(eq(schema.friends.userId, userId));

    return new Set(friendships.map((f) => f.friendId));
  }

  async getFriendshipStatus(userId1: string, userId2: string): Promise<string> {
    if (userId1 === userId2) return 'self';

    const existingFriend = await this.db.query.friends.findFirst({
      where: or(
        and(eq(schema.friends.userId, userId1), eq(schema.friends.friendId, userId2)),
        and(eq(schema.friends.userId, userId2), eq(schema.friends.friendId, userId1)),
      ),
    });
    if (existingFriend) return 'friends';

    const sentRequest = await this.db.query.friendRequests.findFirst({
      where: and(
        eq(schema.friendRequests.senderId, userId1),
        eq(schema.friendRequests.receiverId, userId2),
        eq(schema.friendRequests.status, 'pending'),
      ),
    });
    if (sentRequest) return 'request_sent';

    const receivedRequest = await this.db.query.friendRequests.findFirst({
      where: and(
        eq(schema.friendRequests.senderId, userId2),
        eq(schema.friendRequests.receiverId, userId1),
        eq(schema.friendRequests.status, 'pending'),
      ),
    });
    if (receivedRequest) return 'request_received';

    return 'none';
  }

  async removeFriend(userId: string, friendId: string) {
    await this.db
      .delete(schema.friends)
      .where(
        or(
          and(eq(schema.friends.userId, userId), eq(schema.friends.friendId, friendId)),
          and(eq(schema.friends.userId, friendId), eq(schema.friends.friendId, userId)),
        ),
      );

    await this.db
      .delete(schema.friendRequests)
      .where(
        or(
          and(
            eq(schema.friendRequests.senderId, userId),
            eq(schema.friendRequests.receiverId, friendId),
          ),
          and(
            eq(schema.friendRequests.senderId, friendId),
            eq(schema.friendRequests.receiverId, userId),
          ),
        ),
      );

    return { success: true };
  }

  async searchFriends(userId: string, query: string) {
    if (!query || query.length < 2) return [];

    const friendIds = await this.getFriendIds(userId);
    if (friendIds.size === 0) return [];

    const idsArray = Array.from(friendIds);

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
          sql`${schema.users.id} IN ${idsArray}`,
          sql`(${schema.users.username} ILIKE ${'%' + query + '%'} OR ${schema.userInfo.fullName} ILIKE ${'%' + query + '%'})`,
        ),
      )
      .limit(20);

    return results;
  }

  async searchAllUsers(userId: string, query: string, page = 1, limit = 30) {
    const offset = (page - 1) * limit;

    const baseWhere = query && query.length >= 2
      ? and(
          sql`(${schema.users.username} ILIKE ${'%' + query + '%'} OR ${schema.userInfo.fullName} ILIKE ${'%' + query + '%'})`,
          sql`${schema.users.id} != ${userId}`,
        )
      : sql`${schema.users.id} != ${userId}`;

    const results = await this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        fullName: schema.userInfo.fullName,
        avatarUrl: schema.userInfo.avatarUrl,
      })
      .from(schema.users)
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(baseWhere)
      .limit(limit)
      .offset(offset);

    const resultsWithStatus = await Promise.all(
      results.map(async (user) => {
        const status = await this.getFriendshipStatus(userId, user.id);
        return { ...user, friendshipStatus: status };
      }),
    );

    return resultsWithStatus;
  }

  // ─── Personalized Feed Algorithm ─────────────────────────────────────

  async getPersonalizedFeed(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const friendIds = await this.getFriendIds(userId);
    const friendIdsArray = Array.from(friendIds);

    const likedAuthors = await this.db
      .select({
        authorId: schema.posts.authorId,
        likeCount: count(),
      })
      .from(schema.postLikes)
      .innerJoin(schema.posts, eq(schema.postLikes.postId, schema.posts.id))
      .where(eq(schema.postLikes.userId, userId))
      .groupBy(schema.posts.authorId);

    const likedAuthorMap = new Map<string, number>();
    likedAuthors.forEach((a) => likedAuthorMap.set(a.authorId, a.likeCount));

    const allPosts = await this.db
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
      .limit(200)
      .offset(0);

    const now = Date.now();
    const scoredPosts = allPosts.map((post) => {
      let score = 0;

      if (friendIds.has(post.authorId)) {
        score += 100;
      }

      const authorLikeCount = likedAuthorMap.get(post.authorId) || 0;
      score += authorLikeCount * 10;

      const hoursOld = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 48 - hoursOld);

      score += (post.likesCount || 0) * 0.1;
      score += (post.commentsCount || 0) * 0.5;

      return { ...post, score };
    });

    scoredPosts.sort((a, b) => b.score - a.score);

    const paginated = scoredPosts.slice(offset, offset + limit);

    const totalResult = await this.db
      .select({ count: count() })
      .from(schema.posts);

    return {
      items: paginated,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    };
  }
}
