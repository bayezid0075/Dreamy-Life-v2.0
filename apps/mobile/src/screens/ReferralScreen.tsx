import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function ReferralScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [downline, setDownline] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) { router.replace('/login'); return; }
    try {
      const [profileRes, statsRes, downlineRes] = await Promise.all([
        fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/referral/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/referral/downline`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (profileRes.ok) { const d = await profileRes.json(); setUser(d.data.user); }
      if (statsRes.ok) { const d = await statsRes.json(); setStats(d.data); }
      if (downlineRes.ok) { const d = await downlineRes.json(); setDownline(d.data.members || []); }
    } catch (err) { console.error('Failed to load', err); }
    finally { setLoading(false); }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      super_admin: '#7c3aed', vvip: '#d97706', smart: '#2563eb',
      standard: '#059669', basic: '#6b7280', user: '#5d5e64',
    };
    return colors[status] || '#6b7280';
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
      <TopBar title="Referral" showBack />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Referral Code Card */}
        <GlassPanel borderRadius={16} style={styles.referCard}>
          <Text style={styles.referLabel}>Your Referral Code</Text>
          <Text style={styles.referCode}>{user?.ownRefercode || 'N/A'}</Text>
          <Text style={styles.referHint}>Share this code with friends to earn commissions!</Text>
        </GlassPanel>

        {/* Stats */}
        {stats && (
          <GlassPanel borderRadius={16} style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#5d5e64' }]}>{stats.totalReferrals}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#2d666d' }]}>{stats.level1Count}</Text>
                <Text style={styles.statLabel}>Level 1</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#78555e' }]}>{stats.level2Count}</Text>
                <Text style={styles.statLabel}>Level 2</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#5d5e64' }]}>{stats.level3Count}</Text>
                <Text style={styles.statLabel}>Level 3</Text>
              </View>
            </View>
          </GlassPanel>
        )}

        {/* Downline Members */}
        <Text style={styles.sectionTitle}>Downline Members</Text>
        {downline.length > 0 ? (
          <View style={styles.memberList}>
            {downline.map((member: any) => (
              <GlassPanel key={member.userId} borderRadius={14} style={styles.memberCard}>
                <View style={styles.memberInner}>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>{member.username?.charAt(0)?.toUpperCase() || '?'}</Text>
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>{member.username}</Text>
                      <Text style={styles.memberPhone}>{member.phoneNumber}</Text>
                    </View>
                  </View>
                  <View style={styles.memberBadges}>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>L{member.level}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(member.memberStatus) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(member.memberStatus) }]}>{member.memberStatus}</Text>
                    </View>
                  </View>
                </View>
              </GlassPanel>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No referrals yet</Text>
            <Text style={styles.emptyHint}>Share your code to start building your team</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 24, paddingBottom: 40 },
  referCard: { marginBottom: 24, alignItems: 'center', padding: 24 },
  referLabel: { fontSize: 12, fontWeight: '600', color: '#45474b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  referCode: { fontSize: 28, fontWeight: '800', color: '#5d5e64', letterSpacing: 4, marginBottom: 12 },
  referHint: { fontSize: 13, color: '#45474b', textAlign: 'center' },
  statsCard: { marginBottom: 24, padding: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#45474b', marginTop: 4, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1c1b1b', marginBottom: 12 },
  memberList: { gap: 10 },
  memberCard: { padding: 0 },
  memberInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  memberInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8f8ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  memberAvatarText: { fontSize: 18, fontWeight: '700', color: '#5d5e64' },
  memberDetails: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#1c1b1b' },
  memberPhone: { fontSize: 12, color: '#45474b', marginTop: 2 },
  memberBadges: { flexDirection: 'row', gap: 6 },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f8f8ff' },
  levelText: { fontSize: 11, fontWeight: '700', color: '#5d5e64' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#45474b', marginBottom: 4 },
  emptyHint: { fontSize: 14, color: '#45474b', textAlign: 'center' },
});
