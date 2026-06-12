import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function CreatePostScreen() {
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsPending(true);
    // TODO: integrate with post API
    await new Promise((r) => setTimeout(r, 500));
    setIsPending(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Post</Text>
        <TouchableOpacity
          style={[styles.postButton, !content.trim() && styles.postButtonDisabled]}
          onPress={handleSubmit}
          disabled={isPending || !content.trim()}
        >
          <Text style={styles.postButtonText}>{isPending ? 'Posting...' : 'Post'}</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        placeholderTextColor="#45474b80"
        value={content}
        onChangeText={setContent}
        multiline
        autoFocus
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf9f8',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(118, 119, 123, 0.2)',
  },
  cancel: {
    fontSize: 16,
    color: '#45474b',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1b1b',
  },
  postButton: {
    backgroundColor: '#5d5e64',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1c1b1b',
    lineHeight: 24,
    textAlignVertical: 'top',
  },
});
