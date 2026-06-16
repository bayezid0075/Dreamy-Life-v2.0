import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`${API_URL}/feed?page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        if (append) setPosts((prev) => [...prev, ...data.items]);
        else setPosts(data.items);
        setHasMore(data.items.length === 20);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) { router.replace('/login'); return; }
      await fetchPosts(1);
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(1);
    setRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) => prev.map((p) =>
          p.id === postId ? { ...p, likesCount: p.likesCount + (data.liked ? 1 : -1) } : p
        ));
      }
    } catch (err) { console.error(err); }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <GlassPanel borderRadius={12} style={styles.postCard}>
      {/* Header */}
      <TouchableOpacity
        style={styles.postHeader}
        onPress={() => router.push(`/users/${item.authorId}`)}
      >
        {item.authorAvatar ? (
          <Image source={{ uri: item.authorAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{item.authorName?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.postAuthor}>
          <Text style={styles.authorName}>{item.authorName}</Text>
          <Text style={styles.postTime}>{getTimeAgo(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>

      {/* Content */}
      <Text style={styles.postContent}>{item.content}</Text>

      {/* Image */}
      {item.mediaUrls?.length > 0 && (
        <Image
          source={{ uri: item.mediaUrls[0].startsWith('/') ? `${API_URL}${item.mediaUrls[0]}` : item.mediaUrls[0] }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {item.likesCount > 0 ? `${formatCount(item.likesCount)} likes` : ''}
        </Text>
        <Text style={styles.statsText}>
          {item.commentsCount > 0 ? `${item.commentsCount} comments` : ''}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/posts/${item.id}`)}>
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </GlassPanel>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AuroraBackground />
        <ActivityIndicator size="large" color="#5d5e64" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="Feed" />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={() => {
          if (hasMore) {
            const next = page + 1;
            setPage(next);
            fetchPosts(next, true);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/posts/create')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcf9f8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcf9f8' },
  listContent: { paddingTop: 100, paddingHorizontal: 16, paddingBottom: 100, gap: 16 },
  postCard: { padding: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { backgroundColor: '#e9fdff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#2d666d', fontWeight: 'bold', fontSize: 14 },
  postAuthor: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: '700', color: '#1c1b1b' },
  postTime: { fontSize: 13, color: '#45474b' },
  postContent: { fontSize: 15, color: '#1c1b1b', lineHeight: 22, marginBottom: 12 },
  postImage: { width: '100%', height: 300, borderRadius: 12, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e5e2e130' },
  statsText: { fontSize: 13, color: '#45474b' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 4 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#45474b' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#45474b' },
  fab: {
    position: 'absolute', bottom: 100, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2d666d', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
