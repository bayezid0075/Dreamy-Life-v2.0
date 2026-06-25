import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotification?: boolean;
  unreadNotifCount?: number;
  avatarUrl?: string;
  onMenuPress?: () => void;
  showMenu?: boolean;
  showSearch?: boolean;
  rightAction?: React.ReactNode;
}

export default function TopBar({
  title,
  showBack = false,
  onBack,
  showNotification = true,
  unreadNotifCount = 0,
  avatarUrl,
  onMenuPress,
  showMenu = false,
  showSearch = true,
  rightAction,
}: TopBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const renderLeft = () => {
    if (showBack) {
      return (
        <TouchableOpacity onPress={() => (onBack ? onBack() : router.back())} style={styles.roundBtn}>
          <Text style={styles.btnText}>←</Text>
        </TouchableOpacity>
      );
    }
    if (showMenu) {
      return (
        <TouchableOpacity onPress={onMenuPress} style={styles.roundBtn}>
          <Text style={styles.btnText}>☰</Text>
        </TouchableOpacity>
      );
    }
    return <View style={styles.placeholderBtn} />;
  };

  const renderCenter = () => {
    if (showBack && title) {
      return <Text style={styles.title}>{title}</Text>;
    }
    if (!showBack && !title && showMenu) {
      return <Text style={styles.title}>Dreamy Life</Text>;
    }
    if (title) {
      return <Text style={styles.title}>{title}</Text>;
    }
    return null;
  };

  const renderRight = () => {
    if (rightAction) return rightAction;
    return (
      <View style={styles.rightIcons}>
        {showSearch && (
          <TouchableOpacity onPress={() => {}} style={styles.roundBtn}>
            <Text style={styles.btnText}>🔍</Text>
          </TouchableOpacity>
        )}
        {showNotification && (
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.roundBtn}>
            <Text style={styles.btnText}>🔔</Text>
            {unreadNotifCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifCount > 99 ? '99+' : unreadNotifCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {!showNotification && !showSearch && <View style={styles.placeholderBtn} />}
      </View>
    );
  };

  return (
    <BlurView intensity={40} tint="light" style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        {renderLeft()}
        <View style={styles.centerWrap}>
          {renderCenter()}
        </View>
        {renderRight()}
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
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
  },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  placeholderBtn: {
    width: 36,
    height: 36,
  },
  btnText: {
    fontSize: 16,
    color: '#45474b',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1c1b1b',
    letterSpacing: -0.5,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
