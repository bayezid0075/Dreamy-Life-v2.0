import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface FriendUser {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  memberStatus?: string;
  createdAt?: string;
}

interface FriendRequest extends FriendUser {
  requestId?: string;
}

export default function FriendsScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent' | 'find'>('friends');
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(FriendUser & { friendshipStatus: string })[]>([]);
  const [friendQuery, setFriendQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((t) => {
      setToken(t);
      if (t) fetchAll(t);
      else setLoading(false);
    });
  }, []);

  const fetchAll = async (t: string) => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes, sentRes] = await Promise.all([
        fetch(`${API_URL}/friends`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API_URL}/friends/requests`, { headers: { Authorization: `Bearer ${t}` } }),
        fetch(`${API_URL}/friends/requests/sent`, { headers: { Authorization: `Bearer ${t}` } }),
      ]);

      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data.friends || []);
      }
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setReceivedRequests(data.requests || []);
      }
      if (sentRes.ok) {
        const data = await sentRes.json();
        setSentRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch friends data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = useCallback(async (q?: string) => {
    if (!token) return;
    try {
      const url = q && q.length >= 2
        ? `${API_URL}/users/search/all?q=${encodeURIComponent(q)}`
        : `${API_URL}/users/search/all`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Failed to search users', err);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab !== 'find') return;
    const timer = setTimeout(() => fetchAllUsers(searchQuery || undefined), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, fetchAllUsers]);

  const handleAcceptRequest = async (requestId: string) => {
    if (!token) return;
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_URL}/friends/accept/${requestId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAll(token);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!token) return;
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_URL}/friends/reject/${requestId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAll(token);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!token) return;
    setActionLoading(requestId);
    try {
      const res = await fetch(`${API_URL}/friends/request/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAll(token);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendRequest = async (userId: string) => {
    if (!token) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_URL}/friends/request/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSearchResults((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, friendshipStatus: 'request_sent' } : u)),
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!token) return;
    setActionLoading(friendId);
    try {
      const res = await fetch(`${API_URL}/friends/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAll(token);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartChat = async (userId: string) => {
    if (!token) return;
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
      console.error(err);
    }
  };

  const filteredFriends = friends.filter((f) => {
    if (!friendQuery) return true;
    const q = friendQuery.toLowerCase();
    return f.username.toLowerCase().includes(q) || (f.fullName && f.fullName.toLowerCase().includes(q));
  });

  const renderFriendItem = ({ item }: { item: FriendUser }) => (
    <View style={styles.userItem}>
      <TouchableOpacity onPress={() => router.push(`/users/${item.id}`)} style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{item.fullName || item.username}</Text>
        <Text style={styles.userHandle} numberOfLines={1}>@{item.username}</Text>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity style={styles.chatBtn} onPress={() => handleStartChat(item.id)}>
          <Text style={styles.chatBtnText}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveFriend(item.id)}
          disabled={actionLoading === item.id}
        >
          <Text style={styles.removeBtnText}>{actionLoading === item.id ? '...' : '✕'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRequestItem = ({ item }: { item: FriendRequest }) => (
    <View style={styles.userItem}>
      <TouchableOpacity onPress={() => router.push(`/users/${item.userId || item.id}`)} style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.requestAvatar]}>
            <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{item.fullName || item.username}</Text>
        <Text style={styles.userHandle} numberOfLines={1}>@{item.username}</Text>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleAcceptRequest(item.id)}
          disabled={actionLoading === item.id}
        >
          <Text style={styles.acceptBtnText}>{actionLoading === item.id ? '...' : '✓'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineBtn}
          onPress={() => handleRejectRequest(item.id)}
          disabled={actionLoading === item.id}
        >
          <Text style={styles.declineBtnText}>{actionLoading === item.id ? '...' : '✕'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSentItem = ({ item }: { item: FriendRequest }) => (
    <View style={styles.userItem}>
      <TouchableOpacity onPress={() => router.push(`/users/${item.userId || item.id}`)} style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{item.fullName || item.username}</Text>
        <Text style={styles.userHandle} numberOfLines={1}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => handleCancelRequest(item.id)}
        disabled={actionLoading === item.id}
      >
        <Text style={styles.cancelBtnText}>{actionLoading === item.id ? '...' : 'Cancel'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchItem = ({ item }: { item: FriendUser & { friendshipStatus: string } }) => (
    <View style={styles.userItem}>
      <TouchableOpacity onPress={() => router.push(`/users/${item.id}`)} style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{item.username[0]?.toUpperCase()}</Text>
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{item.fullName || item.username}</Text>
        <Text style={styles.userHandle} numberOfLines={1}>@{item.username}</Text>
      </View>
      {item.friendshipStatus === 'friends' ? (
        <View style={styles.friendsBadge}>
          <Text style={styles.friendsBadgeText}>✓ Friends</Text>
        </View>
      ) : item.friendshipStatus === 'request_sent' ? (
        <View style={styles.sentBadge}>
          <Text style={styles.sentBadgeText}>Sent</Text>
        </View>
      ) : item.friendshipStatus === 'request_received' ? (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>Pending</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addFriendBtn}
          onPress={() => handleSendRequest(item.id)}
          disabled={actionLoading === item.id}
        >
          <Text style={styles.addFriendBtnText}>{actionLoading === item.id ? '...' : '+ Add'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const tabs = [
    { key: 'friends', label: `Friends (${friends.length})` },
    { key: 'requests', label: `Requests (${receivedRequests.length})` },
    { key: 'sent', label: `Sent (${sentRequests.length})` },
    { key: 'find', label: 'Find' },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5d5e64" />
        </View>
      );
    }

    switch (activeTab) {
      case 'friends':
        return (
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.id}
            renderItem={renderFriendItem}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search friends..."
                  placeholderTextColor="#76777b"
                  value={friendQuery}
                  onChangeText={setFriendQuery}
                />
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>
                  {friendQuery ? 'No friends match your search' : 'No friends yet'}
                </Text>
                {!friendQuery && (
                  <TouchableOpacity style={styles.findBtn} onPress={() => setActiveTab('find')}>
                    <Text style={styles.findBtnText}>Find People</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        );
      case 'requests':
        return (
          <FlatList
            data={receivedRequests}
            keyExtractor={(item) => item.id}
            renderItem={renderRequestItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📥</Text>
                <Text style={styles.emptyText}>No pending requests</Text>
              </View>
            }
          />
        );
      case 'sent':
        return (
          <FlatList
            data={sentRequests}
            keyExtractor={(item) => item.id}
            renderItem={renderSentItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📤</Text>
                <Text style={styles.emptyText}>No sent requests</Text>
              </View>
            }
          />
        );
      case 'find':
        return (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderSearchItem}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Filter by username or name..."
                  placeholderTextColor="#76777b"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                  }}
                />
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>
                  {searchQuery.length >= 2 ? 'No users found' : 'No users available'}
                </Text>
              </View>
            }
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="Friends" showBack showSearch={false} showNotification={false} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as typeof activeTab)}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginTop: 100, marginBottom: 12 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  activeTab: { backgroundColor: '#1c1b1b', borderColor: '#1c1b1b' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#45474b' },
  activeTabText: { color: '#ffffff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  searchContainer: { marginBottom: 12 },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 9999,
    paddingHorizontal: 20, paddingVertical: 12, fontSize: 15, color: '#1c1b1b',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  userItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { backgroundColor: '#e9fdff', justifyContent: 'center', alignItems: 'center' },
  requestAvatar: { backgroundColor: '#ffd1dc', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#5d5e64' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  userHandle: { fontSize: 12, color: '#76777b', marginTop: 2 },
  userActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#e9fdff',
    justifyContent: 'center', alignItems: 'center',
  },
  chatBtnText: { fontSize: 16 },
  removeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffdad6',
    justifyContent: 'center', alignItems: 'center',
  },
  removeBtnText: { fontSize: 14, color: '#ba1a1a', fontWeight: '700' },
  acceptBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#2d666d',
    justifyContent: 'center', alignItems: 'center',
  },
  acceptBtnText: { fontSize: 16, color: '#ffffff', fontWeight: '700' },
  declineBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  declineBtnText: { fontSize: 14, color: '#45474b', fontWeight: '700' },
  cancelBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: '#ba1a1a' },
  addFriendBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#2d666d',
  },
  addFriendBtnText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  friendsBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#e9fdff',
  },
  friendsBadgeText: { fontSize: 11, fontWeight: '600', color: '#2d666d' },
  sentBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#e5e2e1',
  },
  sentBadgeText: { fontSize: 11, fontWeight: '600', color: '#45474b' },
  pendingBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#ffd1dc',
  },
  pendingBadgeText: { fontSize: 11, fontWeight: '600', color: '#78555e' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#76777b', textAlign: 'center', lineHeight: 24 },
  findBtn: { marginTop: 16, backgroundColor: '#2d666d', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  findBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
