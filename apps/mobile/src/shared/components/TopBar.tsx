import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  showNotification?: boolean;
  avatarUrl?: string;
  onMenuPress?: () => void;
  showMenu?: boolean;
}

export default function TopBar({
  title,
  showBack = false,
  showNotification = true,
  avatarUrl,
  onMenuPress,
  showMenu = false,
}: TopBarProps) {
  const router = useRouter();

  return (
    <BlurView intensity={30} tint="light" style={styles.container}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.side}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : showMenu ? (
          <TouchableOpacity onPress={onMenuPress} style={styles.side}>
            <View style={styles.avatarSmall}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarEmoji}>👤</Text>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}

        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : (
          <Text style={styles.title}>Dreamy Life</Text>
        )}

        <View style={styles.rightIcons}>
          <TouchableOpacity onPress={() => router.push('/chat')} style={styles.iconBtn}>
            <Text style={styles.notifIcon}>💬</Text>
          </TouchableOpacity>
          {showNotification ? (
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconBtn}>
              <Text style={styles.notifIcon}>🔔</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  side: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1b1b',
    letterSpacing: -0.5,
  },
  backIcon: {
    fontSize: 20,
    color: '#45474b',
  },
  notifIcon: {
    fontSize: 20,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: '#e5e2e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEmoji: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 40,
  },
});
