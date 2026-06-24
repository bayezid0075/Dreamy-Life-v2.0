import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import CommentItem, { CommentData } from '../components/CommentItem';
import CommentInput from '../components/CommentInput';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4080';

export default function CommentsScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) { router.replace('/login'); return; }
      const res = await fetch(`${API_URL}/posts/${postId}/comments?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (content: string) => {
    if (!postId) return;
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;
      const body: any = { content };
      if (replyTo) body.parentCommentId = replyTo;

      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [newComment, ...prev]);
        setReplyTo(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`${API_URL}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLikedCommentIds((prev) => {
          const next = new Set(prev);
          if (data.liked) next.add(commentId);
          else next.delete(commentId);
          return next;
        });
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, likesCount: c.likesCount + (data.liked ? 1 : -1) }
              : c
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = (parentCommentId: string) => {
    setReplyTo(parentCommentId);
  };

  // Build flat list: top-level comments + their replies inline
  const topLevelComments = comments.filter((c) => !c.parentCommentId);
  const repliesByParent = comments.reduce<Record<string, CommentData[]>>((acc, c) => {
    if (c.parentCommentId) {
      if (!acc[c.parentCommentId]) acc[c.parentCommentId] = [];
      acc[c.parentCommentId].push(c);
    }
    return acc;
  }, {});

  const renderComment = ({ item }: { item: CommentData }) => (
    <CommentItem
      comment={item}
      replies={repliesByParent[item.id] || []}
      onLike={handleLikeComment}
      onReply={handleReply}
      likedCommentIds={likedCommentIds}
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <AuroraBackground />
      <TopBar title="Comments" showBack />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5d5e64" />
        </View>
      ) : (
        <FlatList
          data={topLevelComments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
            </View>
          }
        />
      )}

      {/* Fixed Bottom Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputInner}>
          <CommentInput
            onSubmit={handleSubmitComment}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            submitting={submitting}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf9f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 100,
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#45474b',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: 'rgba(252,249,248,0.8)',
    backdropFilter: 'blur(20px)',
  },
  inputInner: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
});
