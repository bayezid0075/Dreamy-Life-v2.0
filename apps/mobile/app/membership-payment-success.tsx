import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function MembershipPaymentSuccessScreen() {
  const router = useRouter();
  const { invoice_id } = useLocalSearchParams<{ invoice_id: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!invoice_id) {
      setStatus('error');
      setMessage('No invoice ID found');
      return;
    }
    processPayment();
  }, [invoice_id]);

  const processPayment = async () => {
    try {
      const res = await fetch(`${API_URL}/membership/payment-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setMessage('Your membership has been activated successfully!');
      } else {
        setStatus('error');
        setMessage(data.data?.message || 'Payment processing failed');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Failed to process payment. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <View style={styles.content}>
        <GlassPanel borderRadius={20} style={styles.card}>
          {status === 'loading' && (
            <>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>⏳</Text>
              </View>
              <Text style={styles.title}>Processing Payment</Text>
              <Text style={styles.message}>Please wait while we verify your payment...</Text>
            </>
          )}
          {status === 'success' && (
            <>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🎉</Text>
              </View>
              <Text style={styles.title}>Payment Successful!</Text>
              <Text style={styles.message}>{message}</Text>
              {invoice_id && (
                <View style={styles.invoiceBox}>
                  <Text style={styles.invoiceLabel}>Invoice ID</Text>
                  <Text style={styles.invoiceId}>{invoice_id}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.btn} onPress={() => router.replace('/membership')}>
                <Text style={styles.btnText}>Go to Membership</Text>
              </TouchableOpacity>
            </>
          )}
          {status === 'error' && (
            <>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(186,26,26,0.1)' }]}>
                <Text style={styles.icon}>❌</Text>
              </View>
              <Text style={styles.title}>Payment Failed</Text>
              <Text style={styles.message}>{message}</Text>
              <TouchableOpacity style={styles.btn} onPress={() => router.replace('/membership')}>
                <Text style={styles.btnText}>Back to Membership</Text>
              </TouchableOpacity>
            </>
          )}
        </GlassPanel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, padding: 32, alignItems: 'center' },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(45, 102, 109, 0.1)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  icon: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#1c1b1b', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, color: '#45474b', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  invoiceBox: {
    width: '100%', backgroundColor: 'rgba(233,253,255,0.6)',
    borderRadius: 12, padding: 12, marginBottom: 24,
  },
  invoiceLabel: { fontSize: 11, color: '#45474b', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  invoiceId: { fontSize: 13, fontWeight: '700', color: '#1c1b1b', marginTop: 4, fontFamily: 'monospace' },
  btn: {
    width: '100%', paddingVertical: 14, borderRadius: 9999,
    backgroundColor: '#1c1b1b', alignItems: 'center',
  },
  btnText: { fontSize: 15, fontWeight: '600', color: 'white' },
});
