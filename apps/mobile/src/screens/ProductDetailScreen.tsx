import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resellerPrice, setResellerPrice] = useState('');
  const [showOrder, setShowOrder] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerAltPhone: '', customerAddress: '', paymentMethod: 'bkash' });
  const [ordering, setOrdering] = useState(false);

  useEffect(() => { if (id) loadProduct(); }, [id]);

  const loadProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/vendor/products/detail/${id}`);
      if (res.ok) { const data = await res.json(); setProduct(data.data); }
    } catch { /* error */ }
    finally { setLoading(false); }
  };

  const profit = product && resellerPrice ? Math.max(0, parseFloat(resellerPrice) - product.price) : 0;

  const handleOrder = async () => {
    if (!form.customerName || !form.customerPhone || !form.customerAddress) { Alert.alert('Error', 'Fill all required fields'); return; }
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    setOrdering(true);
    try {
      const res = await fetch(`${API_URL}/reselling/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, resellerPrice: parseFloat(resellerPrice), ...form }),
      });
      if (!res.ok) { const data = await res.json(); Alert.alert('Error', data.error?.message || 'Order failed'); return; }
      Alert.alert('Success', 'Order placed!', [{ text: 'OK', onPress: () => router.push('/reselling/orders') }]);
      setShowOrder(false);
    } catch { Alert.alert('Error', 'Connection failed'); }
    finally { setOrdering(false); }
  };

  if (loading) return <View style={styles.loadingContainer}><AuroraBackground /><ActivityIndicator size="large" color="#5d5e64" /></View>;
  if (!product) return <View style={styles.container}><AuroraBackground /><TopBar title="Product" showBack showSearch={false} showNotification={false} /><View style={styles.emptyContainer}><Text style={{ fontSize: 48 }}>❌</Text><Text style={styles.emptyText}>Product not found</Text></View></View>;

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title={product.name} showBack showSearch={false} showNotification={false} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <GlassPanel borderRadius={16} style={styles.imageContainer}>
          <Text style={{ fontSize: 64 }}>📷</Text>
        </GlassPanel>

        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>${product.price}</Text>
        <Text style={styles.productShop}>by {product.shopName}</Text>
        <Text style={styles.productDesc}>{product.description || 'No description available.'}</Text>
        <Text style={styles.productStock}>📦 {product.stock} units in stock</Text>

        <GlassPanel borderRadius={12} style={styles.resellerSection}>
          <Text style={styles.sectionTitle}>Reseller Pricing</Text>
          <Text style={styles.label}>Your Resale Price ($)</Text>
          <TextInput style={styles.input} value={resellerPrice} onChangeText={setResellerPrice} keyboardType="decimal-pad" placeholder="Enter your price" placeholderTextColor="rgba(69,71,75,0.5)" />
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>Potential Profit</Text>
            <Text style={styles.profitValue}>${profit.toFixed(2)}</Text>
          </View>
        </GlassPanel>

        {resellerPrice && parseFloat(resellerPrice) > product.price && (
          <TouchableOpacity style={styles.orderBtn} onPress={() => setShowOrder(true)}>
            <Text style={styles.orderBtnText}>Place Reseller Order</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {showOrder && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Customer Details</Text>
            <TextInput style={styles.input} value={form.customerName} onChangeText={v => setForm({ ...form, customerName: v })} placeholder="Customer Name *" placeholderTextColor="rgba(69,71,75,0.5)" />
            <TextInput style={styles.input} value={form.customerPhone} onChangeText={v => setForm({ ...form, customerPhone: v })} placeholder="Phone *" keyboardType="phone-pad" placeholderTextColor="rgba(69,71,75,0.5)" />
            <TextInput style={styles.input} value={form.customerAltPhone} onChangeText={v => setForm({ ...form, customerAltPhone: v })} placeholder="Alt Phone" keyboardType="phone-pad" placeholderTextColor="rgba(69,71,75,0.5)" />
            <TextInput style={[styles.input, { borderRadius: 12, height: 80 }]} value={form.customerAddress} onChangeText={v => setForm({ ...form, customerAddress: v })} placeholder="Address *" multiline placeholderTextColor="rgba(69,71,75,0.5)" />
            <View style={styles.profitBox}>
              <Text style={{ fontSize: 13, color: '#45474b' }}>Vendor: ${product.price} | Your: ${resellerPrice}</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#2d666d', marginTop: 4 }}>Profit: ${profit.toFixed(2)}</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowOrder(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, ordering && { opacity: 0.6 }]} onPress={handleOrder} disabled={ordering}>
                <Text style={styles.confirmBtnText}>{ordering ? 'Placing...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#45474b' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 20, paddingBottom: 40 },
  imageContainer: { height: 300, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  productName: { fontSize: 28, fontWeight: '800', color: '#1c1b1b', marginBottom: 8 },
  productPrice: { fontSize: 24, fontWeight: '700', color: '#5d5e64', marginBottom: 4 },
  productShop: { fontSize: 13, color: '#45474b', marginBottom: 12 },
  productDesc: { fontSize: 15, color: '#45474b', lineHeight: 24, marginBottom: 12 },
  productStock: { fontSize: 13, color: '#45474b', marginBottom: 20 },
  resellerSection: { padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#5d5e64', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#45474b', marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1c1b1b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', marginBottom: 12 },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  profitLabel: { fontSize: 14, color: '#45474b' },
  profitValue: { fontSize: 18, fontWeight: '700', color: '#2d666d' },
  orderBtn: { backgroundColor: '#2d666d', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  orderBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, justifyContent: 'flex-end', padding: 20, paddingBottom: 40 },
  modal: { backgroundColor: 'white', borderRadius: 20, padding: 24, gap: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1c1b1b', marginBottom: 8 },
  profitBox: { backgroundColor: '#e9fdff', borderRadius: 12, padding: 12, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderRadius: 9999, paddingVertical: 14, alignItems: 'center', backgroundColor: '#f0eded' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#45474b' },
  confirmBtn: { flex: 1, borderRadius: 9999, paddingVertical: 14, alignItems: 'center', backgroundColor: '#1c1b1b' },
  confirmBtnText: { fontSize: 14, fontWeight: '600', color: 'white' },
});
