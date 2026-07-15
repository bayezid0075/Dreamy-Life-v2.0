import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/shared/stores/authStore';
import { authFetch } from '@/shared/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';
import RechargeResultModal from '@/shared/components/RechargeResultModal';
import { useI18n } from '@/shared/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const OPERATORS = [
  { id: 'gp', name: 'GP', short: 'GP', color: '#00a651', bgColor: '#e6f9ee' },
  { id: 'bl', name: 'BL', short: 'BL', color: '#e4002b', bgColor: '#fde6ec' },
  { id: 'rb', name: 'RB', short: 'RB', color: '#003580', bgColor: '#e6ecf5' },
  { id: 'al', name: 'AL', short: 'AL', color: '#ed1c24', bgColor: '#fde6e7' },
  { id: 'tt', name: 'TT', short: 'TT', color: '#f7941d', bgColor: '#fef3e2' },
  { id: 'st', name: 'ST', short: 'ST', color: '#6db33f', bgColor: '#eef5e8' },
];

const QUICK_AMOUNTS = [20, 50, 100, 500, 1000, 1500, 2000, 2500];

export default function RechargeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ operator?: string; amount?: string; source?: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, accessToken, logout } = useAuthStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('recharge');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [fundsBalance, setFundsBalance] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalPhoneNumber, setModalPhoneNumber] = useState('');
  const [modalOperator, setModalOperator] = useState('');
  const [modalAmount, setModalAmount] = useState(0);
  const [modalRemainingBalance, setModalRemainingBalance] = useState(0);

  useEffect(() => {
    if (params.operator) {
      const normalized = params.operator.toLowerCase();
      if (OPERATORS.some(op => op.id === normalized)) {
        setSelectedOperator(normalized);
      }
    }
    if (params.amount) {
      setAmount(params.amount);
    }
    if (params.source) {
      setSource(params.source);
    }
    setPageLoading(false);
  }, [params.operator, params.amount, params.source]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    fetchFundsBalance();
  }, [isAuthenticated]);

  const fetchFundsBalance = async () => {
    try {
      const res = await authFetch(`${API_URL}/wallet`);
      if (res.ok) {
        const data = await res.json();
        setFundsBalance(data.data?.wallet?.fundsBalance ?? 0);
      }
    } catch {}
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 11);
    setPhoneNumber(cleaned);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const validate = (): boolean => {
    if (phoneNumber.length !== 11) {
      Alert.alert('Invalid Number', t('pleaseEnterValidPhoneNumber'));
      return false;
    }
    if (!selectedOperator) {
      Alert.alert('Select Operator', t('pleaseSelectOperator'));
      return false;
    }
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', t('pleaseEnterValidAmount'));
      return false;
    }
    return true;
  };

  const handleRecharge = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/recharge/create`, {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          operator: selectedOperator,
          connectionType,
          amount: parseFloat(amount),
          source,
        }),
      });
      if (res.status === 401) { await logout(); router.replace('/login'); return; }
      const data = await res.json();
      const amountNum = parseFloat(amount);

      if (res.ok) {
        const orderStatus = data.data?.status;
        const remaining = data.data?.remainingBalance ?? (orderStatus === 'success' ? fundsBalance - amountNum : fundsBalance);

        setFundsBalance(remaining);
        setModalPhoneNumber(phoneNumber);
        setModalOperator(selectedOperator || '');
        setModalAmount(amountNum);
        setModalRemainingBalance(remaining);
        setModalSuccess(orderStatus === 'success');
        setModalVisible(true);
        setPhoneNumber('');
        setSelectedOperator(null);
        setAmount('');
      } else {
        setModalPhoneNumber(phoneNumber);
        setModalOperator(selectedOperator || '');
        setModalAmount(amountNum);
        setModalRemainingBalance(fundsBalance);
        setModalSuccess(false);
        setModalVisible(true);
      }
    } catch (err) {
      Alert.alert(t('error'), t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleViewHistory = () => {
    setModalVisible(false);
    router.push('/recharge/history');
  };

  if (pageLoading) {
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
      <TopBar showBack title={t('mobileRecharge')} showNotification={false} showSearch={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 56 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Phone Number Input */}
          <GlassPanel borderRadius={16} style={styles.section}>
            <Text style={styles.sectionLabel}>{t('phoneNumber')}</Text>
            <View style={styles.phoneInputWrap}>
              <Text style={styles.bdtSymbol}>+880</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="01XXX XXXXXX"
                placeholderTextColor="rgba(69,71,75,0.4)"
                keyboardType="number-pad"
                maxLength={11}
                value={phoneNumber}
                onChangeText={formatPhoneNumber}
              />
            </View>
            <Text style={styles.digitCount}>{phoneNumber.length}/11 digits</Text>
          </GlassPanel>

          {/* Operator Selection */}
          <GlassPanel borderRadius={16} style={styles.section}>
            <Text style={styles.sectionLabel}>{t('selectOperator')}</Text>
            <View style={styles.operatorGrid}>
              {OPERATORS.map(op => {
                const isSelected = selectedOperator === op.id;
                return (
                  <TouchableOpacity
                    key={op.id}
                    onPress={() => setSelectedOperator(op.id)}
                    style={[
                      styles.operatorItem,
                      isSelected && styles.operatorItemActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.operatorIcon,
                        { backgroundColor: op.bgColor },
                        isSelected && { backgroundColor: op.color },
                      ]}
                    >
                      <Text
                        style={[
                          styles.operatorIconText,
                          { color: op.color },
                          isSelected && { color: '#ffffff' },
                        ]}
                      >
                        {op.short}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.operatorName,
                        isSelected && styles.operatorNameActive,
                      ]}
                    >
                      {op.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassPanel>

          {/* Connection Type */}
          <GlassPanel borderRadius={16} style={styles.section}>
            <Text style={styles.sectionLabel}>{t('connectionType')}</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setConnectionType('prepaid')}
                style={[
                  styles.toggleBtn,
                  connectionType === 'prepaid' && styles.toggleBtnActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleText,
                    connectionType === 'prepaid' && styles.toggleTextActive,
                  ]}
                >
                  {t('prepaid')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setConnectionType('postpaid')}
                style={[
                  styles.toggleBtn,
                  connectionType === 'postpaid' && styles.toggleBtnActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.toggleText,
                    connectionType === 'postpaid' && styles.toggleTextActive,
                  ]}
                >
                  {t('postpaid')}
                </Text>
              </TouchableOpacity>
            </View>
          </GlassPanel>

          {/* Amount Input */}
          <GlassPanel borderRadius={16} style={styles.section}>
            <Text style={styles.sectionLabel}>{t('amountBdt')}</Text>
            <View style={styles.amountInputWrap}>
              <Text style={styles.bdtSymbolLarge}>৳</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="rgba(69,71,75,0.4)"
                keyboardType="number-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <Text style={styles.quickLabel}>{t('quickSelect')}</Text>
            <View style={styles.quickGrid}>
              {QUICK_AMOUNTS.map(val => {
                const isActive = amount === val.toString();
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => handleQuickAmount(val)}
                    style={[
                      styles.quickBtn,
                      isActive && styles.quickBtnActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickBtnText,
                        isActive && styles.quickBtnTextActive,
                      ]}
                    >
                      ৳{val.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassPanel>

          {/* Funds Balance */}
          <View style={styles.balanceBar}>
            <Text style={styles.balanceLabel}>{t('availableFunds')}</Text>
            <Text style={styles.balanceValue}>৳{fundsBalance.toFixed(2)}</Text>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            onPress={handleRecharge}
            disabled={loading}
            style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.confirmBtnText}>{t('confirmRecharge')}</Text>
            )}
          </TouchableOpacity>

          {/* History Link */}
          <TouchableOpacity
            onPress={() => router.push('/recharge/history')}
            style={styles.historyLink}
            activeOpacity={0.7}
          >
            <Text style={styles.historyLinkText}>{t('viewRechargeHistory')} →</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <RechargeResultModal
        visible={modalVisible}
        success={modalSuccess}
        phoneNumber={modalPhoneNumber}
        operator={modalOperator}
        amount={modalAmount}
        remainingBalance={modalRemainingBalance}
        onClose={handleCloseModal}
        onViewHistory={handleViewHistory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#45474b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  // Phone Input
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(118,119,123,0.15)',
    paddingHorizontal: 16,
    height: 56,
  },
  bdtSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#45474b',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#1c1b1b',
    letterSpacing: 1,
  },
  digitCount: {
    fontSize: 11,
    color: 'rgba(69,71,75,0.5)',
    textAlign: 'right',
    marginTop: 6,
    paddingRight: 8,
  },

  // Operator Grid
  operatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  operatorItem: {
    width: '15%',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  operatorItemActive: {},
  operatorIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  operatorIconText: {
    fontSize: 14,
    fontWeight: '800',
  },
  operatorName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#45474b',
    textAlign: 'center',
  },
  operatorNameActive: {
    color: '#ff5c26',
  },

  // Connection Type Toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 9999,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 9999,
  },
  toggleBtnActive: {
    backgroundColor: '#ff5c26',
    shadowColor: '#ff5c26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#45474b',
  },
  toggleTextActive: {
    color: '#ffffff',
  },

  // Amount
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(118,119,123,0.15)',
    paddingHorizontal: 20,
    height: 64,
  },
  bdtSymbolLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ff5c26',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1b1b',
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(69,71,75,0.6)',
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,38,0.15)',
  },
  quickBtnActive: {
    backgroundColor: '#ff5c26',
    borderColor: '#ff5c26',
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff5c26',
  },
  quickBtnTextActive: {
    color: '#ffffff',
  },

  // Confirm Button
  confirmBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ff5c26',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#ff5c26',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  // History Link
  historyLink: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  historyLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff5c26',
  },

  // Balance Bar
  balanceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(13,148,136,0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(13,148,136,0.15)',
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0d9488',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0d9488',
  },
});
