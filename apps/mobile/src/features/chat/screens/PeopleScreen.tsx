import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuroraBackground from '@/shared/components/AuroraBackground';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4080';

interface User {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  level?: number;
  friendshipStatus?: string;
}

export default function PeopleScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [downlineUsers, setDownlineUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'downline'>('search');
  const [friendActionLoading, setFriendActionLoading] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((t) => {
      setToken(t);
      if (t) {
        fetch(`${API_URL}/chat/downline-users`, {
          headers: { Authorization: `Bearer ${t}` },
        })
          .then((res) => res.json())
          .then(setDownlineUsers)
          .catch(console.error);
      }
    });
  }, []);

  const searchUsersList = useCallback(async (q: string) => {
    if (!token || q.length < 2) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/search/all?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to search users', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => searchUsersList(query), 300);
    return () => clearTimeout(timer);
  }, [query, searchUsersList]);

  const startConversation = async (userId: string) => {
    if (!token) return;
    setCreating(userId);
    try {
      const res = await fetch(`${API_URL}/chat/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'direct', memberIds: [userId] }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat/${data.id}`);
      }
    } catch (err) {
      console.error('Failed to create conversation', err);
    } finally {
      setCreating(null);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!token) return;
    setFriendActionLoading(userId);
    try {
      const res = await fetch(`${API_URL}/friends/request/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, friendshipStatus: 'request_sent' } : u)),
        );
        setDownlineUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, friendshipStatus: 'request_sent' } : u)),
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFriendActionLoading(null);
    }
  };

  const renderFriendButton = (user: User) => {
    if (user.friendshipStatus === 'friends') {
      return (
        <View style={styles.friendsBadge}>
          <Text style={styles.friendsBadgeText}>✓ Friends</Text>
        </View>
      );
    }
    if (user.friendshipStatus === 'request_sent') {
      return (
        <View style={styles.sentBadge}>
          <Text style={styles.sentBadgeText}>Sent</Text>
        </View>
      );
    }
    if (user.friendshipStatus === 'request_received') {
      return (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>Pending</Text>
        </View>
      );
    }
    return (
      <TouchableOpacity
        style={styles.addFriendBtn}
        onPress={() => handleSendFriendRequest(user.id)}
        disabled={friendActionLoading === user.id}
      >
        <Text style={styles.addFriendBtnText}>
          {friendActionLoading === user.id ? '...' : '+ Add'}
        </Text>
      </TouchableOpacity>
    );
  };

  const displayUsers = activeTab === 'search' ? users : downlineUsers;

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName || item.username}</Text>
        <Text style={styles.userHandle}>
          @{item.username}
          {item.level && <Text style={styles.userLevel}> · Level {item.level}</Text>}
        </Text>
      </View>
      <View style={styles.userActions}>
        {renderFriendButton(item)}
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => startConversation(item.id)}
          disabled={creating === item.id}
        >
          <Text style={styles.messageButtonText}>{creating === item.id ? '...' : 'Message'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AuroraBackground />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>People</Text>
        <TouchableOpacity onPress={() => router.push('/friends')} style={styles.friendsBtn}>
          <Text style={styles.friendsBtnText}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username or name..."
            placeholderTextColor="#76777b"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (text.length >= 2) setActiveTab('search');
            }}
            autoFocus
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('search')}
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setActiveTab('downline'); setQuery(''); }}
          style={[styles.tab, activeTab === 'downline' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'downline' && styles.activeTabText]}>
            My Downline ({downlineUsers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#5d5e64" />
        </View>
      )}

      <FlatList
        data={displayUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{activeTab === 'downline' ? '👥' : '🔍'}</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'downline'
                ? 'No downline members yet.\nShare your referral code to build your network.'
                : query.length >= 2
                  ? `No users found for "${query}"`
                  : 'Search by username or name'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#5d5e64' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1c1b1b' },
  friendsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  friendsBtnText: { fontSize: 16 },

  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 24, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1c1b1b' },

  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  activeTab: { backgroundColor: '#5d5e64', borderColor: '#5d5e64' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#45474b' },
  activeTabText: { color: '#ffffff' },

  loadingContainer: { paddingVertical: 16, alignItems: 'center' },

  listContent: { paddingBottom: 40 },
  userItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 16, marginVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#e5e2e1',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#5d5e64' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  userHandle: { fontSize: 13, color: '#76777b' },
  userLevel: { color: '#2d666d', fontWeight: '600' },
  userActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  messageButton: {
    backgroundColor: '#2d666d', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
  },
  messageButtonText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  addFriendBtn: {
    backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 16, borderWidth: 1, borderColor: '#2d666d30',
  },
  addFriendBtnText: { fontSize: 12, fontWeight: '600', color: '#2d666d' },
  friendsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#e9fdff' },
  friendsBadgeText: { fontSize: 11, fontWeight: '600', color: '#2d666d' },
  sentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#e5e2e1' },
  sentBadgeText: { fontSize: 11, fontWeight: '600', color: '#45474b' },
  pendingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#ffd1dc' },
  pendingBadgeText: { fontSize: 11, fontWeight: '600', color: '#78555e' },

  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#76777b', textAlign: 'center', lineHeight: 24 },
});
