import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/shared/stores/authStore';
import { authFetch } from '@/shared/api';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const OPERATOR_COLORS: Record<string, { color: string; bgColor: string }> = {
  gp: { color: '#00a651', bgColor: '#e6f9ee' },
  bl: { color: '#e4002b', bgColor: '#fde6ec' },
  rb: { color: '#003580', bgColor: '#e6ecf5' },
  al: { color: '#ed1c24', bgColor: '#fde6e7' },
  tt: { color: '#f7941d', bgColor: '#fef3e2' },
  st: { color: '#6db33f', bgColor: '#eef5e8' },
};

interface RechargeOrder {
  id: string;
  phoneNumber: string;
  operator: string;
  connectionType: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  success: { label: 'Success', color: '#00a651', bgColor: '#e6f9ee' },
  pending: { label: 'Pending', color: '#f7941d', bgColor: '#fef3e2' },
  failed: { label: 'Failed', color: '#e4002b', bgColor: '#fde6ec' },
};

export default function RechargeHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, accessToken, logout } = useAuthStore();

  const [orders, setOrders] = useState<RechargeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) loadOrders();
  }, [isAuthenticated]);

  const loadOrders = async (pageNum: number = 1, append: boolean = false) => {
    if (!accessToken) { router.replace('/login'); return; }
    try {
      const res = await authFetch(`${API_URL}/recharge/orders?page=${pageNum}&limit=20`);
      if (res.status === 401) { await logout(); router.replace('/login'); return; }
      if (res.ok) {
        const data = await res.json();
        const newOrders = data.data?.orders || data.data || [];
        if (append) {
          setOrders(prev => [...prev, ...newOrders]);
        } else {
          setOrders(newOrders);
        }
        setHasMore(newOrders.length === 20);
      }
    } catch (err) {
      console.error('Failed to load recharge orders', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadOrders(1, false);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOrders(nextPage, true);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOperatorInfo = (opId: string) => {
    return OPERATOR_COLORS[opId] || { color: '#5d5e64', bgColor: '#f0f0f5' };
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AuroraBackground />
        <ActivityIndicator size="large" color="#ff5c26" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar showBack title="Recharge History" showNotification={false} showSearch={false} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 56 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff5c26" />
        }
        onScrollEndDrag={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
            loadMore();
          }
        }}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>📱</Text>
            </View>
            <Text style={styles.emptyTitle}>No Recharge History</Text>
            <Text style={styles.emptySubtitle}>
              Your recharge transactions will appear here.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.orderList}>
              {orders.map(order => {
                const opInfo = getOperatorInfo(order.operator);
                const statusInfo = getStatusConfig(order.status);
                return (
                  <GlassPanel key={order.id} borderRadius={16} style={styles.orderCard}>
                    <View style={styles.orderTop}>
                      <View style={styles.orderLeft}>
                        <View style={[styles.operatorCircle, { backgroundColor: opInfo.bgColor }]}>
                          <Text style={[styles.operatorInitials, { color: opInfo.color }]}>
                            {order.operator.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.orderInfo}>
                          <Text style={styles.phoneNumber}>{order.phoneNumber}</Text>
                          <Text style={styles.operatorLabel}>
                            {order.operator.toUpperCase()} • {order.connectionType}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.orderRight}>
                        <Text style={styles.amount}>৳{order.amount.toLocaleString()}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                          <Text style={[styles.statusText, { color: statusInfo.color }]}>
                            {statusInfo.label}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.orderBottom}>
                      <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
                      <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
                    </View>
                  </GlassPanel>
                );
              })}
            </View>

            {hasMore && (
              <View style={styles.loadMoreWrap}>
                <ActivityIndicator size="small" color="#ff5c26" />
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,92,38,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1b1b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#45474b',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Order List
  orderList: { gap: 12 },
  orderCard: { padding: 16 },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  operatorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorInitials: {
    fontSize: 13,
    fontWeight: '800',
  },
  orderInfo: { flex: 1 },
  phoneNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1c1b1b',
    letterSpacing: 0.5,
  },
  operatorLabel: {
    fontSize: 11,
    color: '#45474b',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  orderRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1b1b',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.4)',
  },
  dateText: {
    fontSize: 11,
    color: 'rgba(69,71,75,0.6)',
  },
  orderId: {
    fontSize: 11,
    color: 'rgba(69,71,75,0.4)',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  loadMoreWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
