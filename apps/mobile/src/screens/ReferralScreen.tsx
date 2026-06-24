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

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4080';

export default function ReferralScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [downline, setDownline] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({});

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

  const toggleLevel = (level: number) => {
    setExpandedLevels(prev => ({ ...prev, [level]: !(prev[level] ?? true) }));
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
      <TopBar title="Referral" showBack showSearch={false} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Referral Link Card */}
        <GlassPanel borderRadius={16} style={styles.referCard}>
          <Text style={styles.referLabel}>YOUR REFERRAL LINK</Text>
          <View style={styles.referLinkRow}>
            <Text style={styles.referLinkIcon}>🔗</Text>
            <Text style={styles.referLinkText} numberOfLines={1}>
              {user ? `/register?ref=${user.ownRefercode}` : 'N/A'}
            </Text>
            <View style={styles.copyBtn}>
              <Text style={styles.copyBtnText}>Copy</Text>
            </View>
          </View>
        </GlassPanel>

        {/* Stats Grid */}
        {stats && (
          <View style={styles.statsGrid}>
            {[
              { label: 'Total', value: stats.totalReferrals, color: '#5d5e64' },
              { label: 'Level 1', value: stats.level1Count, color: '#2d666d' },
              { label: 'Level 2', value: stats.level2Count, color: '#78555e' },
              { label: 'Level 3', value: stats.level3Count, color: '#5d5e64' },
            ].map((stat) => (
              <GlassPanel key={stat.label} borderRadius={12} style={styles.statCard}>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </GlassPanel>
            ))}
          </View>
        )}

        {/* Downline Tree */}
        <GlassPanel borderRadius={16} style={styles.treeSection}>
          <Text style={styles.sectionTitle}>Downline Tree</Text>
          {downline.length > 0 ? (
            <View style={styles.treeList}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                const levelMembers = downline.filter((m: any) => m.level === level);
                if (levelMembers.length === 0) return null;
                const isExpanded = expandedLevels[level] !== false;

                return (
                  <View key={level} style={styles.levelGroup}>
                    <TouchableOpacity
                      onPress={() => toggleLevel(level)}
                      style={styles.levelHeader}
                    >
                      <View style={styles.levelLeft}>
                        <View style={styles.levelBadge}>
                          <Text style={styles.levelBadgeText}>{level}</Text>
                        </View>
                        <Text style={styles.levelTitle}>Level {level}</Text>
                        <Text style={styles.levelCount}>({levelMembers.length})</Text>
                      </View>
                      <Text style={styles.levelArrow}>{isExpanded ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.memberList}>
                        {levelMembers.map((member: any) => (
                          <View key={member.userId} style={styles.memberItem}>
                            <View style={styles.memberLeft}>
                              <View style={styles.memberAvatar}>
                                <Text style={styles.memberAvatarText}>
                                  {member.username?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                              </View>
                              <View>
                                <Text style={styles.memberName}>{member.username}</Text>
                                <Text style={styles.memberPhone}>{member.phoneNumber}</Text>
                              </View>
                            </View>
                            <View style={[styles.memberStatus, { backgroundColor: getStatusColor(member.memberStatus) + '20' }]}>
                              <Text style={[styles.memberStatusText, { color: getStatusColor(member.memberStatus) }]}>
                                {member.memberStatus}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No referrals yet</Text>
              <Text style={styles.emptyHint}>Share your code to start building your team</Text>
            </View>
          )}
        </GlassPanel>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 20, paddingBottom: 40 },
  referCard: { marginBottom: 24, padding: 20 },
  referLabel: { fontSize: 11, fontWeight: '700', color: '#45474b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  referLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    gap: 8,
  },
  referLinkIcon: { fontSize: 16 },
  referLinkText: { flex: 1, fontSize: 13, color: '#45474b' },
  copyBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#5d5e64', borderRadius: 20 },
  copyBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  statCard: { width: '48%', padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#45474b', marginTop: 4 },
  treeSection: { padding: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1c1b1b', marginBottom: 16 },
  treeList: { gap: 8 },
  levelGroup: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  levelLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f8f8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: { fontSize: 12, fontWeight: '700', color: '#5d5e64' },
  levelTitle: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  levelCount: { fontSize: 12, color: '#45474b' },
  levelArrow: { fontSize: 12, color: '#45474b' },
  memberList: { padding: 12, gap: 8 },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 14, fontWeight: '700', color: '#5d5e64' },
  memberName: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  memberPhone: { fontSize: 11, color: '#45474b', marginTop: 2 },
  memberStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  memberStatusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#45474b', marginBottom: 4 },
  emptyHint: { fontSize: 14, color: '#45474b', textAlign: 'center' },
});
