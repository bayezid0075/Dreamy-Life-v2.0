import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Linking,
} from 'react-native';
import { useAuthStore } from '@/shared/stores/authStore';
import { authFetch } from '@/shared/api';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';
import { useI18n } from '../shared/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface WalletData {
  walletBalance: number;
  fundsBalance: number;
  pointsBalance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function WalletScreen() {
  const router = useRouter();
  const { isAuthenticated, accessToken, logout } = useAuthStore();
  const { t } = useI18n();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [addFundsVisible, setAddFundsVisible] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated]);

  useEffect(() => { if (isAuthenticated) loadData(); }, [filter, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) loadData();
    }, [filter])
  );

  const loadData = async () => {
    if (!accessToken) { router.replace('/login'); return; }
    try {
      const [walletRes, txRes] = await Promise.all([
        authFetch(`${API_URL}/wallet`),
        authFetch(`${API_URL}/wallet/transactions?type=${filter}`),
      ]);
      if (walletRes.status === 401 || txRes.status === 401) {
        await logout();
        router.replace('/login');
        return;
      }
      if (walletRes.ok) { const d = await walletRes.json(); setWallet(d.data.wallet); }
      if (txRes.ok) { const d = await txRes.json(); setTransactions(d.data.transactions); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) return;
    if (!accessToken) return;
    setAdding(true);
    try {
      const res = await authFetch(`${API_URL}/wallet/create-payment`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.paymentUrl) {
        setAddFundsVisible(false);
        setAddAmount('');
        Linking.openURL(data.data.paymentUrl);
      }
    } catch (err) { console.error(err); }
    finally { setAdding(false); }
  };

  const getTypeInfo = (type: string) => {
    const map: Record<string, { icon: string; color: string; bg: string; label: string; positive: boolean }> = {
      wallet_credit: { icon: '↓', color: '#2d666d', bg: '#e9fdff', label: t('credit'), positive: true },
      wallet_debit: { icon: '↑', color: '#ba1a1a', bg: '#ffdad6', label: t('debit'), positive: false },
      fund_credit: { icon: '↓', color: '#2d666d', bg: '#e9fdff', label: t('credit'), positive: true },
      fund_debit: { icon: '↑', color: '#ba1a1a', bg: '#ffdad6', label: t('debit'), positive: false },
      point_earned: { icon: '↓', color: '#2d666d', bg: '#e9fdff', label: t('earned'), positive: true },
      point_spent: { icon: '↑', color: '#ba1a1a', bg: '#ffdad6', label: t('spent'), positive: false },
    };
    return map[type] || map.wallet_credit;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const walletIncome = transactions.filter(t => t.type === 'wallet_credit').reduce((s, t) => s + t.amount, 0);
  const walletExpense = transactions.filter(t => t.type === 'wallet_debit').reduce((s, t) => s + t.amount, 0);
  const fundsIncome = transactions.filter(t => t.type === 'fund_credit').reduce((s, t) => s + t.amount, 0);
  const fundsExpense = transactions.filter(t => t.type === 'fund_debit').reduce((s, t) => s + t.amount, 0);
  const pointsEarned = transactions.filter(t => t.type === 'point_earned').reduce((s, t) => s + t.amount, 0);
  const pointsSpent = transactions.filter(t => t.type === 'point_spent').reduce((s, t) => s + t.amount, 0);

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
      <TopBar showBack title={t('wallet')} showNotification={false} showSearch={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Balance Cards */}
        <View style={styles.cardsSection}>
          {/* Wallet Card */}
          <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.balanceCard}>
            <View style={styles.gridOverlay} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t('wallet')}</Text>
              <View style={styles.cardIcon}><Text style={styles.cardIconText}>👛</Text></View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardBalance}>৳{wallet?.walletBalance?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.cardSubtitle}>{t('commissionReferralEarnings')}</Text>
              <View style={styles.cardStats}>
                <Text style={styles.cardStat}>↓ ৳{walletIncome.toFixed(2)}</Text>
                <Text style={styles.cardStat}>↑ ৳{walletExpense.toFixed(2)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.cardButton} onPress={() => router.push('/wallet-history')}>
              <Text style={styles.cardButtonText}>📋 {t('history')}</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Funds Card */}
          <LinearGradient colors={['#14b8a6', '#06b6d4']} style={styles.balanceCard}>
            <View style={styles.gridOverlay} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t('funds')}</Text>
              <View style={styles.cardIcon}><Text style={styles.cardIconText}>💳</Text></View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardBalance}>৳{wallet?.fundsBalance?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.cardSubtitle}>{t('fundsAccountBalance')}</Text>
              <View style={styles.cardStats}>
                <Text style={styles.cardStat}>↓ ৳{fundsIncome.toFixed(2)}</Text>
                <Text style={styles.cardStat}>↑ ৳{fundsExpense.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.cardButtonRow}>
              <TouchableOpacity style={[styles.cardButton, { flex: 1 }]} onPress={() => router.push('/funds-history')}>
                <Text style={styles.cardButtonText}>📋 {t('history')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cardButton, { flex: 1 }]} onPress={() => setAddFundsVisible(true)}>
                <Text style={styles.cardButtonText}>➕ {t('addFunds')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Points Card */}
          <LinearGradient colors={['#f97316', '#f43f5e']} style={styles.balanceCard}>
            <View style={styles.gridOverlay} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t('points')}</Text>
              <View style={styles.cardIcon}><Text style={styles.cardIconText}>⭐</Text></View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardBalance}>৳{wallet?.pointsBalance?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.cardSubtitle}>{t('rewardPointsBalance')}</Text>
              <View style={styles.cardStats}>
                <Text style={styles.cardStat}>↓ ৳{pointsEarned.toFixed(2)}</Text>
                <Text style={styles.cardStat}>↑ ৳{pointsSpent.toFixed(2)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.cardButton} onPress={() => router.push('/points-history')}>
              <Text style={styles.cardButtonText}>📋 {t('history')}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Withdraw Section */}
        <GlassPanel borderRadius={20} style={styles.withdrawSection}>
          <Text style={styles.sectionTitle}>{t('withdraw')}</Text>
          <Text style={styles.sectionSubtitle}>{t('transferToBank')}</Text>
          <View style={styles.withdrawInput}>
            <Text style={styles.currencySymbol}>৳</Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor="rgba(69,71,75,0.4)"
              style={styles.withdrawInputText}
              editable={false}
            />
          </View>
          <View style={styles.withdrawPresets}>
            {[100, 500, 1000].map(amt => (
              <TouchableOpacity key={amt} style={styles.withdrawPreset} disabled>
                <Text style={styles.withdrawPresetText}>৳{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.withdrawButtonDisabled} disabled>
            <Text style={styles.withdrawButtonTextDisabled}>{t('withdrawComingSoon')}</Text>
          </TouchableOpacity>
        </GlassPanel>

        {/* Transactions */}
        <GlassPanel borderRadius={20} style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>{t('transactions')}</Text>
          <Text style={styles.sectionSubtitle}>{t('viewTransactionHistory')}</Text>

          {/* Filter Tabs */}
          <View style={styles.filterTabs}>
            {[
              { key: 'all', label: t('all') },
              { key: 'wallet', label: t('wallet') },
              { key: 'funds', label: t('funds') },
              { key: 'points', label: t('points') },
            ].map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
              >
                <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Transaction List */}
          <View style={styles.txList}>
            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>{t('noTransactionsFound')}</Text>
            ) : (
              transactions.map(tx => {
                const info = getTypeInfo(tx.type);
                return (
                  <View key={tx.id} style={styles.txItem}>
                    <View style={[styles.txIcon, { backgroundColor: info.bg }]}>
                      <Text style={[styles.txIconText, { color: info.color }]}>{info.icon}</Text>
                    </View>
                    <View style={styles.txContent}>
                      <View style={styles.txHeader}>
                        <Text style={styles.txDescription} numberOfLines={1}>{tx.description}</Text>
                        <View style={[styles.txBadge, { backgroundColor: info.bg }]}>
                          <Text style={[styles.txBadgeText, { color: info.color }]}>{info.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: info.color }]}>
                      {info.positive ? '+' : '-'}৳{tx.amount.toFixed(2)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </GlassPanel>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Funds Modal */}
      <Modal visible={addFundsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('addFunds')}</Text>
              <TouchableOpacity onPress={() => setAddFundsVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalInputWrap}>
              <Text style={styles.modalCurrency}>৳</Text>
              <TextInput
                value={addAmount}
                onChangeText={setAddAmount}
                placeholder="0.00"
                placeholderTextColor="rgba(69,71,75,0.4)"
                keyboardType="numeric"
                style={styles.modalInput}
              />
            </View>
            <View style={styles.modalPresets}>
              {[100, 500, 1000].map(amt => (
                <TouchableOpacity key={amt} onPress={() => setAddAmount(String(amt))} style={styles.modalPreset}>
                  <Text style={styles.modalPresetText}>৳{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={handleAddFunds}
              disabled={!addAmount || parseFloat(addAmount) <= 0 || adding}
              style={[styles.modalAddButton, (!addAmount || adding) && styles.modalAddButtonDisabled]}
            >
              <Text style={styles.modalAddButtonText}>{adding ? t('processing') : t('addFunds')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 20, paddingBottom: 40 },
  cardsSection: { gap: 16, marginBottom: 24 },
  balanceCard: { borderRadius: 24, padding: 24, minHeight: 220, justifyContent: 'space-between', overflow: 'hidden' },
  gridOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  cardIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  cardIconText: { fontSize: 18 },
  cardBody: { marginTop: 12 },
  cardBalance: { fontSize: 36, fontWeight: '800', color: '#ffffff' },
  cardSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  cardStats: { flexDirection: 'row', gap: 16, marginTop: 8 },
  cardStat: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  cardButton: { marginTop: 16, paddingVertical: 12, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  cardButtonRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cardButtonText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
  withdrawSection: { marginBottom: 16, padding: 24 },
  transactionsSection: { padding: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1c1b1b', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#45474b', marginBottom: 16 },
  withdrawInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 12 },
  currencySymbol: { fontSize: 18, fontWeight: '700', color: '#5d5e64', marginRight: 8 },
  withdrawInputText: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1c1b1b' },
  withdrawPresets: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  withdrawPreset: { flex: 1, paddingVertical: 10, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  withdrawPresetText: { fontSize: 13, fontWeight: '600', color: '#45474b' },
  withdrawButtonDisabled: { paddingVertical: 14, borderRadius: 9999, backgroundColor: 'rgba(28,27,27,0.1)', alignItems: 'center' },
  withdrawButtonTextDisabled: { fontSize: 14, fontWeight: '600', color: 'rgba(69,71,75,0.5)' },
  filterTabs: { flexDirection: 'row', backgroundColor: 'rgba(234,231,231,0.8)', borderRadius: 9999, padding: 4, marginBottom: 16 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9999 },
  filterTabActive: { backgroundColor: '#a855f7', shadowColor: '#a855f7', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#45474b' },
  filterTabTextActive: { color: '#ffffff' },
  txList: { gap: 10 },
  emptyText: { textAlign: 'center', color: '#45474b', paddingVertical: 20 },
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 16, padding: 12, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txIconText: { fontSize: 16, fontWeight: '700' },
  txContent: { flex: 1, minWidth: 0 },
  txHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  txDescription: { fontSize: 13, fontWeight: '600', color: '#1c1b1b', flex: 1 },
  txBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  txBadgeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  txDate: { fontSize: 11, color: '#45474b' },
  txAmount: { fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: 16 },
  modalContent: { backgroundColor: '#f8f8ff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1c1b1b' },
  modalClose: { fontSize: 18, color: '#45474b' },
  modalInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', marginBottom: 16 },
  modalCurrency: { fontSize: 20, fontWeight: '700', color: '#5d5e64', marginRight: 8 },
  modalInput: { flex: 1, fontSize: 24, fontWeight: '700', color: '#1c1b1b' },
  modalPresets: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modalPreset: { flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  modalPresetText: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  modalAddButton: { paddingVertical: 16, borderRadius: 9999, backgroundColor: '#14b8a6', alignItems: 'center' },
  modalAddButtonDisabled: { opacity: 0.5 },
  modalAddButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});
