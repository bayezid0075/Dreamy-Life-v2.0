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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function MembershipScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [myMembership, setMyMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) { router.replace('/login'); return; }
    try {
      const [plansRes, myRes] = await Promise.all([
        fetch(`${API_URL}/membership/plans`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/membership/my`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (plansRes.status === 401 || myRes.status === 401) { await AsyncStorage.removeItem('accessToken'); router.replace('/login'); return; }
      if (plansRes.ok) { const d = await plansRes.json(); setPlans(d.data || []); }
      if (myRes.ok) { const d = await myRes.json(); setMyMembership(d.data); }
    } catch (err) { console.error('Failed to load', err); }
    finally { setLoading(false); }
  };

  const purchasePlan = async (planId: string) => {
    setPurchasing(planId);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/membership/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data.error?.message || 'Purchase failed'); return; }
      Alert.alert('Success', 'Plan purchased successfully!');
      loadData();
    } catch (err) { Alert.alert('Error', 'Connection failed'); }
    finally { setPurchasing(null); }
  };

  const getPlanColor = (name: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-gray-100', standard: 'bg-blue-50', smart: 'bg-purple-50', vvip: 'bg-yellow-50',
    };
    const map: Record<string, string> = {
      basic: '#f5f5f5', standard: '#eff6ff', smart: '#f5f3ff', vvip: '#fefce8',
    };
    return map[name] || '#f8f8ff';
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
      <TopBar title="Membership" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {myMembership?.currentPlan && (
          <GlassPanel borderRadius={16} style={styles.currentPlanCard}>
            <View style={styles.currentPlanRow}>
              <View>
                <Text style={styles.currentPlanLabel}>Current Plan</Text>
                <Text style={styles.currentPlanName}>{myMembership.currentPlan.name}</Text>
              </View>
              <View style={styles.currentPlanRight}>
                <Text style={styles.commissionLabel}>Commission Earned</Text>
                <Text style={styles.commissionValue}>${myMembership.commissionEarned?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>
          </GlassPanel>
        )}

        <View style={styles.plansGrid}>
          {plans.filter((p: any) => p.name !== 'user').map((plan: any) => {
            const isCurrentPlan = myMembership?.currentPlan?.name === plan.name;
            const isLocked = myMembership?.currentPlan?.level >= plan.level;
            return (
              <GlassPanel
                key={plan.id}
                borderRadius={20}
                style={[styles.planCard, isCurrentPlan && { borderWidth: 2, borderColor: '#5d5e64' }]}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {isCurrentPlan && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.planPrice}>${plan.price}</Text>
                <Text style={styles.planDesc}>{plan.description}</Text>
                {isCurrentPlan ? (
                  <View style={styles.activeBtn}>
                    <Text style={styles.activeBtnText}>Active</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.upgradeBtn, (isLocked || purchasing === plan.id) && { opacity: 0.4 }]}
                    onPress={() => purchasePlan(plan.id)}
                    disabled={isLocked || purchasing === plan.id}
                  >
                    <Text style={styles.upgradeBtnText}>
                      {purchasing === plan.id ? 'Processing...' : isLocked ? 'Already Upgraded' : 'Upgrade'}
                    </Text>
                  </TouchableOpacity>
                )}
              </GlassPanel>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 24, paddingBottom: 40 },
  currentPlanCard: { marginBottom: 24, padding: 20 },
  currentPlanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  currentPlanLabel: { fontSize: 12, fontWeight: '600', color: '#45474b', textTransform: 'uppercase', letterSpacing: 1 },
  currentPlanName: { fontSize: 24, fontWeight: '700', color: '#1c1b1b', marginTop: 4, textTransform: 'capitalize' },
  currentPlanRight: { alignItems: 'flex-end' },
  commissionLabel: { fontSize: 13, color: '#45474b' },
  commissionValue: { fontSize: 20, fontWeight: '700', color: '#2d666d' },
  plansGrid: { gap: 16 },
  planCard: { padding: 24 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planName: { fontSize: 18, fontWeight: '700', color: '#1c1b1b', textTransform: 'capitalize' },
  currentBadge: { backgroundColor: '#5d5e64', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  currentBadgeText: { color: 'white', fontSize: 10, fontWeight: '600' },
  planPrice: { fontSize: 32, fontWeight: '700', color: '#1c1b1b', marginBottom: 8 },
  planDesc: { fontSize: 14, color: '#45474b', marginBottom: 20, flex: 1 },
  activeBtn: { paddingVertical: 12, borderRadius: 9999, backgroundColor: '#f8f8ff', alignItems: 'center' },
  activeBtnText: { fontSize: 14, fontWeight: '600', color: '#5d5e64' },
  upgradeBtn: { paddingVertical: 12, borderRadius: 9999, backgroundColor: '#1c1b1b', alignItems: 'center' },
  upgradeBtnText: { fontSize: 14, fontWeight: '600', color: 'white' },
});
