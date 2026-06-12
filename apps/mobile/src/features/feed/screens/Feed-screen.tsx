import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feed</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
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
