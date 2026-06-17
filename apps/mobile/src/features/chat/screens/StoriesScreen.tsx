import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';

export default function StoriesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <AuroraBackground />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stories</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>➕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>Stories</Text>
          <Text style={styles.emptyText}>Share moments with your friends and network. Stories disappear after 24 hours. Coming soon!</Text>
        </View>
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/chat')}>
          <Text style={styles.navIcon}>💬</Text>
          <Text style={styles.navLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/chat/calls')}>
          <Text style={styles.navIcon}>📞</Text>
          <Text style={styles.navLabel}>Calls</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/chat/people')}>
          <Text style={styles.navIcon}>👥</Text>
          <Text style={styles.navLabel}>People</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.activeNavCircle}>
            <Text style={styles.activeNavIcon}>📖</Text>
          </View>
          <Text style={styles.activeNavLabel}>Stories</Text>
        </TouchableOpacity>
      </View>
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
  actionButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionIcon: { fontSize: 20 },

  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 5,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1c1b1b', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#76777b', textAlign: 'center', lineHeight: 22 },

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
