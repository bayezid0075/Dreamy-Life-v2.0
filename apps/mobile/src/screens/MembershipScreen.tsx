import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { useAuthStore } from '@/shared/stores/authStore';
import { authFetch } from '@/shared/api';
import { useRouter, useFocusEffect } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';
import { useI18n } from '../shared/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const PLAN_COLORS: Record<string, string> = {
  basic: '#f5f5f5',
  standard: '#e9fdff',
  smart: '#ffd1dc',
  vvip: '#fffde7',
};

const BUTTON_COLORS: Record<string, string> = {
  primary: '#5d5e64',
  tertiary: '#2d666d',
  secondary: '#78555e',
};

const PLAN_NAME_MAP: Record<string, string> = {
  user: 'planUser', basic: 'planBasic', standard: 'planStandard', smart: 'planSmart', vvip: 'planVvip',
};
const PLAN_DESC_MAP: Record<string, string> = {
  user: 'planDescUser', basic: 'planDescBasic', standard: 'planDescStandard', smart: 'planDescSmart', vvip: 'planDescVvip',
};
const FEATURE_MAP: Record<string, string> = {
  'Basic Access': 'featureBasicAccess',
  'Community Feed': 'featureCommunityFeed',
  '1x Reward Points': 'feature1xRewardPoints',
  'Standard Support': 'featureStandardSupport',
  'Member Newsletter': 'featureMemberNewsletter',
  'Priority Support': 'featurePrioritySupport',
  'Early Access to Sales': 'featureEarlyAccessToSales',
  '2x Reward Points': 'feature2xRewardPoints',
  'Exclusive Content': 'featureExclusiveContent',
  '24/7 VIP Support': 'feature24x7VipSupport',
  'Invite-Only Events': 'featureInviteOnlyEvents',
  '3x Reward Points': 'feature3xRewardPoints',
  'Free Shipping': 'featureFreeShipping',
  '24/7 VIP Concierge': 'feature24x7VipConcierge',
  '4x Reward Points': 'feature4xRewardPoints',
  'Complimentary Shipping': 'featureComplimentaryShipping',
  'Personal Account Manager': 'featurePersonalAccountManager',
};
const BUTTON_TEXT_MAP: Record<string, string> = {
  'Current Plan': 'btnCurrentPlan',
  'Choose Basic': 'btnChooseBasic',
  'Choose Standard': 'btnChooseStandard',
  'Choose Smart': 'btnChooseSmart',
  'Choose VVIP': 'btnChooseVvip',
  'Choose Plan': 'choosePlan',
};

export default function MembershipScreen() {
  const router = useRouter();
  const { isAuthenticated, accessToken, logout } = useAuthStore();
  const { t } = useI18n();
  const [plans, setPlans] = useState<any[]>([]);
  const [myMembership, setMyMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated]);

  useEffect(() => { if (isAuthenticated) loadData(); }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (!loading && isAuthenticated) loadData();
    }, [isAuthenticated])
  );

  const loadData = async () => {
    if (!accessToken) { router.replace('/login'); return; }
    try {
      const [plansRes, myRes] = await Promise.all([
        authFetch(`${API_URL}/membership/plans`),
        authFetch(`${API_URL}/membership/my`),
      ]);
      if (plansRes.status === 401 || myRes.status === 401) { await logout(); router.replace('/login'); return; }
      if (plansRes.ok) { const d = await plansRes.json(); setPlans(d.data || []); }
      if (myRes.ok) { const d = await myRes.json(); setMyMembership(d.data); }
    } catch (err) { console.error('Failed to load', err); }
    finally { setLoading(false); }
  };

  const purchasePlan = async (planId: string) => {
    setPurchasing(planId);
    try {
      const res = await authFetch(`${API_URL}/membership/purchase`, {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert(t('error'), data.error?.message || data.message || t('paymentCreationFailed')); return; }
      if (data.success && data.data?.paymentUrl) {
        Linking.openURL(data.data.paymentUrl);
      }
    } catch (err) { Alert.alert(t('error'), t('connectionFailed')); }
    finally { setPurchasing(null); }
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
      <TopBar title={t('membership')} showBack showSearch={false} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {myMembership?.currentPlan && (
          <GlassPanel borderRadius={16} style={styles.currentPlanCard}>
            <View style={styles.currentPlanRow}>
              <View>
                <Text style={styles.currentPlanLabel}>{t('currentPlan').toUpperCase()}</Text>
                <Text style={styles.currentPlanName}>{t(PLAN_NAME_MAP[myMembership.currentPlan.name] as any || 'planUser')}</Text>
              </View>
              <View style={styles.currentPlanRight}>
                <Text style={styles.commissionLabel}>{t('commissionEarned')}</Text>
                <Text style={styles.commissionValue}>${myMembership.commissionEarned?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>
          </GlassPanel>
        )}

        <View style={styles.plansGrid}>
          {plans.filter((p: any) => p.name !== 'user').map((plan: any) => {
            const isCurrentPlan = myMembership?.currentPlan?.name === plan.name;
            const isLocked = myMembership?.currentPlan?.level >= plan.level;
            const planBg = PLAN_COLORS[plan.name?.toLowerCase()] || '#f8f8ff';

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  { backgroundColor: planBg },
                  isCurrentPlan && styles.planCardCurrent,
                ]}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{t(PLAN_NAME_MAP[plan.name] as any || 'planUser')}</Text>
                  {isCurrentPlan && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>{t('current')}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.planPrice}>${plan.price}</Text>
                <Text style={styles.planDesc}>{t(PLAN_DESC_MAP[plan.name] as any || 'planDescUser')}</Text>
                {isCurrentPlan ? (
                  <View style={styles.activeBtn}>
                    <Text style={styles.activeBtnText}>{t('active')}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.upgradeBtn, { backgroundColor: BUTTON_COLORS[plan.colorTheme] || '#1c1b1b' }, (isLocked || purchasing === plan.id) && { opacity: 0.4 }]}
                    onPress={() => purchasePlan(plan.id)}
                    disabled={isLocked || purchasing === plan.id}
                  >
                    <Text style={styles.upgradeBtnText}>
                      {purchasing === plan.id ? t('processing') : isLocked ? t('alreadyUpgraded') : t(BUTTON_TEXT_MAP[plan.buttonText] as any || 'choosePlan')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Commission History */}
        {myMembership?.commissionHistory?.length > 0 && (
          <GlassPanel borderRadius={16} style={styles.commissionSection}>
            <Text style={styles.sectionTitle}>{t('commissionHistory')}</Text>
            <View style={styles.commissionList}>
              {myMembership.commissionHistory.map((c: any) => (
                <View key={c.id} style={styles.commissionItem}>
                  <View style={styles.commissionLeft}>
                    <View style={styles.commissionIcon}><Text style={{ fontSize: 12 }}>💳</Text></View>
                    <View>
                      <Text style={styles.commissionName}>{t('levelCommission', { level: String(c.level) })}</Text>
                      <Text style={styles.commissionMeta}>{c.percentage}% · {new Date(c.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <Text style={styles.commissionAmount}>+${c.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </GlassPanel>
        )}
      </ScrollView>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassPanel borderRadius={20} style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <Text style={styles.modalIcon}>🎉</Text>
            </View>
            <Text style={styles.modalTitle}>{t('purchaseSuccessful')}</Text>
            <Text style={styles.modalMessage}>
              {t('accountVerifiedSuccess')}
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => { setShowSuccess(false); router.back(); }}
            >
              <Text style={styles.modalBtnText}>{t('continueToDashboard')}</Text>
            </TouchableOpacity>
          </GlassPanel>
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
  currentPlanCard: { marginBottom: 24, padding: 20 },
  currentPlanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  currentPlanLabel: { fontSize: 12, fontWeight: '600', color: '#45474b', textTransform: 'uppercase', letterSpacing: 1 },
  currentPlanName: { fontSize: 24, fontWeight: '700', color: '#1c1b1b', marginTop: 4, textTransform: 'capitalize' },
  currentPlanRight: { alignItems: 'flex-end' },
  commissionLabel: { fontSize: 13, color: '#45474b' },
  commissionValue: { fontSize: 20, fontWeight: '700', color: '#2d666d' },
  plansGrid: { gap: 16 },
  planCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 3,
  },
  planCardCurrent: {
    borderWidth: 2,
    borderColor: '#5d5e64',
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planName: { fontSize: 18, fontWeight: '700', color: '#1c1b1b', textTransform: 'capitalize' },
  currentBadge: { backgroundColor: '#5d5e64', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  currentBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  planPrice: { fontSize: 32, fontWeight: '700', color: '#1c1b1b', marginBottom: 8 },
  planDesc: { fontSize: 14, color: '#45474b', marginBottom: 20 },
  activeBtn: { paddingVertical: 12, borderRadius: 9999, backgroundColor: '#f8f8ff', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  activeBtnText: { fontSize: 14, fontWeight: '600', color: '#5d5e64' },
  upgradeBtn: { paddingVertical: 12, borderRadius: 9999, backgroundColor: '#1c1b1b', alignItems: 'center' },
  upgradeBtnText: { fontSize: 14, fontWeight: '600', color: 'white' },
  commissionSection: { marginTop: 24, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1c1b1b', marginBottom: 16 },
  commissionList: { gap: 8 },
  commissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  commissionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  commissionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9fdff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commissionName: { fontSize: 13, fontWeight: '600', color: '#1c1b1b' },
  commissionMeta: { fontSize: 11, color: '#45474b', marginTop: 2 },
  commissionAmount: { fontSize: 14, fontWeight: '700', color: '#2d666d' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    padding: 32,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(45, 102, 109, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalIcon: { fontSize: 36 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1c1b1b', marginBottom: 8, textAlign: 'center' },
  modalMessage: { fontSize: 14, color: '#45474b', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  modalBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 9999,
    backgroundColor: '#1c1b1b',
    alignItems: 'center',
  },
  modalBtnText: { fontSize: 15, fontWeight: '600', color: 'white' },
});
