import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Keyboard } from 'react-native';

interface CommentInputProps {
  onSubmit: (text: string) => void;
  replyTo?: string | null;
  onCancelReply?: () => void;
  submitting?: boolean;
}

export default function CommentInput({ onSubmit, replyTo, onCancelReply, submitting }: CommentInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    if (!text.trim() || submitting) return;
    onSubmit(text.trim());
    setText('');
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {replyTo && (
        <View style={styles.replyBanner}>
          <Text style={styles.replyText}>Replying to comment</Text>
          <TouchableOpacity onPress={onCancelReply}>
            <Text style={styles.cancelReply}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.iconBtn}>
          <Text style={styles.iconText}>🖼</Text>
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Write a comment..."
          placeholderTextColor="#45474b80"
          style={styles.textInput}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity style={styles.iconBtn}>
          <Text style={styles.iconText}>😊</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || submitting) && styles.sendBtnDisabled]}
          onPress={handleSubmit}
          disabled={!text.trim() || submitting}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(233,253,255,0.6)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  replyText: {
    fontSize: 12,
    color: '#2d666d',
    fontWeight: '600',
  },
  cancelReply: {
    fontSize: 14,
    color: '#45474b',
    paddingHorizontal: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 9999,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 40,
    elevation: 8,
  },
  iconBtn: {
    padding: 8,
  },
  iconText: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1c1b1b',
    paddingVertical: 4,
    paddingHorizontal: 8,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#1A1A1A',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
