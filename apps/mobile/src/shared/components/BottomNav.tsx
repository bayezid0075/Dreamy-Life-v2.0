import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface NavItem {
  icon: string;
  activeIcon: string;
  href: string;
  isButton: boolean;
  onPress?: () => void;
}

interface BottomNavProps {
  items?: NavItem[];
}

const DEFAULT_ITEMS: NavItem[] = [
  { icon: '🏠', activeIcon: '🏠', href: '/dashboard', isButton: false },
  { icon: '🔍', activeIcon: '🔍', href: '#search', isButton: true },
  { icon: '🛒', activeIcon: '🛒', href: '#cart', isButton: false },
  { icon: '👤', activeIcon: '👤', href: '/profile', isButton: false },
];

export default function BottomNav({ items = DEFAULT_ITEMS }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={30} tint="light" style={styles.container}>
        <View style={styles.overlay} />
        <View style={styles.nav}>
          {items.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <TouchableOpacity
                key={item.href + index}
                onPress={() => {
                  if (item.isButton) {
                    item.onPress?.();
                    return;
                  }
                  router.push(item.href as any);
                }}
                style={styles.item}
              >
                {isActive ? (
                  <View style={styles.activeCircle}>
                    <Text style={styles.activeIcon}>{item.activeIcon}</Text>
                  </View>
                ) : (
                  <View style={styles.inactiveIcon}>
                    <Text style={styles.iconText}>{item.icon}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    left: width * 0.05,
    width: width * 0.9,
    zIndex: 50,
  },
  container: {
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  activeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1c1b1b',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 0.9 }],
  },
  activeIcon: {
    fontSize: 18,
  },
  inactiveIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
});
