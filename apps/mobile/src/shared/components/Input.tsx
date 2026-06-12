import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor="#45474b80"
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.7,
    color: '#1c1b1b',
    marginLeft: 4,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 28,
    fontSize: 16,
    color: '#1c1b1b',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(118, 119, 123, 0.2)',
  },
  inputError: {
    borderColor: '#ba1a1a',
    backgroundColor: '#ffdad6',
  },
  error: {
    fontSize: 12,
    color: '#ba1a1a',
    marginLeft: 4,
    marginTop: 4,
  },
});
