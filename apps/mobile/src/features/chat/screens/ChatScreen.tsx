import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchMessages, fetchConversationById } from '../api';
import { useSocket } from '../hooks/useSocket';
import AuroraBackground from '@/shared/components/AuroraBackground';
import { resolveMediaUrl } from '@/shared/utils/resolveMediaUrl';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  senderName: string;
  senderAvatar: string | null;
}

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  displayName: string | null;
  members: { id: string; username: string; fullName: string; avatarUrl: string; role: string }[];
}

interface Props {
  conversationId: string;
}

export default function ChatScreen({ conversationId }: Props) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { joinConversation, leaveConversation, sendMessage: socketSend, startTyping, stopTyping, onMessage, onTypingStart, onTypingStop, onlineUsers } = useSocket(token);

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((t) => {
      setToken(t);
      if (t) {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
        Promise.all([
          fetchMessages(t, conversationId),
          fetchConversationById(t, conversationId),
          fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${t}` } })
            .then((r) => r.ok ? r.json() : null)
            .catch(() => null),
        ]).then(([msgData, convData, profile]) => {
          setMessages(msgData.messages);
          setConversation(convData);
          if (profile?.data?.id) setUserId(profile.data.id);
        }).catch(console.error);
      }
    });
  }, [conversationId]);

  useEffect(() => {
    if (!token) return;
    joinConversation(conversationId);

    const unsubMsg = onMessage((msg: Message) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    const unsubTypingStart = onTypingStart((data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId && data.userId !== userId) {
        setTypingUsers((prev) => new Set(prev).add(data.userId));
      }
    });

    const unsubTypingStop = onTypingStop((data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    });

    return () => {
      leaveConversation(conversationId);
      unsubMsg();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [token, conversationId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    socketSend({ conversationId, content: inputText.trim() });
    setInputText('');
    stopTyping(conversationId);
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    startTyping(conversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 2000);
  };

  const otherMember = conversation?.members?.find((m) => m.id !== userId);
  const displayName = conversation?.displayName || conversation?.name || otherMember?.fullName || otherMember?.username || 'Chat';
  const isOnline = otherMember ? onlineUsers.has(otherMember.id) : false;
  const typingText = typingUsers.size > 0 ? 'typing...' : '';

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isSent = item.senderId === userId;
    const showDateDivider = index === 0 || formatDate(item.createdAt) !== formatDate(messages[index - 1].createdAt);

    return (
      <View>
        {showDateDivider && (
          <View style={styles.dateDivider}>
            <View style={styles.dateDividerPill}>
              <Text style={styles.dateDividerText}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
        )}
        <View style={[styles.messageRow, isSent ? styles.sentRow : styles.receivedRow]}>
          {!isSent && (
            <View style={styles.messageColumn}>
              <View style={[styles.bubble, styles.receivedBubble]}>
                {item.content && <Text style={styles.receivedText}>{item.content}</Text>}
                {item.mediaUrl && (
                  <Image source={{ uri: resolveMediaUrl(item.mediaUrl) }} style={styles.messageImage} resizeMode="cover" />
                )}
              </View>
              <Text style={styles.receivedTime}>{formatTime(item.createdAt)}</Text>
            </View>
          )}
          {isSent && (
            <View style={[styles.messageColumn, styles.sentColumn]}>
              <View style={[styles.bubble, styles.sentBubble]}>
                {item.content && <Text style={styles.sentText}>{item.content}</Text>}
                {item.mediaUrl && (
                  <Image source={{ uri: resolveMediaUrl(item.mediaUrl) }} style={styles.messageImage} resizeMode="cover" />
                )}
              </View>
              <View style={styles.sentTimeRow}>
                <Text style={styles.sentTime}>{formatTime(item.createdAt)}</Text>
                <Text style={styles.readReceipt}>✓✓</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <AuroraBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{displayName[0]?.toUpperCase()}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.headerStatus}>
              {typingText || (isOnline ? 'Online' : '')}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
          </View>
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputActions}>
          <TouchableOpacity style={styles.inputActionBtn}>
            <Text style={styles.inputActionIcon}>➕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputActionBtn}>
            <Text style={styles.inputActionIcon}>📷</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="rgba(28,27,27,0.4)"
            value={inputText}
            onChangeText={handleInputChange}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.emojiBtn}>
            <Text style={styles.emojiIcon}>😊</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(252,249,248,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#5d5e64' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e2e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerAvatarText: { fontSize: 16, fontWeight: '700', color: '#5d5e64' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#5d5e64' },
  headerStatus: { fontSize: 12, fontWeight: '600', color: '#98d0d7' },
  moreButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  moreIcon: { fontSize: 24, color: '#5d5e64' },

  messagesList: { padding: 16, paddingBottom: 8 },
  dateDivider: { alignItems: 'center', marginVertical: 12 },
  dateDividerPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  dateDividerText: { fontSize: 12, fontWeight: '600', color: 'rgba(69,71,75,0.7)', letterSpacing: 0.5 },
  messageRow: { flexDirection: 'row', marginBottom: 8 },
  sentRow: { justifyContent: 'flex-end' },
  receivedRow: { justifyContent: 'flex-start' },
  messageColumn: { maxWidth: '80%' },
  sentColumn: { alignItems: 'flex-end' },
  bubble: { padding: 14, borderRadius: 18 },
  sentBubble: {
    backgroundColor: 'rgba(93,94,100,0.9)',
    borderBottomRightRadius: 4,
    shadowColor: '#2d666d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  receivedBubble: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  sentText: { fontSize: 16, color: '#ffffff', lineHeight: 22 },
  receivedText: { fontSize: 16, color: '#1c1b1b', lineHeight: 22 },
  messageImage: { width: 240, height: 160, borderRadius: 12, marginTop: 4 },
  receivedTime: { fontSize: 11, color: 'rgba(118,119,123,0.5)', marginTop: 4, marginLeft: 4 },
  sentTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, marginRight: 4 },
  sentTime: { fontSize: 11, color: 'rgba(118,119,123,0.5)' },
  readReceipt: { fontSize: 12, color: '#98d0d7', marginLeft: 4 },

  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#76777b' },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  inputActions: { flexDirection: 'row', gap: 4, marginRight: 8 },
  inputActionBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  inputActionIcon: { fontSize: 20 },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 16,
  },
  textInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#1c1b1b' },
  emojiBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emojiIcon: { fontSize: 20 },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5d5e64',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#5d5e64',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendIcon: { fontSize: 24, color: '#ffffff', fontWeight: '700' },
});
