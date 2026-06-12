import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function ReferralScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [downline, setDownline] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) { navigation?.replace('Login'); return; }

    try {
      const [profileRes, statsRes, downlineRes] = await Promise.all([
        fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/referral/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/referral/downline`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setUser(data.data.user);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }
      if (downlineRes.ok) {
        const data = await downlineRes.json();
        setDownline(data.data.members || []);
      }
    } catch (err) {
      console.error('Failed to load', err);
    } finally {
      setLoading(false);
    }
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
        <ActivityIndicator size="large" color="#5d5e64" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Referral Team</Text>

      {/* Referral Link */}
      <View style={styles.referCard}>
        <Text style={styles.referLabel}>Your Referral Code</Text>
        <Text style={styles.referCode}>{user?.ownRefercode || 'N/A'}</Text>
        <Text style={styles.referHint}>Share this code with friends to earn commissions!</Text>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsGrid}>
          {[
            { label: 'Total', value: stats.totalReferrals, color: '#5d5e64' },
            { label: 'Level 1', value: stats.level1Count, color: '#2d666d' },
            { label: 'Level 2', value: stats.level2Count, color: '#78555e' },
            { label: 'Level 3', value: stats.level3Count, color: '#5d5e64' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Downline List */}
      <Text style={styles.sectionTitle}>Downline Members</Text>
      {downline.length > 0 ? (
        <View style={styles.listContainer}>
          {downline.map((member: any) => (
            <View key={member.userId} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.username?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.username}</Text>
                  <Text style={styles.memberPhone}>{member.phoneNumber}</Text>
                </View>
              </View>
              <View style={styles.memberBadges}>
                <View style={[styles.levelBadge, { backgroundColor: '#f8f8ff' }]}>
                  <Text style={styles.levelText}>L{member.level}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(member.memberStatus) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(member.memberStatus) }]}>
                    {member.memberStatus}
                  </Text>
                </View>
              </View>
            </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8ff',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8ff',
  },
  backBtn: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#5d5e64',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1b1b',
    marginBottom: 24,
  },
  referCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 24,
  },
  referLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#45474b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  referCode: {
    fontSize: 28,
    fontWeight: '800',
    color: '#5d5e64',
    letterSpacing: 4,
    marginBottom: 8,
  },
  referHint: {
    fontSize: 13,
    color: '#45474b',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#45474b',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1b1b',
    marginBottom: 12,
  },
  listContainer: {
    gap: 10,
  },
  memberCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5d5e64',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1b1b',
  },
  memberPhone: {
    fontSize: 12,
    color: '#45474b',
    marginTop: 2,
  },
  memberBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5d5e64',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#45474b',
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 14,
    color: '#45474b',
    textAlign: 'center',
  },
});
