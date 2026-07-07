import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/shared/stores/authStore';
import { authFetch } from '@/shared/api';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const OPERATORS = [
  { id: 'ALL', name: 'All Operators', color: '#45474b', bgColor: '#e5e2e9' },
  { id: 'GP', name: 'Grameenphone', color: '#00a651', bgColor: '#e6f9ee' },
  { id: 'BL', name: 'Banglalink', color: '#e4002b', bgColor: '#fde6ec' },
  { id: 'RB', name: 'Robi', color: '#003580', bgColor: '#e6ecf5' },
  { id: 'AL', name: 'Airtel', color: '#ed1c24', bgColor: '#fde6e7' },
  { id: 'TT', name: 'Teletalk', color: '#f7941d', bgColor: '#fef3e2' },
  { id: 'ST', name: 'Skitto', color: '#6db33f', bgColor: '#eef5e8' },
];

const CATEGORIES = [
  { id: 'ALL', name: 'All Packs' },
  { id: 'MN', name: 'Minutes' },
  { id: 'IN', name: 'Internet' },
  { id: 'BD', name: 'Combo' },
];

const OPERATOR_KEY_MAP: Record<string, string> = {
  Grameenphone: 'GP',
  Banglalink: 'BL',
  Robi: 'RB',
  Airtel: 'AL',
  Teletalk: 'TT',
  Skitto: 'ST',
};

interface OfferPack {
  _operator: string;
  _number_type: string;
  _offer_type: string;
  _minute_pack: string;
  _internet_pack: string;
  _sms_pack: string;
  _callrate_pack: string;
  _validity: string;
  _amount: string;
  _commission_amount: string;
  _status: string;
  _offer_details: string;
}

export default function DrivePackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, accessToken, logout } = useAuthStore();

  const [packs, setPacks] = useState<OfferPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOperator, setSelectedOperator] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    fetchPacks();
  }, [isAuthenticated]);

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/recharge/offer-packs`);
      if (res.status === 401) { await logout(); router.replace('/login'); return; }
      const data = await res.json();
      if (data.success && data.data?.packs) {
        setPacks(data.data.packs);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load offer packs.');
    } finally {
      setLoading(false);
    }
  };

  const getOperatorKey = (opName: string): string => {
    return OPERATOR_KEY_MAP[opName] || opName.toUpperCase().substring(0, 2);
  };

  const filteredPacks = packs.filter((pack) => {
    if (selectedOperator !== 'ALL') {
      const packOpKey = getOperatorKey(pack._operator);
      if (packOpKey !== selectedOperator) return false;
    }
    if (selectedCategory !== 'ALL') {
      if (pack._offer_type !== selectedCategory) return false;
    }
    return true;
  });

  const handleBuyPack = (pack: OfferPack) => {
    const opKey = getOperatorKey(pack._operator);
    router.push({
      pathname: '/recharge',
      params: {
        operator: opKey,
        amount: pack._amount,
        offerDetails: pack._offer_details,
      },
    } as any);
  };

  const getCategoryLabel = (pack: OfferPack): string => {
    switch (pack._offer_type) {
      case 'MN': return 'Minutes';
      case 'IN': return 'Internet';
      case 'BD': return 'Combo';
      case 'SM': return 'SMS';
      default: return pack._offer_type;
    }
  };

  const getCategoryColor = (type: string): string => {
    switch (type) {
      case 'MN': return '#00a651';
      case 'IN': return '#1565c0';
      case 'BD': return '#f7941d';
      case 'SM': return '#7b1fa2';
      default: return '#45474b';
    }
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
      <TopBar showBack title="Drive Pack" showNotification={false} showSearch={false} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 56 }]}
      >
        {/* Operator Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {OPERATORS.map((op) => {
            const isActive = selectedOperator === op.id;
            return (
              <TouchableOpacity
                key={op.id}
                onPress={() => setSelectedOperator(op.id)}
                style={[
                  styles.filterBtn,
                  isActive && styles.filterBtnActive,
                ]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.filterIcon,
                    { backgroundColor: op.bgColor },
                    isActive && { backgroundColor: op.color },
                  ]}
                >
                  <Text style={[styles.filterIconText, { color: op.color }, isActive && { color: '#fff' }]}>
                    {op.id === 'ALL' ? '🌐' : op.id}
                  </Text>
                </View>
                <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                  {op.id === 'ALL' ? 'All' : op.id}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.categoryBtn,
                  isActive && styles.categoryBtnActive,
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Pack Count */}
        <Text style={styles.packCount}>{filteredPacks.length} packs found</Text>

        {/* Pack Cards */}
        {filteredPacks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Packs Found</Text>
            <Text style={styles.emptySubtitle}>Try a different operator or category filter.</Text>
          </View>
        ) : (
          filteredPacks.map((pack, index) => {
            const catColor = getCategoryColor(pack._offer_type);
            return (
              <GlassPanel key={index} borderRadius={16} style={styles.packCard}>
                {/* Header */}
                <View style={styles.packHeader}>
                  <View style={styles.packHeaderLeft}>
                    <View style={[styles.packOpBadge, { backgroundColor: catColor + '15' }]}>
                      <Text style={[styles.packOpText, { color: catColor }]}>
                        {pack._operator}
                      </Text>
                    </View>
                    <View style={[styles.packTypeBadge, { backgroundColor: catColor + '15' }]}>
                      <Text style={[styles.packTypeText, { color: catColor }]}>
                        {getCategoryLabel(pack)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.packValidity}>{pack._validity}</Text>
                </View>

                {/* Details */}
                <View style={styles.packDetails}>
                  {pack._minute_pack && pack._minute_pack !== '0' && pack._minute_pack !== '' && (
                    <View style={styles.packDetailItem}>
                      <Text style={styles.packDetailIcon}>📞</Text>
                      <Text style={styles.packDetailText}>{pack._minute_pack} Min</Text>
                    </View>
                  )}
                  {pack._internet_pack && pack._internet_pack !== '0' && pack._internet_pack !== '' && (
                    <View style={styles.packDetailItem}>
                      <Text style={styles.packDetailIcon}>📶</Text>
                      <Text style={styles.packDetailText}>{pack._internet_pack}</Text>
                    </View>
                  )}
                  {pack._sms_pack && pack._sms_pack !== '0' && pack._sms_pack !== '' && (
                    <View style={styles.packDetailItem}>
                      <Text style={styles.packDetailIcon}>💬</Text>
                      <Text style={styles.packDetailText}>{pack._sms_pack} SMS</Text>
                    </View>
                  )}
                </View>

                {pack._offer_details ? (
                  <Text style={styles.packOfferDetails} numberOfLines={2}>{pack._offer_details}</Text>
                ) : null}

                {/* Footer */}
                <View style={styles.packFooter}>
                  <View style={styles.packPriceWrap}>
                    <Text style={styles.packPrice}>৳{pack._amount}</Text>
                    {pack._commission_amount && pack._commission_amount !== '0' && (
                      <Text style={styles.packCommission}>Earn ৳{pack._commission_amount}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.buyBtn}
                    onPress={() => handleBuyPack(pack)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buyBtnText}>Get Pack</Text>
                  </TouchableOpacity>
                </View>
              </GlassPanel>
            );
          })
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
  content: { paddingBottom: 40 },

  filterScroll: { marginBottom: 12 },
  filterRow: { paddingHorizontal: 20, gap: 12 },
  filterBtn: { alignItems: 'center', gap: 6, width: 60 },
  filterBtnActive: {},
  filterIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconText: { fontSize: 14, fontWeight: '800' },
  filterLabel: { fontSize: 10, fontWeight: '600', color: '#45474b', textAlign: 'center' },
  filterLabelActive: { color: '#ff5c26' },

  categoryScroll: { marginBottom: 12 },
  categoryRow: { paddingHorizontal: 20, gap: 8 },
  categoryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,38,0.15)',
  },
  categoryBtnActive: {
    backgroundColor: '#ff5c26',
    borderColor: '#ff5c26',
  },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#ff5c26' },
  categoryTextActive: { color: '#ffffff' },

  packCount: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(69,71,75,0.6)',
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  packCard: { marginBottom: 12, marginHorizontal: 20 },
  packHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  packHeaderLeft: { flexDirection: 'row', gap: 8 },
  packOpBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  packOpText: { fontSize: 12, fontWeight: '700' },
  packTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  packTypeText: { fontSize: 12, fontWeight: '700' },
  packValidity: { fontSize: 11, fontWeight: '600', color: 'rgba(69,71,75,0.5)' },

  packDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  packDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  packDetailIcon: { fontSize: 14 },
  packDetailText: { fontSize: 13, fontWeight: '600', color: '#1c1b1b' },

  packOfferDetails: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(69,71,75,0.6)',
    marginBottom: 12,
  },

  packFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(118,119,123,0.08)',
    paddingTop: 12,
  },
  packPriceWrap: { gap: 2 },
  packPrice: { fontSize: 20, fontWeight: '800', color: '#1c1b1b' },
  packCommission: { fontSize: 11, fontWeight: '600', color: '#0d9488' },

  buyBtn: {
    backgroundColor: '#ff5c26',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 9999,
    shadowColor: '#ff5c26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buyBtnText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#45474b', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, fontWeight: '500', color: 'rgba(69,71,75,0.5)' },
});
