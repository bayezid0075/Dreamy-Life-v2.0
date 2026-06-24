import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { BlurView } from 'expo-blur';
import AuroraBackground from '@/shared/components/AuroraBackground';
import GlassPanel from '@/shared/components/GlassPanel';
import BottomNav from '@/shared/components/BottomNav';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4080';

const PRIMARY_ACTIONS = [
  { icon: '📦', label: 'Add Parcel', bg: '#e9fdff', activeBg: '#2d666d' },
  { icon: '🚚', label: 'Pickup Request', bg: '#ffd1dc', activeBg: '#78555e' },
  { icon: '⚡', label: 'Express Delivery', bg: '#e2e2e9', activeBg: '#5d5e64' },
  { icon: '📰', label: 'Social Feed', bg: '#e0f7fa', activeBg: '#00838f', href: '/social-feed' as const },
  { icon: '🔄', label: 'Pick & Drop', bg: '#ffdad6', activeBg: '#ba1a1a' },
];

const FEATURES = [
  { icon: '📱', label: 'Mobile Recharge', bg: '#e9fdff' },
  { icon: '🚗', label: 'Easy Drive', bg: '#e3f2fd' },
  { icon: '🏪', label: 'Reselling', bg: '#f3e5f5', href: '/reseller-shop' },
  { icon: '🏢', label: 'Vendorship', bg: '#e8eaf6', href: '/vendor/apply' },
   { icon: '🛒', label: 'Reseller Shop', bg: '#ffd1dc', href: '/reseller-shop' },
  { icon: '📦', label: 'My Orders', bg: '#e9fdff', href: '/reselling/orders' },
  { icon: '👥', label: 'Drive Pack', bg: '#e0f7fa' },
  { icon: '🧾', label: 'Pay Bill', bg: '#ffd1dc' },
  { icon: '✈️', label: 'Telegram Sell', bg: '#e3f2fd' },
  { icon: '📧', label: 'Gmail Sell', bg: '#fce4ec' },
  { icon: '💬', label: 'WhatsApp Sell', bg: '#e8f5e9' },
  { icon: '⭐', label: 'Premium Apps', bg: '#fffde7' },
  { icon: '✅', label: 'Micro Jobs', bg: '#e9fdff' },
  { icon: '📢', label: 'Social Media', bg: '#e0f7fa', href: '/social-feed' },
  { icon: '💼', label: 'Job Post', bg: '#e3f2fd' },
  { icon: '⌨️', label: 'Typing Work', bg: '#e8eaf6' },
  { icon: '❓', label: 'Quiz Work', bg: '#f3e5f5' },
  { icon: '🧮', label: 'Math Work', bg: '#e0f7fa' },
  { icon: '💻', label: 'Code Entry', bg: '#e8f5e9' },
  { icon: '🎥', label: 'Video Ads', bg: '#fce4ec' },
  { icon: '⚽', label: 'Football Game', bg: '#e8f5e9' },
  { icon: '🎯', label: 'Carrom Game', bg: '#fff3e0' },
  { icon: '🎁', label: 'Welcome Bonus', bg: '#ffd1dc' },
  { icon: '📍', label: 'Target Bonus', bg: '#fff3e0' },
  { icon: '📅', label: 'Weekly Bonus', bg: '#e8eaf6' },
  { icon: '📆', label: 'Daily Bonus', bg: '#e9fdff' },
  { icon: '🗓️', label: 'Monthly Bonus', bg: '#f3e5f5' },
  { icon: '🎫', label: 'Gift Code', bg: '#fffde7' },
  { icon: '🏥', label: 'Daily Service', bg: '#fce4ec' },
  { icon: '🩸', label: 'Blood', bg: '#fce4ec' },
  { icon: '🏪', label: 'Outlet', bg: '#e9fdff' },
];

const SUPPORT_ACTIONS = [
  { icon: '🎧', label: 'Support', color: '#2d666d' },
  { icon: '📍', label: 'Pickup Points', color: '#78555e' },
  { icon: '🗺️', label: 'Coverage', color: '#5d5e64' },
  { icon: '🧮', label: 'Pricing', color: '#5d5e64' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [hasVendor, setHasVendor] = useState<boolean | null>(null);
  const [vendorExpanded, setVendorExpanded] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-320)).current;

  useEffect(() => { loadData(); }, []);

  useFocusEffect(
    useCallback(() => {
      if (!loading) loadData();
    }, [])
  );

  const loadData = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) { router.replace('/login'); return; }
    try {
      const [profileRes, notifRes, vendorRes] = await Promise.all([
        fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/vendor/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (profileRes.status === 401) { await AsyncStorage.removeItem('accessToken'); router.replace('/login'); return; }
      if (profileRes.ok) {
        const data = await profileRes.json();
        setUser(data.data.user);
      }
      if (notifRes.ok) {
        const data = await notifRes.json();
        if (data.count !== undefined) setUnreadNotifCount(data.count);
      }
      if (vendorRes.ok) {
        const data = await vendorRes.json();
        setHasVendor(!!data.data);
      } else {
        setHasVendor(false);
      }
    } catch (err) { console.error('Failed to load', err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, []);

  const toggleDrawer = () => {
    const toValue = drawerOpen ? -320 : 0;
    Animated.spring(drawerAnim, { toValue, useNativeDriver: true, tension: 65, friction: 11 }).start();
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('accessToken');
    router.replace('/login');
  };

  const copyReferCode = () => {};

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AuroraBackground />
        <ActivityIndicator size="large" color="#5d5e64" />
      </View>
    );
  }

  const visibleFeatures = showAllFeatures ? FEATURES : FEATURES.slice(0, 12);

  return (
    <View style={styles.container}>
      <AuroraBackground />

      {/* Mobile Top Bar */}
      <BlurView intensity={40} tint="light" style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topBarOverlay} />
        <View style={styles.topBarContent}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.topBarBtn}>
            <Text style={styles.topBarBtnText}>☰</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/wallet')}
            style={styles.walletPill}
          >
            <Text style={styles.walletPillIcon}>👛</Text>
            <Text style={styles.walletPillText}>Tap for Balance</Text>
          </TouchableOpacity>

          <View style={styles.topBarRight}>
            <TouchableOpacity onPress={() => setSearchOpen(true)} style={styles.topBarBtn}>
              <Text style={styles.topBarBtnText}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.topBarBtn}>
              <Text style={styles.topBarBtnText}>🔔</Text>
              {unreadNotifCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadNotifCount > 99 ? '99+' : unreadNotifCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 56 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5d5e64" />}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <GlassPanel borderRadius={12} style={styles.heroCard}>
            <View style={styles.heroInner}>
              <View style={styles.heroGradient} />
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>Seamless Delivery</Text>
                <Text style={styles.heroSubtitle}>Manage all your shipments in one elegant space.</Text>
              </View>
            </View>
          </GlassPanel>
        </View>

        {/* Primary Actions */}
        <View style={styles.primaryGrid}>
          {PRIMARY_ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.primaryCard}
              activeOpacity={0.7}
              onPress={() => {
                if ('href' in item && item.href) router.push(item.href as any);
              }}
            >
              <View style={[styles.primaryIconWrap, { backgroundColor: item.bg }]}>
                <Text style={styles.primaryEmoji}>{item.icon}</Text>
              </View>
              <Text style={styles.primaryLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features Grid */}
        <GlassPanel borderRadius={12} style={styles.featuresSection}>
          <View style={styles.featuresGrid}>
            {visibleFeatures.map((item: any, index: number) => {
              const isLink = 'href' in item && item.href;
              const content = (
                <>
                  <View style={[styles.featureIcon, { backgroundColor: item.bg }]}>
                    <Text style={styles.featureIconText}>{item.icon}</Text>
                  </View>
                  <Text style={styles.featureLabel} numberOfLines={2}>{item.label}</Text>
                </>
              );
              return (
                <TouchableOpacity
                  key={item.label + index}
                  style={styles.featureItem}
                  onPress={() => isLink && router.push(item.href as any)}
                  activeOpacity={0.7}
                >
                  {content}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            onPress={() => setShowAllFeatures(!showAllFeatures)}
            style={styles.seeMoreBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.seeMoreText}>
              {showAllFeatures ? 'Show Less' : 'See More'}
            </Text>
            <Text style={styles.seeMoreIcon}>{showAllFeatures ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        </GlassPanel>

        {/* Support Row */}
        <GlassPanel borderRadius={12} style={styles.supportSection}>
          <View style={styles.supportGrid}>
            {SUPPORT_ACTIONS.map((item) => (
              <TouchableOpacity key={item.label} style={styles.supportItem} activeOpacity={0.7}>
                <View style={[styles.supportIcon, { backgroundColor: item.color + '20' }]}>
                  <Text style={styles.supportEmoji}>{item.icon}</Text>
                </View>
                <Text style={styles.supportLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassPanel>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Search Overlay */}
      {searchOpen && (
        <View style={styles.searchOverlay}>
          <BlurView intensity={40} tint="light" style={styles.searchContainer}>
            <TouchableOpacity style={styles.searchBackdrop} activeOpacity={1} onPress={() => setSearchOpen(false)} />
            <View style={[styles.searchContent, { paddingTop: insets.top + 20 }]}>
              <View style={styles.searchBar}>
                <TouchableOpacity onPress={() => setSearchOpen(false)} style={styles.searchBackBtn}>
                  <Text style={styles.searchBackText}>←</Text>
                </TouchableOpacity>
                <TextInput
                  autoFocus
                  style={styles.searchInput}
                  placeholder="Search services, parcels..."
                  placeholderTextColor="rgba(69,71,75,0.6)"
                />
                <TouchableOpacity onPress={() => setSearchOpen(false)} style={styles.searchCloseBtn}>
                  <Text style={styles.searchCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchSuggestions}>
                <Text style={styles.searchSectionTitle}>SUGGESTIONS</Text>
                <View style={styles.suggestionList}>
                  <TouchableOpacity style={styles.suggestionItem}>
                    <View style={[styles.suggestionIcon, { backgroundColor: '#e9fdff' }]}>
                      <Text style={styles.suggestionIconText}>📦</Text>
                    </View>
                    <Text style={styles.suggestionLabel}>Track a Parcel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.suggestionItem}>
                    <View style={[styles.suggestionIcon, { backgroundColor: '#ffd1dc' }]}>
                      <Text style={styles.suggestionIconText}>💳</Text>
                    </View>
                    <Text style={styles.suggestionLabel}>Pay Invoice</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.suggestionItem}>
                    <View style={[styles.suggestionIcon, { backgroundColor: '#e2e2e9' }]}>
                      <Text style={styles.suggestionIconText}>📍</Text>
                    </View>
                    <Text style={styles.suggestionLabel}>Nearby Pickup</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.recentSearches}>
                <Text style={styles.searchSectionTitle}>RECENT SEARCHES</Text>
                <View style={styles.recentTags}>
                  <View style={styles.recentTag}><Text style={styles.recentTagText}>Express delivery</Text></View>
                  <View style={styles.recentTag}><Text style={styles.recentTagText}>Luna Glo Lamp</Text></View>
                  <View style={styles.recentTag}><Text style={styles.recentTagText}>Shipping rates</Text></View>
                </View>
              </View>
            </View>
          </BlurView>
        </View>
      )}

      {/* Side Drawer */}
      {drawerOpen && (
        <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={toggleDrawer}>
          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
            <BlurView intensity={40} tint="light" style={styles.drawerBlur}>
              <View style={styles.drawerOverlay} />
              <View style={styles.drawerContent}>
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Dreamy Life</Text>
                  <TouchableOpacity onPress={toggleDrawer}>
                    <Text style={styles.drawerClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <GlassPanel borderRadius={16} style={styles.userCard}>
                  <View style={styles.userRow}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>👤</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.userName}>{user?.username || 'User'}</Text>
                        {user?.isVerified ? (
                          <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                          </View>
                        ) : (
                          <View style={styles.notVerifiedBadge}>
                            <Text style={styles.notVerifiedBadgeText}>Not Verified</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.memberBadge}>
                        <Text style={styles.memberBadgeText}>⭐ {user?.memberStatus || 'user'}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.referRow}>
                    <Text style={styles.referLabel}>Refer: </Text>
                    <Text style={styles.referCode}>{user?.ownRefercode || 'N/A'}</Text>
                    <TouchableOpacity onPress={copyReferCode}>
                      <Text style={styles.copyIcon}>📋</Text>
                    </TouchableOpacity>
                  </View>
                </GlassPanel>

                {!user?.isVerified && (
                  <TouchableOpacity
                    style={styles.verifyNowBtn}
                    onPress={() => { toggleDrawer(); router.push('/membership'); }}
                  >
                    <Text style={styles.verifyNowIcon}>🔒</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.verifyNowText}>Verify Now</Text>
                      <Text style={styles.verifyNowSubtext}>Purchase a membership to verify your account</Text>
                    </View>
                    <Text style={styles.verifyNowArrow}>→</Text>
                  </TouchableOpacity>
                )}

                {user?.isVerified && (
                  <View style={styles.verifiedBanner}>
                    <Text style={styles.verifiedBannerIcon}>✅</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.verifiedBannerText}>Account Verified</Text>
                      <Text style={styles.verifiedBannerSubtext}>Your account is fully verified</Text>
                    </View>
                  </View>
                )}

                <View style={styles.drawerNav}>
                  <Text style={styles.drawerSectionTitle}>MAIN</Text>
                  <TouchableOpacity style={[styles.drawerItem, styles.drawerItemActive]}>
                    <Text style={styles.drawerItemIcon}>🏠</Text>
                    <Text style={styles.drawerItemTextActive}>Dashboard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); router.push('/social-feed'); }}>
                    <Text style={styles.drawerItemIcon}>📢</Text>
                    <Text style={styles.drawerItemText}>Social Feed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); router.push('/referral'); }}>
                    <Text style={styles.drawerItemIcon}>🔗</Text>
                    <Text style={styles.drawerItemText}>Referral</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); router.push('/membership'); }}>
                    <Text style={styles.drawerItemIcon}>💳</Text>
                    <Text style={styles.drawerItemText}>Membership</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); router.push('/wallet'); }}>
                    <Text style={styles.drawerItemIcon}>👛</Text>
                    <Text style={styles.drawerItemText}>Wallet</Text>
                  </TouchableOpacity>

                  <Text style={[styles.drawerSectionTitle, { marginTop: 16 }]}>VENDOR</Text>
                  {hasVendor === false ? (
                    <TouchableOpacity style={styles.drawerItem} onPress={() => { toggleDrawer(); router.push('/vendor/apply'); }}>
                      <Text style={styles.drawerItemIcon}>🏪</Text>
                      <Text style={styles.drawerItemText}>Become a Vendor</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.drawerItem}
                        onPress={() => setVendorExpanded(!vendorExpanded)}
                      >
                        <Text style={styles.drawerItemIcon}>🏪</Text>
                        <Text style={styles.drawerItemText}>Vendor</Text>
                        <Text style={styles.drawerArrow}>{vendorExpanded ? '▲' : '▼'}</Text>
                      </TouchableOpacity>
                      {vendorExpanded && (
                        <View style={styles.vendorSubMenu}>
                          <TouchableOpacity style={styles.vendorSubItem} onPress={() => { toggleDrawer(); router.push('/vendor/dashboard'); }}>
                            <Text style={styles.vendorSubIcon}>📊</Text>
                            <Text style={styles.vendorSubText}>Dashboard</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.vendorSubItem} onPress={() => { toggleDrawer(); router.push('/vendor/products'); }}>
                            <Text style={styles.vendorSubIcon}>📦</Text>
                            <Text style={styles.vendorSubText}>Inventory</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.vendorSubItem} onPress={() => { toggleDrawer(); router.push('/vendor/products/create'); }}>
                            <Text style={styles.vendorSubIcon}>➕</Text>
                            <Text style={styles.vendorSubText}>Add Product</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.vendorSubItem} onPress={() => { toggleDrawer(); router.push('/reseller-shop'); }}>
                            <Text style={styles.vendorSubIcon}>🛒</Text>
                            <Text style={styles.vendorSubText}>My Shop</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                  <Text style={styles.logoutText}>🚪 Log Out</Text>
                </TouchableOpacity>
                <Text style={styles.version}>v1.0.0</Text>
              </View>
            </BlurView>
          </Animated.View>
        </TouchableOpacity>
      )}

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  topBarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.4)' },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  topBarBtn: {
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
  topBarBtnText: { fontSize: 16 },
  walletPill: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
  },
  walletPillIcon: { fontSize: 14 },
  walletPillText: { fontSize: 12, fontWeight: '600', color: '#1c1b1b', letterSpacing: 0.5 },
  topBarRight: { flexDirection: 'row', gap: 8 },
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

  // Hero
  heroSection: { marginBottom: 20 },
  heroCard: { padding: 0, overflow: 'hidden' },
  heroInner: {
    aspectRatio: 21 / 9,
    backgroundColor: '#e5e2e1',
    position: 'relative',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(233,253,255,0.8)',
  },
  heroTextWrap: {
    position: 'absolute',
    left: 24,
    bottom: 24,
    right: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1b1b',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: { fontSize: 14, color: '#45474b' },

  // Primary Actions
  primaryGrid: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  primaryCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 3,
  },
  primaryIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  primaryEmoji: { fontSize: 20 },
  primaryLabel: { fontSize: 11, fontWeight: '600', color: '#1c1b1b', textAlign: 'center' },

  // Features Grid
  featuresSection: { marginBottom: 16, padding: 16 },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIconText: { fontSize: 20 },
  featureLabel: { fontSize: 10, fontWeight: '600', color: '#45474b', textAlign: 'center' },
  seeMoreBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  seeMoreText: { fontSize: 13, fontWeight: '600', color: '#45474b' },
  seeMoreIcon: { fontSize: 12, color: '#45474b' },

  // Support
  supportSection: { marginBottom: 16, padding: 16 },
  supportGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  supportItem: { alignItems: 'center', gap: 8, flex: 1 },
  supportIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  supportEmoji: { fontSize: 18 },
  supportLabel: { fontSize: 12, color: '#45474b', textAlign: 'center' },

  // Search Overlay
  searchOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  searchContainer: { flex: 1 },
  searchBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#f8f8ff' },
  searchContent: { padding: 20, flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 5,
  },
  searchBackBtn: { padding: 4 },
  searchBackText: { fontSize: 20, color: '#45474b' },
  searchInput: { flex: 1, fontSize: 16, color: '#1c1b1b' },
  searchCloseBtn: { padding: 4 },
  searchCloseText: { fontSize: 18, color: '#45474b' },
  searchSuggestions: { marginTop: 32 },
  searchSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#45474b',
    letterSpacing: 1.5,
    marginBottom: 16,
    paddingHorizontal: 8,
    opacity: 0.8,
  },
  suggestionList: { gap: 12 },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
  },
  suggestionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  suggestionIconText: { fontSize: 22 },
  suggestionLabel: { fontSize: 16, fontWeight: '600', color: '#1c1b1b' },
  recentSearches: { marginTop: 32 },
  recentTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 8 },
  recentTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.04,
    shadowRadius: 40,
    elevation: 2,
  },
  recentTagText: { fontSize: 14, color: '#45474b' },

  // Side Drawer
  drawerBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 60 },
  drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 320, zIndex: 61 },
  drawerBlur: { flex: 1, overflow: 'hidden' },
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)' },
  drawerContent: { flex: 1, padding: 24, paddingTop: 56 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  drawerTitle: { fontSize: 18, fontWeight: '700', color: '#5d5e64' },
  drawerClose: { fontSize: 18, color: '#45474b' },
  userCard: { marginBottom: 32, padding: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f8f8ff',
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  userAvatarText: { fontSize: 24 },
  userName: { fontSize: 18, fontWeight: '700', color: '#1c1b1b' },
  memberBadge: { marginTop: 4 },
  memberBadgeText: { fontSize: 11, fontWeight: '600', color: '#5d5e64' },
  verifiedBadge: {
    backgroundColor: 'rgba(45, 102, 109, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 102, 109, 0.3)',
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2d666d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notVerifiedBadge: {
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
  },
  notVerifiedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ba1a1a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  referRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  referLabel: { fontSize: 12, fontWeight: '600', color: '#45474b' },
  referCode: { color: '#5d5e64', letterSpacing: 2, fontSize: 12, fontWeight: '700' },
  copyIcon: { fontSize: 14, marginLeft: 8 },
  verifyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 102, 109, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 102, 109, 0.3)',
    borderStyle: 'dashed',
    gap: 12,
  },
  verifyNowIcon: { fontSize: 24 },
  verifyNowText: { fontSize: 15, fontWeight: '700', color: '#2d666d' },
  verifyNowSubtext: { fontSize: 11, color: '#45474b', marginTop: 2 },
  verifyNowArrow: { fontSize: 18, fontWeight: '700', color: '#2d666d' },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 102, 109, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 102, 109, 0.2)',
    gap: 12,
  },
  verifiedBannerIcon: { fontSize: 24 },
  verifiedBannerText: { fontSize: 15, fontWeight: '700', color: '#2d666d' },
  verifiedBannerSubtext: { fontSize: 11, color: '#45474b', marginTop: 2 },
  drawerNav: { flex: 1 },
  drawerSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(69,71,75,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  drawerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4, gap: 16 },
  drawerItemActive: { backgroundColor: '#f8f8ff' },
  drawerItemIcon: { fontSize: 18 },
  drawerItemText: { fontSize: 15, fontWeight: '600', color: '#45474b' },
  drawerItemTextActive: { fontSize: 15, fontWeight: '600', color: '#5d5e64' },
  drawerArrow: { fontSize: 12, color: '#45474b', marginLeft: 'auto' },
  vendorSubMenu: { paddingLeft: 20 },
  vendorSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 2,
    gap: 14,
  },
  vendorSubIcon: { fontSize: 15 },
  vendorSubText: { fontSize: 13, fontWeight: '600', color: '#5d5e64' },
  logoutBtn: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,218,214,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.1)',
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#ba1a1a' },
  version: { textAlign: 'center', fontSize: 10, color: 'rgba(69,71,75,0.4)', marginTop: 16 },
});
