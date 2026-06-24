import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4080';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function PointsHistoryScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState<{ pointsBalance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => { loadData(); }, [filter, timeRange]);

  const loadData = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) { router.replace('/login'); return; }
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch(`${API_URL}/wallet`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/wallet/transactions?type=points&filter=${timeRange}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (walletRes.status === 401 || txRes.status === 401) { await AsyncStorage.removeItem('accessToken'); router.replace('/login'); return; }
      if (walletRes.ok) { const d = await walletRes.json(); setWallet(d.data.wallet); }
      if (txRes.ok) { const d = await txRes.json(); setTransactions(d.data.transactions); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTypeInfo = (type: string) => {
    if (type === 'point_earned') return { icon: '↓', color: '#2d666d', bg: '#e9fdff', label: 'Earned', positive: true };
    return { icon: '↑', color: '#ba1a1a', bg: '#ffdad6', label: 'Spent', positive: false };
  };

  const filtered = filter === 'all' ? transactions : transactions.filter(t => filter === 'earned' ? t.type.includes('earned') : t.type.includes('spent'));

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
      <TopBar showBack title="Points History" showNotification={false} showSearch={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Total Points */}
        <GlassPanel borderRadius={16} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceIcon}>⭐</Text>
            <Text style={styles.balanceValue}>{wallet?.pointsBalance?.toLocaleString() || '0'}</Text>
          </View>
        </GlassPanel>

        {/* Time Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {['all', 'today', 'yesterday', '7d', '15d', '30d'].map(range => (
              <TouchableOpacity
                key={range}
                onPress={() => setTimeRange(range)}
                style={[styles.timeFilter, timeRange === range && styles.timeFilterActive]}
              >
                <Text style={[styles.timeFilterText, timeRange === range && styles.timeFilterTextActive]}>
                  {range === 'all' ? 'All Time' : range === '7d' ? '7 Days' : range === '15d' ? '15 Days' : range === '30d' ? '30 Days' : range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Type Tabs */}
        <View style={styles.typeTabs}>
          {[
            { key: 'all', label: 'All' },
            { key: 'earned', label: 'Earned' },
            { key: 'spent', label: 'Spent' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilter(tab.key)}
              style={[styles.typeTab, filter === tab.key && styles.typeTabActive]}
            >
              <Text style={[styles.typeTabText, filter === tab.key && styles.typeTabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions */}
        <View style={styles.txList}>
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>No transactions found</Text>
          ) : (
            filtered.map(tx => {
              const info = getTypeInfo(tx.type);
              return (
                <View key={tx.id} style={styles.txItem}>
                  <View style={[styles.txIcon, { backgroundColor: info.bg }]}>
                    <Text style={[styles.txIconText, { color: info.color }]}>{info.icon}</Text>
                  </View>
                  <View style={styles.txContent}>
                    <Text style={styles.txDescription} numberOfLines={1}>{tx.description}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: info.color }]}>{info.positive ? '+' : '-'}{tx.amount.toFixed(0)}</Text>
                    <View style={[styles.txBadge, { backgroundColor: info.bg }]}>
                      <Text style={[styles.txBadgeText, { color: info.color }]}>{info.label}</Text>
                    </View>
                  </View>
                </View>
              );
            })
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
  balanceCard: { marginBottom: 20, padding: 24, alignItems: 'center' },
  balanceLabel: { fontSize: 12, fontWeight: '700', color: '#45474b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceIcon: { fontSize: 32 },
  balanceValue: { fontSize: 36, fontWeight: '800', color: '#1c1b1b' },
  filterScroll: { marginBottom: 12 },
  filterRow: { gap: 8, flexDirection: 'row' },
  timeFilter: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  timeFilterActive: { backgroundColor: '#1c1b1b' },
  timeFilterText: { fontSize: 13, fontWeight: '600', color: '#45474b' },
  timeFilterTextActive: { color: '#ffffff' },
  typeTabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 9999, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  typeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9999 },
  typeTabActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  typeTabText: { fontSize: 13, fontWeight: '600', color: '#45474b' },
  typeTabTextActive: { color: '#1c1b1b' },
  txList: { gap: 10 },
  emptyText: { textAlign: 'center', color: '#45474b', paddingVertical: 20 },
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  txIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  txIconText: { fontSize: 18, fontWeight: '700' },
  txContent: { flex: 1, minWidth: 0 },
  txDescription: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  txDate: { fontSize: 11, color: '#45474b', marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '700' },
  txBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  txBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
});
