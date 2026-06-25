import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';
import { useNotificationStore } from '@/shared/stores/notificationStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4080';

interface UserNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  type: string;
  sentAt?: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
  recipientId: string;
}

const iconMap: Record<string, { emoji: string; bg: string }> = {
  local_shipping: { emoji: '🚚', bg: '#e9fdff' },
  chat_bubble: { emoji: '💬', bg: '#ffd1dc' },
  percent: { emoji: '🏷️', bg: '#ffdad6' },
  star: { emoji: '⭐', bg: '#fffde7' },
  account_circle: { emoji: '👤', bg: '#e5e2e1' },
  notifications: { emoji: '🔔', bg: '#e8eaf6' },
  card_giftcard: { emoji: '🎁', bg: '#f3e5f5' },
  campaign: { emoji: '📢', bg: '#e3f2fd' },
  default: { emoji: '🔔', bg: '#e5e2e1' },
};

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

export default function NotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const res = await fetch(`${API_URL}/notifications?page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        if (append) {
          setNotifications((prev) => [...prev, ...data.items]);
        } else {
          setNotifications(data.items);
        }
        setUnreadCount(data.unreadCount);
        setHasMore(data.items.length === 20);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/login');
        return;
      }
      await fetchNotifications(1);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading && unreadCount > 0) {
      handleMarkAllAsRead();
    }
  }, [loading]);

  const handleMarkAsRead = async (recipientId: string) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      await fetch(`${API_URL}/notifications/${recipientId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.recipientId === recipientId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      useNotificationStore.getState().decrementCount();
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      useNotificationStore.getState().resetCount();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
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
      <TopBar title="Notifications" showBack showSearch={false} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications.` : 'All caught up!'}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead}>
              <Text style={styles.clearBtn}>MARK ALL READ</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.list}>
          {notifications.length === 0 && (
            <GlassPanel borderRadius={12} style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </GlassPanel>
          )}

          {notifications.map((n) => {
            const iconData = iconMap[n.icon || ''] || iconMap.default;
            return (
              <TouchableOpacity
                key={n.recipientId}
                onPress={() => !n.read && handleMarkAsRead(n.recipientId)}
                activeOpacity={0.7}
              >
                <GlassPanel
                  borderRadius={12}
                  style={[styles.notifCard, n.read && styles.notifCardRead]}
                >
                  <View style={styles.notifInner}>
                    {!n.read && <View style={styles.unreadBar} />}

                    <View style={[styles.notifIcon, { backgroundColor: iconData.bg }]}>
                      <Text style={styles.notifEmoji}>{iconData.emoji}</Text>
                    </View>

                    <View style={styles.notifContent}>
                      <View style={styles.notifTop}>
                        <Text style={styles.notifTitle} numberOfLines={1}>{n.title}</Text>
                        <Text style={styles.notifTime}>
                          {n.sentAt ? getTimeAgo(n.sentAt) : getTimeAgo(n.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.notifMessage} numberOfLines={1}>{n.body}</Text>
                    </View>
                  </View>
                </GlassPanel>
              </TouchableOpacity>
            );
          })}

          {hasMore && notifications.length > 0 && (
            <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreBtn}>
              <GlassPanel borderRadius={12} style={styles.loadMoreCard}>
                <Text style={styles.loadMoreText}>Load more</Text>
              </GlassPanel>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerText: { fontSize: 14, color: '#45474b', flex: 1 },
  clearBtn: { fontSize: 12, fontWeight: '700', color: '#2d666d', letterSpacing: 1 },
  list: { gap: 12 },
  emptyCard: { padding: 48, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#45474b' },
  notifCard: { padding: 0 },
  notifCardRead: { opacity: 0.7 },
  notifInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, position: 'relative' },
  unreadBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#2d666d', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  notifIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifEmoji: { fontSize: 22 },
  notifContent: { flex: 1, minWidth: 0 },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  notifTitle: { fontSize: 15, fontWeight: '700', color: '#1c1b1b', flex: 1 },
  notifTime: { fontSize: 12, fontWeight: '600', color: '#76777b', marginLeft: 8, flexShrink: 0 },
  notifMessage: { fontSize: 13, color: '#45474b' },
  loadMoreBtn: { marginTop: 4 },
  loadMoreCard: { paddingVertical: 12, alignItems: 'center' },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: '#2d666d' },
});
