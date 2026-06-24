import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4080';

export default function VendorDashboardScreen() {
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) { router.replace('/login'); return; }
    try {
      const res = await fetch(`${API_URL}/vendor/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { await AsyncStorage.removeItem('accessToken'); router.replace('/login'); return; }
      if (res.ok) { const data = await res.json(); setVendor(data.data); }
    } catch { /* error */ }
    finally { setLoading(false); }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><AuroraBackground /><ActivityIndicator size="large" color="#5d5e64" /></View>;
  }

  if (!vendor) {
    return (
      <View style={styles.container}>
        <AuroraBackground />
        <TopBar title="Vendor Dashboard" showBack showSearch={false} showNotification={false} />
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48 }}>🏪</Text>
          <Text style={styles.emptyTitle}>No Vendor Profile</Text>
          <Text style={styles.emptyDesc}>Apply to become a vendor first</Text>
          <TouchableOpacity style={styles.submitBtn} onPress={() => router.push('/vendor/apply')}>
            <Text style={styles.submitBtnText}>Become a Vendor</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="Vendor Dashboard" showBack showSearch={false} showNotification={false} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <GlassPanel borderRadius={16} style={styles.performanceCard}>
          <Text style={styles.shopName}>{vendor.shopName}</Text>
          <Text style={styles.period}>Last 30 days overview</Text>
          <Text style={styles.revenue}>${vendor.totalRevenue?.toFixed(2) || '0.00'}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vendor.totalProducts || 0}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vendor.totalOrders || 0}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
          </View>
        </GlassPanel>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/vendor/products')}>
          <Text style={styles.menuIcon}>📦</Text>
          <Text style={styles.menuText}>Inventory Management</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/reselling/orders')}>
          <Text style={styles.menuIcon}>🛒</Text>
          <Text style={styles.menuText}>Reseller Orders</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/reseller-shop')}>
          <Text style={styles.menuIcon}>🏪</Text>
          <Text style={styles.menuText}>Reseller Shop</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 20, paddingBottom: 40 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1c1b1b' },
  emptyDesc: { fontSize: 14, color: '#45474b', textAlign: 'center' },
  performanceCard: { padding: 24, marginBottom: 16 },
  shopName: { fontSize: 20, fontWeight: '700', color: '#1c1b1b' },
  period: { fontSize: 13, color: '#45474b', marginTop: 4 },
  revenue: { fontSize: 36, fontWeight: '800', color: '#1c1b1b', marginTop: 16 },
  statsRow: { flexDirection: 'row', marginTop: 20, gap: 16 },
  statItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1c1b1b' },
  statLabel: { fontSize: 12, color: '#45474b', marginTop: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', gap: 16 },
  menuIcon: { fontSize: 24 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1c1b1b' },
  menuArrow: { fontSize: 18, color: '#45474b' },
  submitBtn: { backgroundColor: '#1c1b1b', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  submitBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
});
