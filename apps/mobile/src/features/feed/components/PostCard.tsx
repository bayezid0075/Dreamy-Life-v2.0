import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PostCardProps {
  author: { name: string; avatar?: string };
  content: string;
  createdAt: string;
  likesCount: number;
}

export default function PostCard({ author, content, createdAt, likesCount }: PostCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{author.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.authorName}>{author.name}</Text>
          <Text style={styles.date}>{createdAt}</Text>
        </View>
      </View>
      <Text style={styles.content}>{content}</Text>
      <View style={styles.footer}>
        <TouchableOpacity>
          <Text style={styles.likeButton}>♥ {likesCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5d5e64',
  },
  authorName: {
    fontWeight: '600',
    color: '#1c1b1b',
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    color: '#45474b',
    marginTop: 2,
  },
  content: {
    color: '#1c1b1b',
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(118, 119, 123, 0.1)',
    paddingTop: 12,
  },
  likeButton: {
    fontSize: 14,
    color: '#45474b',
  },
});
