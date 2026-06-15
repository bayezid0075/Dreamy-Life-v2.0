import React, { useState, useEffect } from 'react';
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

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: string;
  iconBg: string;
  unread: boolean;
}

const initialNotifications: Notification[] = [
  { id: '1', title: 'Order Confirmed', message: 'Your dreamy sleep set has been packaged and is ready to ship.', time: '2m', icon: '🚚', iconBg: '#e9fdff', unread: true },
  { id: '2', title: 'New Message', message: 'Support replied to your inquiry regarding the Silk Pillowcase sizing options.', time: '1h', icon: '💬', iconBg: '#ffd1dc', unread: true },
  { id: '3', title: 'Flash Sale Ending Soon', message: 'Only 2 hours left to get 20% off the Ethereal Comfort Collection.', time: 'Yesterday', icon: '🏷', iconBg: '#ffdad6', unread: true },
  { id: '4', title: 'Leave a Review', message: 'How are you enjoying your recent purchase? Leave a review.', time: 'Oct 12', icon: '⭐', iconBg: '#e5e2e1', unread: false },
  { id: '5', title: 'Profile Updated', message: 'Your shipping address has been successfully updated in your profile.', time: 'Oct 05', icon: '👤', iconBg: '#e5e2e1', unread: false },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) { router.replace('/login'); return; }
      setLoading(false);
    })();
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleClearAll = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
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
      <TopBar title="Notifications" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>You have {unreadCount} unread messages.</Text>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearBtn}>CLEAR ALL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {notifications.map((n) => (
            <GlassPanel
              key={n.id}
              borderRadius={12}
              style={[styles.notifCard, !n.unread && { opacity: 0.7 }]}
            >
              <View style={styles.notifInner}>
                {n.unread && <View style={styles.unreadBar} />}

                <View style={[styles.notifIcon, { backgroundColor: n.iconBg }]}>
                  <Text style={styles.notifEmoji}>{n.icon}</Text>
                </View>

                <View style={styles.notifContent}>
                  <View style={styles.notifTop}>
                    <Text style={styles.notifTitle} numberOfLines={1}>{n.title}</Text>
                    <Text style={styles.notifTime}>{n.time}</Text>
                  </View>
                  <Text style={styles.notifMessage} numberOfLines={1}>{n.message}</Text>
                </View>
              </View>
            </GlassPanel>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 24, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerText: { fontSize: 16, color: '#45474b', flex: 1 },
  clearBtn: { fontSize: 14, fontWeight: '600', color: '#2d666d', letterSpacing: 1 },
  list: { gap: 12 },
  notifCard: { padding: 0 },
  notifInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, position: 'relative' },
  unreadBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#2d666d', borderRadius: 2 },
  notifIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifEmoji: { fontSize: 22 },
  notifContent: { flex: 1, minWidth: 0 },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  notifTitle: { fontSize: 16, fontWeight: '700', color: '#1c1b1b', flex: 1 },
  notifTime: { fontSize: 12, fontWeight: '600', color: '#76777b', marginLeft: 8, flexShrink: 0 },
  notifMessage: { fontSize: 14, color: '#45474b' },
});
