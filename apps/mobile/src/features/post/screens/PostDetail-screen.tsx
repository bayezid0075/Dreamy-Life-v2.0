import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

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

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) { router.replace('/login'); return; }
      if (!id) return;
      const res = await fetch(`${API_URL}/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPost(data);
      setLoading(false);
    })();
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) return;
    const res = await fetch(`${API_URL}/posts/${post.id}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setPost({ ...post, liked: data.liked, likesCount: post.likesCount + (data.liked ? 1 : -1) });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AuroraBackground />
        <ActivityIndicator size="large" color="#5d5e64" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <AuroraBackground />
        <Text style={{ color: '#45474b' }}>Post not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="Post" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <GlassPanel borderRadius={12} style={styles.postCard}>
          <View style={styles.header}>
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{post.authorName?.[0]?.toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{post.authorName}</Text>
              <Text style={styles.time}>{getTimeAgo(post.createdAt)}</Text>
            </View>
          </View>
          <Text style={styles.postContent}>{post.content}</Text>
          {post.mediaUrls?.length > 0 && (
            <Image
              source={{ uri: post.mediaUrls[0].startsWith('/') ? `${API_URL}${post.mediaUrls[0]}` : post.mediaUrls[0] }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
              <Text style={[styles.actionText, post.liked && { color: '#78555e' }]}>
                Like ({post.likesCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(`/comments/${post.id}`)} style={styles.actionBtn}>
              <Text style={styles.actionText}>Comments ({post.commentsCount})</Text>
            </TouchableOpacity>
          </View>
        </GlassPanel>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcf9f8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcf9f8' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  postCard: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { backgroundColor: '#e9fdff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#2d666d', fontWeight: 'bold', fontSize: 14 },
  authorName: { fontSize: 15, fontWeight: '700', color: '#1c1b1b' },
  time: { fontSize: 13, color: '#45474b' },
  postContent: { fontSize: 15, color: '#1c1b1b', lineHeight: 22, marginBottom: 12 },
  postImage: { width: '100%', height: 300, borderRadius: 12, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e2e130' },
  actionBtn: {},
  actionText: { fontSize: 14, fontWeight: '600', color: '#45474b' },
});
