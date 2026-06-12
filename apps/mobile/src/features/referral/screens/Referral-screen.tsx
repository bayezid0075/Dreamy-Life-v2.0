import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReferralScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Referrals</Text>
      <Text style={styles.subtitle}>Referral system coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf9f8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1b1b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#45474b',
  },
});
