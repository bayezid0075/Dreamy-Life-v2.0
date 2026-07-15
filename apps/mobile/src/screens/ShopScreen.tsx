import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import AuroraBackground from '@/shared/components/AuroraBackground';
import GlassPanel from '@/shared/components/GlassPanel';
import { useI18n } from '@/shared/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function ShopScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const CATEGORIES = [
    { key: '', label: t('all') },
    { key: 'home_decor', label: t('homeDecor') },
    { key: 'furniture', label: t('furniture') },
    { key: 'lighting', label: t('lighting') },
    { key: 'textiles', label: t('textiles') },
  ];
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => { loadProducts(); }, [category]);

  const loadProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      const res = await fetch(`${API_URL}/vendor/feed?${params.toString()}`);
      if (res.ok) { const data = await res.json(); setProducts(data.data || []); }
    } catch { /* error */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadProducts(); }, [category, search]);

  const handleSearch = () => { setSearch(searchInput); loadProducts(); };

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/reseller-shop/${item.id}` as any)}
    >
      <View style={styles.productImage}>
        {item.imageUrls?.[0] ? (
          <Text style={{ fontSize: 32 }}>📷</Text>
        ) : (
          <Text style={{ fontSize: 32, opacity: 0.3 }}>🖼️</Text>
        )}
        {item.stock <= 0 && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>{t('outOfStock')}</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.shopName} numberOfLines={1}>{item.shopName}</Text>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>${item.price}</Text>
          <Text style={styles.categoryBadge}>{item.category?.replace('_', ' ')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <AuroraBackground />
        <ActivityIndicator size="large" color="#5d5e64" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />

      {/* Header */}
      <BlurView intensity={40} tint="light" style={styles.header}>
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('shopTitle')}</Text>
          <TouchableOpacity onPress={() => router.push('/reselling/orders' as any)} style={styles.ordersBtn}>
            <Text style={styles.ordersBtnText}>🛍️</Text>
          </TouchableOpacity>
        </View>
      </BlurView>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5d5e64" />}
        ListHeaderComponent={
          <>
            {/* Search */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  value={searchInput}
                  onChangeText={setSearchInput}
                  onSubmitEditing={handleSearch}
                  placeholder={t('searchProducts')}
                  placeholderTextColor="rgba(69,71,75,0.5)"
                  returnKeyType="search"
                />
                {searchInput.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchInput(''); setSearch(''); loadProducts(); }}>
                    <Text style={styles.clearText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Categories */}
            <FlatList
              data={CATEGORIES}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              keyExtractor={(item) => item.key}
              renderItem={({ item: c }) => (
                <TouchableOpacity
                  style={[styles.categoryChip, category === c.key && styles.categoryChipActive]}
                  onPress={() => setCategory(c.key)}
                >
                  <Text style={[styles.categoryText, category === c.key && styles.categoryTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {products.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 48 }}>📦</Text>
                <Text style={styles.emptyTitle}>{t('noProductsFound')}</Text>
              </View>
            )}
          </>
        }
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40, overflow: 'hidden',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.4)' },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 44, paddingBottom: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 20, color: '#45474b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1c1b1b' },
  ordersBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  ordersBtnText: { fontSize: 16 },

  content: { paddingTop: 100, paddingHorizontal: 16, paddingBottom: 120 },

  // Search
  searchContainer: { marginBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#1c1b1b' },
  clearText: { fontSize: 14, color: '#45474b', padding: 4 },

  // Categories
  categoryList: { gap: 8, paddingBottom: 16 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryChipActive: { backgroundColor: 'rgba(45,102,109,0.15)', borderColor: 'rgba(45,102,109,0.2)' },
  categoryText: { fontSize: 12, fontWeight: '600', color: '#1c1b1b' },
  categoryTextActive: { color: '#2d666d' },

  // Grid
  row: { gap: 12, marginBottom: 12 },
  productCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  productImage: {
    width: '100%', aspectRatio: 1, backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  outOfStockBadge: {
    position: 'absolute', top: 8, left: 8, right: 8,
    backgroundColor: 'rgba(255,218,214,0.9)', borderRadius: 8, paddingVertical: 4, alignItems: 'center',
  },
  outOfStockText: { fontSize: 10, fontWeight: '600', color: '#93000a' },
  productInfo: { padding: 10 },
  shopName: { fontSize: 10, color: '#45474b', opacity: 0.7, marginBottom: 2 },
  productName: { fontSize: 12, fontWeight: '700', color: '#1c1b1b', marginBottom: 6 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontSize: 14, fontWeight: '700', color: '#2d666d' },
  categoryBadge: { fontSize: 9, color: '#45474b', backgroundColor: 'rgba(234,231,231,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1c1b1b' },
});
