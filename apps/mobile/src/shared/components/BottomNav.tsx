import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavItem {
  icon: string;
  href: string;
  isActive?: boolean;
}

interface BottomNavProps {
  items?: NavItem[];
}

const DEFAULT_ITEMS: NavItem[] = [
  { icon: '🏠', href: '/dashboard' },
  { icon: '📰', href: '/social-feed' },
   { icon: '🏪', href: '/reseller-shop' },
  { icon: '🛒', href: '/reselling/orders' },
  { icon: '👤', href: '/profile' },
];

export default function BottomNav({ items = DEFAULT_ITEMS }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { left: width * 0.05, width: width * 0.9, bottom: insets.bottom + 12 }]}>
      <BlurView intensity={40} tint="light" style={styles.container}>
        <View style={styles.overlay} />
        <View style={styles.nav}>
          {items.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <TouchableOpacity
                key={item.href + index}
                onPress={() => {
                  if (item.href === '#search') return;
                  router.push(item.href as any);
                }}
                style={styles.item}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconCircle,
                    isActive && styles.activeCircle,
                  ]}
                >
                  <Text style={[styles.iconText, isActive && styles.activeIconText]}>
                    {item.icon}
                  </Text>
                </View>
                {isActive && <View style={styles.activeDot} />}
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
    zIndex: 50,
  },
  container: {
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
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
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    backgroundColor: '#1c1b1b',
  },
  iconText: {
    fontSize: 20,
  },
  activeIconText: {},
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1c1b1b',
    marginTop: 2,
  },
});
