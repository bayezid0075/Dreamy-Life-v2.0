import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';
import PostCard from '@/features/feed/components/PostCard';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function ProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [stats, setStats] = useState({ postsCount: 0, followersCount: 0, followingCount: 0 });
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [username, setUsername] = useState('');

  const fetchProfile = useCallback(async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) return;
    const userId = id || (await AsyncStorage.getItem('userId'));

    const [statsRes, postsRes, userRes] = await Promise.all([
      fetch(`${API_URL}/users/${userId}/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/users/${userId}/posts?page=1&limit=50`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const statsData = await statsRes.json();
    const postsData = await postsRes.json();
    setStats(statsData);
    setPosts(postsData.items || []);

    if (userRes.ok) {
      const userData = await userRes.json();
      setUsername(userData.data?.user?.username || 'User');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) { router.replace('/login'); return; }
      await fetchProfile();
    })();
  }, []);

  const handleFollow = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    const userId = id || (await AsyncStorage.getItem('userId'));
    if (!token || !userId) return;
    const res = await fetch(`${API_URL}/users/${userId}/follow`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setIsFollowing(data.following);
      setStats((s) => ({ ...s, followersCount: s.followersCount + (data.following ? 1 : -1) }));
    }
  };

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
      <TopBar title="Profile" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Cover */}
        <View style={styles.cover} />

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{username[0]?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Info */}
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.bio}>Digital creator exploring the intersection of minimalist design and everyday magic.</Text>

        {/* Stats */}
        <GlassPanel borderRadius={12} style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatCount(stats.followersCount)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{formatCount(stats.followingCount)}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.postsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </GlassPanel>

        {/* Follow Button */}
        <TouchableOpacity style={[styles.followBtn, isFollowing && styles.followingBtn]} onPress={handleFollow}>
          <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>

        {/* Posts */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {posts.length === 0 ? (
          <GlassPanel borderRadius={12} style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: '#45474b' }}>No posts yet</Text>
          </GlassPanel>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              authorName={post.authorName}
              authorAvatar={post.authorAvatar}
              content={post.content}
              mediaUrls={post.mediaUrls}
              likesCount={post.likesCount}
              commentsCount={post.commentsCount}
              createdAt={post.createdAt}
              onPress={() => router.push(`/posts/${post.id}`)}
              onAuthorPress={() => {}}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcf9f8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcf9f8' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 16, paddingBottom: 40, alignItems: 'center' },
  cover: { width: '100%', height: 160, borderRadius: 12, backgroundColor: '#e9fdff', marginBottom: 50 },
  avatarContainer: { alignItems: 'center', marginTop: -50, marginBottom: 16 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#e9fdff', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.6)' },
  avatarText: { color: '#2d666d', fontWeight: 'bold', fontSize: 32 },
  username: { fontSize: 24, fontWeight: '700', color: '#1c1b1b', marginBottom: 8 },
  bio: { fontSize: 14, color: '#45474b', textAlign: 'center', marginBottom: 24, paddingHorizontal: 24 },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', padding: 16, marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#1c1b1b' },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#45474b' },
  divider: { width: 1, height: 32, backgroundColor: '#c6c6cb30' },
  followBtn: { backgroundColor: '#1A1A1A', borderRadius: 24, paddingHorizontal: 32, paddingVertical: 12, marginBottom: 24 },
  followingBtn: { backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: '#c6c6cb' },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  followingBtnText: { color: '#1c1b1b' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#45474b', alignSelf: 'flex-start', marginBottom: 12 },
});
