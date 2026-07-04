import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import BottomNav from '@/shared/components/BottomNav';
import GlassPanel from '@/shared/components/GlassPanel';
import { useI18n } from '@/shared/i18n';
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) { router.replace('/login'); return; }
      try {
        const res = await fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) { await AsyncStorage.removeItem('accessToken'); router.replace('/login'); return; }
        if (res.ok) {
          const data = await res.json();
          setUser(data.data.user);
        }
      } catch (err) { console.error('Failed to load profile', err); }
      finally { setLoading(false); }
    })();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('accessToken');
    router.replace('/login');
  };

  const displayName = user?.info?.fullName || user?.username || 'User';
  const displayEmail = user?.info?.email || 'No email set';
  const avatarUrl = user?.info?.avatarUrl;

  const settingsItems = [
    { icon: '👤', label: t('personalInformation'), href: '/edit-profile' as const },
    { icon: '⚙️', label: t('settings'), href: '/settings' as const },
    { icon: '📍', label: t('shippingAddress') },
    { icon: '🧾', label: t('orderHistory') },
    { icon: '💳', label: t('paymentMethods') },
    { icon: '👛', label: t('wallet'), href: '/wallet' as const },
    { icon: '🔔', label: t('notifications'), href: '/notifications' as const },
  ];

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
      <TopBar showMenu={false} showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]} />
            {avatarUrl ? (
              <Image source={{ uri: resolveMediaUrl(avatarUrl) }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarFallbackText}>{user?.username?.[0]?.toUpperCase() || '👤'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.displayEmail}>{displayEmail}</Text>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
            <Text style={styles.editBtnText}>{t('editProfile')}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <GlassPanel borderRadius={16} style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={[styles.statItem, { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>{t('orders')}</Text>
            </View>
            <View style={[styles.statItem, { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={styles.statValue}>48</Text>
              <Text style={styles.statLabel}>{t('wishlist')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>{t('coupons')}</Text>
            </View>
          </View>
        </GlassPanel>

        {/* Settings List */}
        <View style={styles.settingsCard}>
          {settingsItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.settingsItem}
                onPress={() => item.href && router.push(item.href)}
              >
                <View style={styles.settingsLeft}>
                  <Text style={styles.settingsIcon}>{item.icon}</Text>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                </View>
                <Text style={styles.settingsArrow}>›</Text>
              </TouchableOpacity>
              {i < settingsItems.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 {t('logOut')}</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },
  profileHeader: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  avatarWrap: { width: 128, height: 128, marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { ...StyleSheet.absoluteFillObject, borderRadius: 64, borderWidth: 4, borderColor: 'rgba(152,208,215,0.3)' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  avatarFallback: { backgroundColor: '#e5e2e1', alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { fontSize: 48 },
  displayName: { fontSize: 28, fontWeight: '700', color: '#1c1b1b', marginBottom: 4 },
  displayEmail: { fontSize: 16, color: '#45474b', marginBottom: 20 },
  editBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.5)' },
  editBtnText: { fontSize: 14, fontWeight: '600', color: '#1c1b1b', letterSpacing: 0.5 },
  statsCard: { width: '100%', padding: 20, marginBottom: 24 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1c1b1b' },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#45474b', marginTop: 4, letterSpacing: 0.5 },
  settingsCard: { width: '100%', borderRadius: 30, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 24 },
  settingsItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  settingsIcon: { fontSize: 20 },
  settingsLabel: { fontSize: 16, color: '#1c1b1b' },
  settingsArrow: { fontSize: 22, color: '#76777b' },
  divider: { height: 1, width: '90%', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.3)' },
  logoutBtn: { paddingVertical: 14, paddingHorizontal: 32 },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#ba1a1a', letterSpacing: 0.5 },
});
