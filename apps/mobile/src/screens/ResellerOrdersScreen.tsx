import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/shared/stores/authStore';
import { authFetch } from '@/shared/api';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f9a825', confirmed: '#2d666d', shipped: '#1565c0', delivered: '#2e7d32', cancelled: '#93000a',
};

export default function ResellerOrdersScreen() {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated]);

  useEffect(() => { if (isAuthenticated) loadOrders(); }, [isAuthenticated]);

  const loadOrders = async () => {
    if (!accessToken) { router.replace('/login'); return; }
    try {
      const res = await authFetch(`${API_URL}/reselling/orders`);
      if (res.ok) { const data = await res.json(); setOrders(data.data || []); }
    } catch { /* error */ }
    finally { setLoading(false); }
  };

  if (loading) return <View style={styles.loadingContainer}><AuroraBackground /><ActivityIndicator size="large" color="#5d5e64" /></View>;

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="My Orders" showBack showSearch={false} showNotification={false} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48 }}>🛒</Text>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <TouchableOpacity style={styles.submitBtn} onPress={() => router.push('/reseller-shop')}>
              <Text style={styles.submitBtnText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order: any) => (
            <TouchableOpacity key={order.id} style={styles.orderCard} onPress={() => router.push(`/reselling/tracking/${order.id}`)}>
              <View style={styles.orderLeft}>
                <Text style={styles.orderProduct} numberOfLines={1}>{order.productName || 'Product'}</Text>
                <Text style={styles.orderMeta}>{order.customerName} · {order.shopName}</Text>
                <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderPrice}>${order.resellerPrice?.toFixed(2)}</Text>
                <Text style={styles.orderProfit}>+${order.profit?.toFixed(2)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[order.status] || '#45474b') + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] || '#45474b' }]}>{order.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 20, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1c1b1b' },
  orderCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', gap: 12 },
  orderLeft: { flex: 1 },
  orderProduct: { fontSize: 14, fontWeight: '700', color: '#1c1b1b', marginBottom: 4 },
  orderMeta: { fontSize: 12, color: '#45474b' },
  orderDate: { fontSize: 11, color: '#45474b', marginTop: 4 },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderPrice: { fontSize: 14, fontWeight: '700', color: '#1c1b1b' },
  orderProfit: { fontSize: 12, fontWeight: '600', color: '#2d666d' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  submitBtn: { backgroundColor: '#1c1b1b', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  submitBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
});
