import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchUsers, createGroupConversation, fetchDownlineUsers } from '../api';
import AuroraBackground from '@/shared/components/AuroraBackground';

interface User {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  level?: number;
}

export default function CreateGroupScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [downlineUsers, setDownlineUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'downline'>('search');

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((t) => {
      setToken(t);
      if (t) {
        fetchDownlineUsers(t)
          .then((data) => setDownlineUsers(data))
          .catch(console.error);
      }
    });
  }, []);

  useEffect(() => {
    if (!token || query.length < 2) { setUsers([]); return; }
    const timer = setTimeout(() => {
      searchUsers(token, query)
        .then((data) => setUsers(data))
        .catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, token]);

  const addMember = (user: User) => {
    setSelectedUsers((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev;
      return [...prev, user];
    });
    setQuery('');
    setUsers([]);
  };

  const removeMember = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleCreate = async () => {
    if (!token || !groupName.trim() || selectedUsers.length === 0) return;
    setCreating(true);
    try {
      const conv = await createGroupConversation(token, {
        name: groupName.trim(),
        memberIds: selectedUsers.map((u) => u.id),
      });
      router.push(`/chat/${conv.id}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const displayUsers = (() => {
    const list = activeTab === 'search' ? users : downlineUsers;
    const selectedIds = new Set(selectedUsers.map((u) => u.id));
    const seen = new Set<string>();
    return list.filter((u) => {
      if (selectedIds.has(u.id)) return false;
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  })();

  return (
    <View style={styles.container}>
      <AuroraBackground />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <TouchableOpacity onPress={handleCreate} disabled={loading || creating}>
          <Text style={[styles.createButton, (loading || creating) && { opacity: 0.5 }]}>
            {creating ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Group Name */}
      <View style={styles.nameContainer}>
        <TextInput style={styles.nameInput} placeholder="Group name..." placeholderTextColor="#76777b" value={groupName} onChangeText={setGroupName} />
      </View>

      {/* Selected Members */}
      {selectedUsers.length > 0 && (
        <View style={styles.selectedContainer}>
          {selectedUsers.map((u) => (
            <TouchableOpacity key={u.id} style={styles.selectedChip} onPress={() => removeMember(u.id)}>
              <Text style={styles.chipText}>{u.fullName || u.username} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#76777b"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (text.length >= 2) setActiveTab('search');
            }}
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
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      <FlatList
        data={displayUsers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userItem} onPress={() => addMember(item)}>
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
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'downline' ? 'No downline members yet' : 'Search and add members to your group'}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#5d5e64' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1c1b1b' },
  createButton: { fontSize: 16, fontWeight: '600', color: '#2d666d' },

  nameContainer: { padding: 16 },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    color: '#1c1b1b',
  },

  selectedContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  selectedChip: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#1c1b1b' },

  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1c1b1b' },

  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  activeTab: {
    backgroundColor: '#5d5e64',
    borderColor: '#5d5e64',
  },
  tabText: { fontSize: 14, fontWeight: '600', color: '#45474b' },
  activeTabText: { color: '#ffffff' },

  loadingContainer: { paddingVertical: 16, alignItems: 'center' },
  loadingText: { fontSize: 14, color: '#76777b' },

  listContent: { paddingBottom: 40 },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e2e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#5d5e64' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: '#1c1b1b' },
  userHandle: { fontSize: 13, color: '#76777b' },
  userLevel: { color: '#2d666d', fontWeight: '600' },
  addIcon: { fontSize: 24, color: '#2d666d' },

  emptyContainer: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#76777b', textAlign: 'center' },
});
