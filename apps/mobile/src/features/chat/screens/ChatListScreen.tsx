import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchConversations, fetchDownlineUsers } from '../api';
import { useSocket } from '../hooks/useSocket';
import AuroraBackground from '@/shared/components/AuroraBackground';
import GlassPanel from '@/shared/components/GlassPanel';

const { width } = Dimensions.get('window');

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  members: { id: string; username: string; fullName: string; avatarUrl: string }[];
  lastMessage: { content: string; senderName: string; createdAt: string } | null;
  unreadCount: number;
  updatedAt: string;
}

export default function ChatListScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [downlineUsers, setDownlineUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isConnected, onlineUsers, onMessage, onConversationCreated } = useSocket(token);

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((t) => {
      setToken(t);
      if (t) {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
        Promise.all([
          fetchConversations(t).catch(() => []),
          fetchDownlineUsers(t).catch(() => []),
          fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${t}` } })
            .then((r) => r.ok ? r.json() : null)
            .catch(() => null),
        ]).then(([convs, downline, profile]) => {
          setConversations(convs);
          setDownlineUsers(downline);
          if (profile?.id) setUserId(profile.id);
        }).finally(() => setLoading(false));
      }
    });
  }, []);

  useEffect(() => {
    const unsubMessage = onMessage((message: any) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? {
                ...conv,
                lastMessage: { content: message.content, senderName: message.senderName, createdAt: message.createdAt },
                updatedAt: message.createdAt,
                unreadCount: conv.unreadCount + 1,
              }
            : conv,
        ),
      );
    });

    const unsubCreated = onConversationCreated((conversation: any) => {
      setConversations((prev) => {
        if (prev.find((c) => c.id === conversation.id)) return prev;
        return [conversation, ...prev];
      });
    });

    return () => {
      unsubMessage();
      unsubCreated();
    };
  }, [onMessage, onConversationCreated]);

  const filtered = conversations.filter((c) =>
    (c.displayName || c.name || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const onlineFriends = conversations
    .flatMap((c) => c.members || [])
    .filter((m) => m.id !== userId && onlineUsers.has(m.id))
    .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
    .slice(0, 10);

  if (loading) {
    return (
      <View style={styles.center}>
        <AuroraBackground />
        <ActivityIndicator size="large" color="#5d5e64" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#76777b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stories / Online Bar */}
      <View style={styles.storiesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'new-group', type: 'action' } as any, ...onlineFriends.map(f => ({ ...f, type: 'user' } as any))]}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => {
            if (item.type === 'action') {
              return (
                <TouchableOpacity style={styles.storyItem} onPress={() => router.push('/chat/create-group')}>
                  <View style={styles.addStoryCircle}>
                    <Text style={styles.addStoryIcon}>+</Text>
                  </View>
                  <Text style={styles.storyName}>New Group</Text>
                </TouchableOpacity>
              );
            }
            const displayName = item.fullName || item.username;
            return (
              <TouchableOpacity style={styles.storyItem} onPress={() => router.push('/chat/people')}>
                <View style={styles.auroraBorder}>
                  <View style={styles.storyAvatar}>
                    <Text style={styles.storyAvatarText}>{displayName?.[0]?.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.storyName} numberOfLines={1}>{displayName}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const otherMember = item.members?.find((m) => m.id !== userId);
          const isOnline = otherMember ? onlineUsers.has(otherMember.id) : false;
          const displayName = item.displayName || item.name || 'Unknown';
          const lastMsg = item.lastMessage;

          return (
            <TouchableOpacity style={styles.conversationItem} onPress={() => router.push(`/chat/${item.id}`)}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{displayName[0]?.toUpperCase()}</Text>
                </View>
                {isOnline && <View style={styles.onlineIndicator} />}
              </View>
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName} numberOfLines={1}>{displayName}</Text>
                  {lastMsg && (
                    <Text style={[styles.timeText, item.unreadCount > 0 && styles.unreadTime]}>
                      {getTimeAgo(lastMsg.createdAt)}
                    </Text>
                  )}
                </View>
                <Text style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
                  {lastMsg ? (
                    <>
                      {item.type === 'group' && <Text style={styles.senderPrefix}>{lastMsg.senderName}: </Text>}
                      {lastMsg.content || '📷 Photo'}
                    </>
                  ) : 'No messages yet'}
                </Text>
              </View>
              {item.unreadCount > 0 && <View style={styles.unreadBadge} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <TouchableOpacity onPress={() => router.push('/chat/people')}>
              <Text style={styles.emptyLink}>Start a conversation</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/chat')}>
          <View style={styles.activeNavCircle}>
            <Text style={styles.activeNavIcon}>💬</Text>
          </View>
          <Text style={styles.activeNavLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/chat/calls')}>
          <Text style={styles.navIcon}>📞</Text>
          <Text style={styles.navLabel}>Calls</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/chat/people')}>
          <Text style={styles.navIcon}>👥</Text>
          <Text style={styles.navLabel}>People</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/chat/stories')}>
          <Text style={styles.navIcon}>📖</Text>
          <Text style={styles.navLabel}>Stories</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1c1b1b' },
  headerButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerIcon: { fontSize: 20 },

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

  storiesContainer: { paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)' },
  storyItem: { alignItems: 'center', marginHorizontal: 8, width: 72 },
  addStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  addStoryIcon: { fontSize: 28, color: '#5d5e64' },
  auroraBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
    backgroundColor: 'rgba(179,236,243,0.4)',
  },
  storyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fcf9f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  storyAvatarText: { fontSize: 22, fontWeight: '700', color: '#5d5e64' },
  storyName: { fontSize: 12, fontWeight: '600', color: '#1c1b1b', marginTop: 4, textAlign: 'center' },

  listContent: { padding: 16, paddingBottom: 120 },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 5,
  },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e5e2e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#5d5e64' },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#b3ecf3',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  conversationInfo: { flex: 1 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  conversationName: { fontSize: 14, fontWeight: '600', color: '#1c1b1b', flex: 1 },
  timeText: { fontSize: 12, color: '#76777b' },
  unreadTime: { color: '#2d666d', fontWeight: '600' },
  lastMessage: { fontSize: 15, color: '#76777b' },
  unreadMessage: { color: '#1c1b1b', fontWeight: '600' },
  senderPrefix: { fontWeight: '600', color: '#45474b' },
  unreadBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2d666d',
    marginLeft: 8,
    shadowColor: '#2d666d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },

  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#76777b', marginBottom: 8 },
  emptyLink: { fontSize: 14, fontWeight: '600', color: '#2d666d', textDecorationLine: 'underline' },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', padding: 6 },
  activeNavCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5d5e64',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeNavIcon: { fontSize: 18 },
  activeNavLabel: { fontSize: 10, fontWeight: '600', color: '#5d5e64', marginTop: 2 },
  navIcon: { fontSize: 18 },
  navLabel: { fontSize: 10, fontWeight: '600', color: '#76777b', marginTop: 2 },
});
