import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4080';

export interface CommentData {
  id: string;
  content: string;
  parentCommentId: string | null;
  likesCount: number;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}

interface CommentItemProps {
  comment: CommentData;
  replies?: CommentData[];
  onLike?: (commentId: string) => void;
  onReply?: (parentCommentId: string) => void;
  likedCommentIds?: Set<string>;
  isReply?: boolean;
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CommentItem({
  comment,
  replies = [],
  onLike,
  onReply,
  likedCommentIds = new Set(),
  isReply = false,
}: CommentItemProps) {
  const isLiked = likedCommentIds.has(comment.id);

  return (
    <View style={[isReply ? styles.replyWrapper : styles.commentWrapper]}>
      <View style={styles.commentRow}>
        {comment.authorAvatar ? (
          <Image
            source={{ uri: comment.authorAvatar.startsWith('/') ? `${API_URL}${comment.authorAvatar}` : comment.authorAvatar }}
            style={isReply ? styles.replyAvatar : styles.avatar}
          />
        ) : (
          <View style={[isReply ? styles.replyAvatar : styles.avatar, styles.avatarPlaceholder]}>
            <Text style={[styles.avatarText, isReply && styles.replyAvatarText]}>
              {comment.authorName?.[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.commentBody}>
          <GlassPanel borderRadius={isReply ? 20 : 24} style={styles.glassCard}>
            <View style={[styles.glassContent, isReply && styles.replyGlassContent]}>
              <View style={styles.commentHeader}>
                <Text style={styles.authorName}>{comment.authorName}</Text>
                <Text style={styles.timeAgo}>{getTimeAgo(comment.createdAt)}</Text>
              </View>
              <Text style={[styles.commentText, isReply && styles.replyCommentText]}>
                {comment.content}
              </Text>
            </View>
          </GlassPanel>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onLike?.(comment.id)}
            >
              <Text style={[styles.actionIcon, isLiked && styles.likedIcon]}>
                {isLiked ? '♥' : '♡'}
              </Text>
              <Text style={[styles.actionText, isLiked && styles.likedText]}>Like</Text>
            </TouchableOpacity>
            {!isReply && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onReply?.(comment.id)}
              >
                <Text style={styles.actionText}>Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Nested Replies */}
      {!isReply && replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={onLike}
              likedCommentIds={likedCommentIds}
              isReply
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  commentWrapper: {
    marginBottom: 8,
  },
  replyWrapper: {
    marginTop: 12,
    marginLeft: 24,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.4)',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#e9fdff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#2d666d',
    fontWeight: 'bold',
    fontSize: 16,
  },
  replyAvatarText: {
    fontSize: 12,
  },
  commentBody: {
    flex: 1,
  },
  glassCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.02,
    shadowRadius: 20,
    elevation: 2,
  },
  glassContent: {},
  replyGlassContent: {},
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1b1b',
  },
  timeAgo: {
    fontSize: 12,
    color: '#45474b',
    opacity: 0.7,
  },
  commentText: {
    fontSize: 16,
    color: '#45474b',
    lineHeight: 24,
  },
  replyCommentText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
    marginLeft: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 16,
    color: '#45474b',
  },
  likedIcon: {
    color: '#ba1a1a',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#45474b',
  },
  likedText: {
    color: '#ba1a1a',
  },
  repliesContainer: {
    marginTop: 4,
  },
});
