import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface NotificationDetail {
  id: string;
  title: string;
  body: string;
  icon?: string;
  imageUrl?: string;
  link?: string;
  type: string;
  category: string;
  status: string;
  sentAt?: string;
  createdAt: string;
  createdBy: string;
  totalRecipients: number;
  totalRead: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationDetail | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        router.replace('/login');
        return;
      }
      if (!id) return;

      try {
        const res = await fetch(`${API_URL}/notifications/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setNotification(data.data || data.notification || data.data?.notification);
      } catch (err) {
        console.error('Failed to fetch notification', err);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleMarkAsRead = async () => {
    if (!notification) return;
    setActionLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      const recipientRes = await fetch(`${API_URL}/notifications?page=1&limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const recipientData = await recipientRes.json();
      const matched = recipientData.items?.find((n: any) => n.id === notification.id);
      if (matched?.recipientId) {
        await fetch(`${API_URL}/notifications/${matched.recipientId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    setActionLoading(false);
  };

  const handleOpenLink = async () => {
    if (notification?.link) {
      const canOpen = await Linking.canOpenURL(notification.link);
      if (canOpen) Linking.openURL(notification.link);
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

  if (!notification) {
    return (
      <View style={styles.loadingContainer}>
        <AuroraBackground />
        <Text style={{ fontSize: 16, color: '#45474b' }}>Notification not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="Notification" showBack showSearch={false} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <GlassPanel borderRadius={16} style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, {
              backgroundColor: notification.category === 'social' ? '#ffd1dc' : '#e8eaf6',
            }]}>
              <Text style={{ fontSize: 24 }}>
                {notification.icon === 'campaign' ? '📢' :
                 notification.icon === 'chat_bubble' ? '💬' :
                 notification.icon === 'local_shipping' ? '🚚' :
                 notification.icon === 'card_giftcard' ? '🎁' :
                 notification.icon === 'star' ? '⭐' :
                 notification.icon === 'percent' ? '🏷️' :
                 notification.icon === 'account_circle' ? '👤' : '🔔'}
              </Text>
            </View>
            <View style={styles.headerTexts}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={2}>{notification.title}</Text>
                <View style={[styles.categoryBadge, {
                  backgroundColor: notification.category === 'social' ? '#ffd1dc' : '#e8eaf6',
                }]}>
                  <Text style={[styles.categoryBadgeText, {
                    color: notification.category === 'social' ? '#78555e' : '#3949ab',
                  }]}>{notification.category}</Text>
                </View>
              </View>
              <Text style={styles.date}>
                {notification.sentAt ? formatDate(notification.sentAt) : formatDate(notification.createdAt)}
              </Text>
            </View>
          </View>

          {notification.imageUrl && (
            <Image source={{ uri: notification.imageUrl }} style={styles.image} resizeMode="cover" />
          )}

          <Text style={styles.body}>{notification.body}</Text>

          {notification.link && (
            <TouchableOpacity style={styles.linkBtn} onPress={handleOpenLink} activeOpacity={0.8}>
              <Text style={styles.linkBtnText}>Open Link</Text>
              <Text style={styles.linkBtnArrow}>↗</Text>
            </TouchableOpacity>
          )}
        </GlassPanel>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <GlassPanel borderRadius={12} style={styles.backBtnCard}>
            <Text style={styles.backBtnText}>Back to Notifications</Text>
          </GlassPanel>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 110, paddingBottom: 40 },
  card: { padding: 24 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 20 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  headerTexts: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#1c1b1b', flex: 1 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryBadgeText: { fontSize: 11, fontWeight: '600' },
  date: { fontSize: 13, color: '#76777b' },
  image: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  body: { fontSize: 15, lineHeight: 24, color: '#45474b', marginBottom: 20 },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#2d666d', paddingVertical: 14, borderRadius: 12,
  },
  linkBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  linkBtnArrow: { fontSize: 16, color: '#ffffff', fontWeight: '700' },
  backBtn: { marginTop: 16 },
  backBtnCard: { paddingVertical: 14, alignItems: 'center' },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#2d666d' },
});
