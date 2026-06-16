import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface PostCardProps {
  id: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  mediaUrls?: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  onLike?: () => void;
  onPress?: () => void;
  onAuthorPress?: () => void;
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

export default function PostCard({
  id,
  authorName,
  authorAvatar,
  content,
  mediaUrls,
  likesCount,
  commentsCount,
  createdAt,
  onLike,
  onPress,
  onAuthorPress,
}: PostCardProps) {
  return (
    <GlassPanel borderRadius={12} style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={onAuthorPress}>
        {authorAvatar ? (
          <Image source={{ uri: authorAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{authorName?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{authorName}</Text>
          <Text style={styles.time}>{getTimeAgo(createdAt)}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Text style={styles.content}>{content}</Text>
        {mediaUrls?.length > 0 && (
          <Image
            source={{ uri: mediaUrls[0].startsWith('/') ? `${API_URL}${mediaUrls[0]}` : mediaUrls[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>

      <View style={styles.stats}>
        <Text style={styles.statsText}>{likesCount > 0 ? `${likesCount} likes` : ''}</Text>
        <Text style={styles.statsText}>{commentsCount > 0 ? `${commentsCount} comments` : ''}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { backgroundColor: '#e9fdff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#2d666d', fontWeight: 'bold', fontSize: 14 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: '700', color: '#1c1b1b' },
  time: { fontSize: 13, color: '#45474b' },
  content: { fontSize: 15, color: '#1c1b1b', lineHeight: 22, marginBottom: 12 },
  image: { width: '100%', height: 300, borderRadius: 12, marginBottom: 12 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e5e2e130' },
  statsText: { fontSize: 13, color: '#45474b' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 4 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#45474b' },
});
