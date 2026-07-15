import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuthStore } from '@/shared/stores/authStore';
import { authFetch } from '@/shared/api';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';
import { useNotificationStore } from '@/shared/stores/notificationStore';
import { useI18n } from '../shared/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface UserNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  imageUrl?: string;
  link?: string;
  type: string;
  category: string;
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

export default function NotificationsScreen() {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthStore();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);

  const getTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return t('justNow');
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHr < 24) return `${diffHr}h`;
    if (diffDay < 7) return `${diffDay}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'social' | 'app'>('all');

  const fetchNotifications = useCallback(async (pageNum: number, append = false, tab?: string) => {
    try {
      if (!accessToken) return;

      const category = tab || activeTab;
      const res = await authFetch(`${API_URL}/notifications?page=${pageNum}&limit=20&category=${category}`);
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
  }, [activeTab, accessToken]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      if (!accessToken) {
        router.replace('/login');
        return;
      }
      await fetchNotifications(1);
      setLoading(false);
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && unreadCount > 0) {
      handleMarkAllAsRead();
    }
  }, [loading]);

  useEffect(() => {
    setPage(1);
    fetchNotifications(1, false, activeTab);
  }, [activeTab]);

  const handleMarkAsRead = async (recipientId: string) => {
    try {
      if (!accessToken) return;

      await authFetch(`${API_URL}/notifications/${recipientId}/read`, {
        method: 'PATCH',
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
      if (!accessToken) return;

      await authFetch(`${API_URL}/notifications/read-all?category=${activeTab}`, {
        method: 'PATCH',
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

  const tabs = [
    { key: 'all', label: t('all') },
    { key: 'social', label: t('social') },
    { key: 'app', label: t('app') },
  ];

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title={t('notifications')} showBack showSearch={false} showNotification={false} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as typeof activeTab)}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>
            {unreadCount > 0 ? t('unreadNotifications', { count: String(unreadCount) }) : t('allCaughtUp')}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead}>
              <Text style={styles.clearBtn}>{t('markAllRead')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.list}>
          {notifications.length === 0 && (
            <GlassPanel borderRadius={12} style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'social' && t('noSocialNotifications')}
                {activeTab === 'app' && t('noAppNotifications')}
                {activeTab === 'all' && t('noNotificationsYet')}
              </Text>
            </GlassPanel>
          )}

          {notifications.map((n) => {
            const iconData = iconMap[n.icon || ''] || iconMap.default;
            return (
              <TouchableOpacity
                key={n.recipientId}
                onPress={() => router.push(`/notifications/${n.id}` as any)}
                activeOpacity={0.7}
              >
                <GlassPanel
                  borderRadius={12}
                  style={[styles.notifCard, n.read && styles.notifCardRead]}
                >
                  <View style={styles.notifInner}>
                    {!n.read && <View style={styles.unreadBar} />}

                    <View style={[styles.notifIcon, { backgroundColor: iconData.bg }]}>
                      {n.imageUrl ? (
                        <Image source={{ uri: n.imageUrl }} style={styles.notifIconImage} />
                      ) : (
                        <Text style={styles.notifEmoji}>{iconData.emoji}</Text>
                      )}
                    </View>

                    <View style={styles.notifContent}>
                      <View style={styles.notifTop}>
                        <View style={styles.notifTitleRow}>
                          <Text style={styles.notifTitle} numberOfLines={1}>{n.title}</Text>
                          {n.category === 'social' && (
                            <View style={styles.socialBadge}>
                              <Text style={styles.socialBadgeText}>{t('social')}</Text>
                            </View>
                          )}
                          {n.link ? <Text style={styles.linkIcon}>🔗</Text> : null}
                        </View>
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
                <Text style={styles.loadMoreText}>{t('loadMore')}</Text>
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
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginTop: 100, marginBottom: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  activeTab: { backgroundColor: '#1c1b1b', borderColor: '#1c1b1b' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#45474b' },
  activeTabText: { color: '#ffffff' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
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
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  notifTitle: { fontSize: 15, fontWeight: '700', color: '#1c1b1b', flex: 1 },
  socialBadge: { backgroundColor: '#ffd1dc', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  socialBadgeText: { fontSize: 10, fontWeight: '600', color: '#78555e' },
  notifTime: { fontSize: 12, fontWeight: '600', color: '#76777b', marginLeft: 8, flexShrink: 0 },
  notifMessage: { fontSize: 13, color: '#45474b' },
  notifIconImage: { width: 48, height: 48, borderRadius: 24 },
  linkIcon: { fontSize: 10, marginLeft: 4 },
  loadMoreBtn: { marginTop: 4 },
  loadMoreCard: { paddingVertical: 12, alignItems: 'center' },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: '#2d666d' },
});
