import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '@/shared/stores/authStore';
import { authFetch } from '@/shared/api';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function VendorProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated]);

  useEffect(() => { if (isAuthenticated) loadProducts(); }, [isAuthenticated]);

  const loadProducts = async () => {
    if (!accessToken) { router.replace('/login'); return; }
    try {
      const res = await authFetch(`${API_URL}/vendor/products`);
      if (res.ok) { const data = await res.json(); setProducts(data.data || []); }
    } catch { /* error */ }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await authFetch(`${API_URL}/vendor/products/${id}`, { method: 'DELETE' });
        loadProducts();
      }},
    ]);
  };

  if (loading) {
    return <View style={styles.loadingContainer}><AuroraBackground /><ActivityIndicator size="large" color="#5d5e64" /></View>;
  }

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="Inventory" showBack showSearch={false} showNotification={false}
        rightAction={
          <TouchableOpacity onPress={() => router.push('/vendor/products/create')} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        } />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 56 }]}>
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text style={styles.emptyTitle}>No Products Yet</Text>
            <TouchableOpacity style={styles.submitBtn} onPress={() => router.push('/vendor/products/create')}>
              <Text style={styles.submitBtnText}>Add Your First Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map((product: any) => (
              <GlassPanel key={product.id} borderRadius={12} style={styles.productCard}>
                <View style={styles.productImage}>
                  {product.imageUrls?.[0] ? (
                    <Text style={{ fontSize: 32 }}>📷</Text>
                  ) : (
                    <Text style={{ fontSize: 32, opacity: 0.3 }}>🖼️</Text>
                  )}
                  <View style={[styles.stockBadge, product.stock > 0 ? styles.inStock : styles.outOfStock]}>
                    <Text style={styles.stockBadgeText}>{product.stock > 0 ? 'In Stock' : 'Out'}</Text>
                  </View>
                </View>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                {product.discountPrice ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.productPrice, { textDecorationLine: 'line-through', opacity: 0.5 }]}>৳{product.actualPrice}</Text>
                    <Text style={styles.productPrice}>৳{product.discountPrice}</Text>
                  </View>
                ) : (
                  <Text style={styles.productPrice}>৳{product.actualPrice}</Text>
                )}
                <Text style={styles.productSku}>#{product.sku}</Text>
                <Text style={styles.productStock}>{product.stock} units</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/vendor/products/${product.id}`)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(product.id)}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </GlassPanel>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1c1b1b' },
  addBtn: { backgroundColor: '#1c1b1b', borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 6 },
  addBtnText: { color: 'white', fontSize: 12, fontWeight: '600' },
  grid: { gap: 16 },
  productCard: { padding: 16 },
  productImage: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative' },
  stockBadge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  inStock: { backgroundColor: 'rgba(233,253,255,0.8)' },
  outOfStock: { backgroundColor: 'rgba(255,218,214,0.8)' },
  stockBadgeText: { fontSize: 10, fontWeight: '600', color: '#1c1b1b' },
  productName: { fontSize: 15, fontWeight: '700', color: '#1c1b1b', marginBottom: 4 },
  productPrice: { fontSize: 18, fontWeight: '700', color: '#2d666d' },
  productSku: { fontSize: 11, color: '#45474b', opacity: 0.6, marginTop: 2 },
  productStock: { fontSize: 12, color: '#45474b', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#1c1b1b' },
  deleteBtn: { width: 40, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  deleteBtnText: { fontSize: 14 },
  submitBtn: { backgroundColor: '#1c1b1b', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  submitBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
});
