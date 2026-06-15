import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import BottomNav from '@/shared/components/BottomNav';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const { width } = Dimensions.get('window');

const PRIMARY_ACTIONS = [
  { icon: '📦', label: 'Add Parcel', bg: '#e9fdff', activeBg: '#2d666d' },
  { icon: '🚚', label: 'Pickup Request', bg: '#ffd1dc', activeBg: '#78555e' },
  { icon: '⚡', label: 'Express Delivery', bg: '#e2e2e9', activeBg: '#5d5e64' },
  { icon: '🔄', label: 'Pick & Drop', bg: '#ffdad6', activeBg: '#ba1a1a' },
];

const SECONDARY_ACTIONS = [
  { icon: '📋', label: 'Parcels' },
  { icon: '📊', label: 'Summary' },
  { icon: '💳', label: 'Payments' },
  { icon: '💰', label: 'Add Balance' },
  { icon: '📈', label: 'Latest RTNs' },
  { icon: '❌', label: 'Cancellation' },
  { icon: '🛡', label: 'Fraud Check' },
  { icon: '🎫', label: 'Tickets' },
];

const SUPPORT_ACTIONS = [
  { icon: '🎧', label: 'Support', color: '#2d666d' },
  { icon: '📍', label: 'Pickup Points', color: '#78555e' },
  { icon: '🗺', label: 'Coverage', color: '#5d5e64' },
  { icon: '🧮', label: 'Pricing', color: '#5d5e64' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = React.useRef(new Animated.Value(-320)).current;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) { router.replace('/login'); return; }
    try {
      const res = await fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { await AsyncStorage.removeItem('accessToken'); router.replace('/login'); return; }
      if (res.ok) {
        const data = await res.json();
        setUser(data.data.user);
      }
    } catch (err) { console.error('Failed to load', err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, []);

  const toggleDrawer = () => {
    const toValue = drawerOpen ? -320 : 0;
    Animated.spring(drawerAnim, { toValue, useNativeDriver: true, tension: 65, friction: 11 }).start();
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('accessToken');
    router.replace('/login');
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
      <TopBar showMenu onMenuPress={toggleDrawer} avatarUrl={user?.info?.avatarUrl} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5d5e64" />}
      >
        {/* Hero Banner */}
        <GlassPanel borderRadius={16} style={styles.heroBanner}>
          <View style={styles.heroOverlay}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>Seamless Delivery</Text>
              <Text style={styles.heroSubtitle}>Manage all your shipments in one elegant space.</Text>
            </View>
          </View>
        </GlassPanel>

        {/* Primary Actions */}
        <View style={styles.primaryGrid}>
          {PRIMARY_ACTIONS.map((item) => (
            <TouchableOpacity key={item.label} style={styles.primaryCard} activeOpacity={0.7}>
              <View style={[styles.primaryIcon, { backgroundColor: item.bg }]}>
                <Text style={styles.primaryEmoji}>{item.icon}</Text>
              </View>
              <Text style={styles.primaryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Secondary Features */}
        <GlassPanel borderRadius={16} style={styles.secondarySection}>
          <View style={styles.secondaryGrid}>
            {SECONDARY_ACTIONS.map((item) => (
              <TouchableOpacity key={item.label} style={styles.secondaryItem} activeOpacity={0.7}>
                <View style={styles.secondaryIcon}>
                  <Text style={styles.secondaryEmoji}>{item.icon}</Text>
                </View>
                <Text style={styles.secondaryLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassPanel>

        {/* Support Row */}
        <GlassPanel borderRadius={16} style={styles.supportSection}>
          <View style={styles.secondaryGrid}>
            {SUPPORT_ACTIONS.map((item) => (
              <TouchableOpacity key={item.label} style={styles.secondaryItem} activeOpacity={0.7}>
                <View style={[styles.secondaryIcon, { backgroundColor: item.color + '15' }]}>
                  <Text style={styles.secondaryEmoji}>{item.icon}</Text>
                </View>
                <Text style={styles.secondaryLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassPanel>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Side Drawer */}
      {drawerOpen && (
        <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={toggleDrawer}>
          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
            <BlurView intensity={40} tint="light" style={styles.drawerBlur}>
              <View style={styles.drawerOverlay} />
              <View style={styles.drawerContent}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Dreamy Life</Text>
                  <TouchableOpacity onPress={toggleDrawer}>
                    <Text style={styles.drawerClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <GlassPanel borderRadius={16} style={styles.userCard}>
                  <View style={styles.userRow}>
                    <View style={styles.userAvatar}>
                      {user?.info?.avatarUrl ? (
                        <Text style={styles.userAvatarText}>👤</Text>
                      ) : (
                        <Text style={styles.userAvatarText}>👤</Text>
                      )}
                    </View>
                    <View>
                      <Text style={styles.userName}>{user?.username}</Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>⭐ {user?.memberStatus}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.referRow}>
                    <Text style={styles.referLabel}>Refer: <Text style={styles.referCode}>{user?.ownRefercode}</Text></Text>
                  </View>
                </GlassPanel>

                <View style={styles.drawerNav}>
                  <Text style={styles.drawerSectionTitle}>Main</Text>
                  <TouchableOpacity style={[styles.drawerItem, styles.drawerItemActive]} onPress={() => { toggleDrawer(); }}>
                    <Text style={styles.drawerItemIcon}>🏠</Text>
                    <Text style={styles.drawerItemTextActive}>Dashboard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); router.push('/referral'); }}>
                    <Text style={styles.drawerItemIcon}>🔗</Text>
                    <Text style={styles.drawerItemText}>Referral</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); router.push('/membership'); }}>
                    <Text style={styles.drawerItemIcon}>💳</Text>
                    <Text style={styles.drawerItemText}>Membership</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); router.push('/wallet'); }}>
                    <Text style={styles.drawerItemIcon}>👛</Text>
                    <Text style={styles.drawerItemText}>Wallet</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                  <Text style={styles.logoutText}>🚪 Log Out</Text>
                </TouchableOpacity>
                <Text style={styles.version}>v1.0.0</Text>
              </View>
            </BlurView>
          </Animated.View>
        </TouchableOpacity>
      )}

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 100, paddingHorizontal: 24, paddingBottom: 40 },
  heroBanner: { marginBottom: 24, height: 160, padding: 0 },
  heroOverlay: { flex: 1, justifyContent: 'flex-end', padding: 24 },
  heroTextWrap: {},
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#1c1b1b', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#45474b' },
  primaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  primaryCard: { width: (width - 60) / 4, alignItems: 'center', gap: 12 },
  primaryIcon: { width: 56, height: 72, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryEmoji: { fontSize: 24 },
  primaryLabel: { fontSize: 11, fontWeight: '600', color: '#1c1b1b', textAlign: 'center' },
  secondarySection: { marginBottom: 16, padding: 16 },
  secondaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  secondaryItem: { width: '22%', alignItems: 'center', marginBottom: 20 },
  secondaryIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e5e2e1', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  secondaryEmoji: { fontSize: 18 },
  secondaryLabel: { fontSize: 10, color: '#45474b', textAlign: 'center' },
  supportSection: { marginBottom: 16, padding: 16 },
  drawerBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 60 },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 320, zIndex: 61 },
  drawerBlur: { flex: 1, overflow: 'hidden' },
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)' },
  drawerContent: { flex: 1, padding: 24, paddingTop: 56 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  drawerTitle: { fontSize: 18, fontWeight: '700', color: '#5d5e64' },
  drawerClose: { fontSize: 18, color: '#45474b' },
  userCard: { marginBottom: 32, padding: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  userAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f8f8ff', borderWidth: 2, borderColor: 'white', alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 24 },
  userName: { fontSize: 18, fontWeight: '700', color: '#1c1b1b' },
  statusBadge: { marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: '600', color: '#5d5e64' },
  referRow: { backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  referLabel: { fontSize: 12, fontWeight: '600', color: '#45474b' },
  referCode: { color: '#5d5e64', letterSpacing: 2 },
  drawerNav: { flex: 1 },
  drawerSectionTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(69,71,75,0.5)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, paddingHorizontal: 16 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4, gap: 16 },
  drawerItemActive: { backgroundColor: '#f8f8ff' },
  drawerItemIcon: { fontSize: 18 },
  drawerItemText: { fontSize: 15, fontWeight: '600', color: '#45474b' },
  drawerItemTextActive: { fontSize: 15, fontWeight: '600', color: '#5d5e64' },
  logoutBtn: { padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,218,214,0.5)', borderWidth: 1, borderColor: 'rgba(186,26,26,0.1)', alignItems: 'center', marginTop: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#ba1a1a' },
  version: { textAlign: 'center', fontSize: 10, color: 'rgba(69,71,75,0.4)', marginTop: 16 },
});
