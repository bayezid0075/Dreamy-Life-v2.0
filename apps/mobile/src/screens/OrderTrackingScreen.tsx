import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const STATUS_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadOrder(); }, [id]);

  const loadOrder = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_URL}/reselling/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setOrder(data.data); }
    } catch { /* error */ }
    finally { setLoading(false); }
  };

  if (loading) return <View style={styles.loadingContainer}><AuroraBackground /><ActivityIndicator size="large" color="#5d5e64" /></View>;
  if (!order) return <View style={styles.container}><AuroraBackground /><TopBar title="Order" showBack showSearch={false} showNotification={false} /><View style={styles.emptyContainer}><Text style={{ fontSize: 48 }}>❌</Text><Text style={styles.emptyText}>Order not found</Text></View></View>;

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="Order Details" showBack showSearch={false} showNotification={false} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <GlassPanel borderRadius={16} style={styles.card}>
          <Text style={styles.productName}>{order.productName}</Text>
          <Text style={styles.shopName}>from {order.shopName}</Text>

          <View style={styles.tracker}>
            {STATUS_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <View style={[styles.stepCircle, i <= currentStep && styles.stepActive]}>
                  <Text style={[styles.stepText, i <= currentStep && styles.stepTextActive]}>{i < currentStep ? '✓' : i + 1}</Text>
                </View>
                {i < STATUS_STEPS.length - 1 && <View style={[styles.stepLine, i < currentStep && styles.lineActive]} />}
              </React.Fragment>
            ))}
          </View>
          <View style={styles.stepLabels}>
            {STATUS_STEPS.map(s => <Text key={s} style={styles.stepLabel}>{s}</Text>)}
          </View>
        </GlassPanel>

        <GlassPanel borderRadius={16} style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <InfoRow label="Name" value={order.customerName} />
          <InfoRow label="Phone" value={order.customerPhone} />
          {order.customerAltPhone && <InfoRow label="Alt Phone" value={order.customerAltPhone} />}
          <InfoRow label="Address" value={order.customerAddress} />
          <InfoRow label="Payment" value={order.paymentMethod?.replace('_', ' ')} />
        </GlassPanel>

        <GlassPanel borderRadius={16} style={styles.card}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <InfoRow label="Vendor Price" value={`$${order.vendorPrice?.toFixed(2)}`} />
          <InfoRow label="Your Price" value={`$${order.resellerPrice?.toFixed(2)}`} />
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>Your Profit</Text>
            <Text style={styles.profitValue}>${order.profit?.toFixed(2)}</Text>
          </View>
        </GlassPanel>

        {order.shipments?.length > 0 && (
          <GlassPanel borderRadius={16} style={styles.card}>
            <Text style={styles.sectionTitle}>Shipment</Text>
            {order.shipments[0].trackingNumber && <InfoRow label="Tracking #" value={order.shipments[0].trackingNumber} />}
            <InfoRow label="Carrier" value={order.shipments[0].carrier} />
            <InfoRow label="Status" value={order.shipments[0].status?.replace('_', ' ')} />
          </GlassPanel>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.2)' },
  label: { fontSize: 13, color: '#45474b' },
  value: { fontSize: 13, fontWeight: '600', color: '#1c1b1b', textTransform: 'capitalize' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8ff' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#45474b' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  card: { padding: 20 },
  productName: { fontSize: 18, fontWeight: '700', color: '#1c1b1b' },
  shopName: { fontSize: 13, color: '#45474b', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#5d5e64', marginBottom: 12 },
  tracker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingHorizontal: 16 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eae7e7', alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: '#2d666d' },
  stepText: { fontSize: 12, fontWeight: '700', color: '#45474b' },
  stepTextActive: { color: 'white' },
  stepLine: { flex: 1, height: 3, backgroundColor: '#eae7e7', marginHorizontal: 4, borderRadius: 2 },
  lineActive: { backgroundColor: '#2d666d' },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 8 },
  stepLabel: { fontSize: 10, color: '#45474b', textTransform: 'capitalize' },
  profitRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  profitLabel: { fontSize: 14, fontWeight: '700', color: '#2d666d' },
  profitValue: { fontSize: 16, fontWeight: '700', color: '#2d666d' },
});
