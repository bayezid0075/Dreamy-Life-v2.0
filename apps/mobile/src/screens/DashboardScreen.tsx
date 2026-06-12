import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function DashboardScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalReferrals: 0, directReferrals: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) { navigation?.replace('Login'); return; }

    try {
      const [profileRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/referral/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setUser(data.data.user);
        setStats(data.data.stats);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('accessToken');
    navigation?.replace('Login');
  };

  const copyReferCode = () => {
    if (user?.ownRefercode) {
      // In production, use Clipboard from expo-clipboard
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5d5e64" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5d5e64" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🌸</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.username}>{user?.username || 'User'}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{user?.memberStatus}</Text>
              </View>
              <Text style={styles.phoneText}>{user?.phoneNumber}</Text>
            </View>
          </View>
        </View>
        <View style={styles.referCard}>
          <Text style={styles.referLabel}>Referral Code</Text>
          <View style={styles.referCodeRow}>
            <Text style={styles.referCode}>{user?.ownRefercode}</Text>
            <TouchableOpacity onPress={copyReferCode}>
              <Text style={styles.copyBtn}>📋</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statValue}>{stats.totalReferrals}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>➕</Text>
          <Text style={styles.statValue}>{stats.directReferrals}</Text>
          <Text style={styles.statLabel}>Direct</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue} numberOfLines={1}>{user?.memberStatus}</Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation?.navigate('Referral')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#e9fdff' }]}>
            <Text style={styles.actionEmoji}>👥</Text>
          </View>
          <Text style={styles.actionLabel}>Referral Team</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation?.navigate('Membership')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#ffd1dc' }]}>
            <Text style={styles.actionEmoji}>💎</Text>
          </View>
          <Text style={styles.actionLabel}>Membership</Text>
        </TouchableOpacity>

        <View style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: '#f8f8ff' }]}>
            <Text style={styles.actionEmoji}>👛</Text>
          </View>
          <Text style={styles.actionLabel}>Wallet</Text>
        </View>

        <View style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: '#ffdad6' }]}>
            <Text style={styles.actionEmoji}>🎫</Text>
          </View>
          <Text style={styles.actionLabel}>Support</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {[
          { icon: '📦', label: 'Parcels' },
          { icon: '🧾', label: 'Summary' },
          { icon: '💳', label: 'Payments' },
          { icon: '🎟', label: 'Tickets' },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
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
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f8f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 28,
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1c1b1b',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: '#f8f8ff',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5d5e64',
    textTransform: 'capitalize',
  },
  phoneText: {
    fontSize: 12,
    color: '#45474b',
  },
  referCard: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  referLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#45474b',
    marginBottom: 8,
  },
  referCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  referCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5d5e64',
    letterSpacing: 2,
  },
  copyBtn: {
    fontSize: 20,
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
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1b1b',
  },
  statLabel: {
    fontSize: 11,
    color: '#45474b',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1b1b',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 22,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1b1b',
    textAlign: 'center',
  },
  menuSection: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1c1b1b',
  },
  menuArrow: {
    fontSize: 22,
    color: '#45474b',
  },
  logoutBtn: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 218, 214, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.1)',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ba1a1a',
  },
});
