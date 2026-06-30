import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4080';

export default function PostJobScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'single' | 'multiple'>('single');
  const [amount, setAmount] = useState('');
  const [unitPay, setUnitPay] = useState('');
  const [totalUnits, setTotalUnits] = useState('1');
  const [loading, setLoading] = useState(false);
  const [fundsBalance, setFundsBalance] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('accessToken').then((t) => {
      setToken(t);
      if (t) fetchWallet(t);
    });
  }, []);

  const fetchWallet = async (t: string) => {
    try {
      const res = await fetch(`${API_URL}/wallet`, { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const data = await res.json();
        setFundsBalance(data.data?.wallet?.fundsBalance || 0);
      }
    } catch (err) {
      console.error('Failed to fetch wallet', err);
    }
  };

  const handlePost = async () => {
    if (!token) return;
    if (!title.trim()) return Alert.alert('Error', 'Title is required');
    if (!description.trim()) return Alert.alert('Error', 'Description is required');
    if (!amount || parseFloat(amount) <= 0) return Alert.alert('Error', 'Valid amount is required');
    if (!unitPay || parseFloat(unitPay) <= 0) return Alert.alert('Error', 'Valid unit pay is required');

    const amountNum = parseFloat(amount);
    const unitPayNum = parseFloat(unitPay);
    const totalUnitsNum = type === 'single' ? 1 : parseInt(totalUnits) || 1;

    if (unitPayNum > amountNum) {
      return Alert.alert('Error', 'Unit pay cannot exceed total amount');
    }

    if (amountNum > fundsBalance) {
      return Alert.alert('Error', 'Insufficient funds balance');
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/marketplace/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          amount: amountNum,
          unitPay: unitPayNum,
          totalUnits: totalUnitsNum,
        }),
      });

      if (res.ok) {
        Alert.alert('Success', 'Job posted successfully! Waiting for admin approval.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Failed to post job');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar title="Post a Job" showBack showSearch={false} showNotification={false} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Funds</Text>
          <Text style={styles.balanceAmount}>৳{fundsBalance.toFixed(2)}</Text>
        </View>

        <Text style={styles.label}>Job Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Design a logo for my brand"
          placeholderTextColor="#76777b"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the job requirements..."
          placeholderTextColor="#76777b"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Job Type</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'single' && styles.activeTypeBtn]}
            onPress={() => setType('single')}
          >
            <Text style={[styles.typeBtnText, type === 'single' && styles.activeTypeBtnText]}>
              Single Unit
            </Text>
            <Text style={styles.typeHint}>Bid system</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'multiple' && styles.activeTypeBtn]}
            onPress={() => setType('multiple')}
          >
            <Text style={[styles.typeBtnText, type === 'multiple' && styles.activeTypeBtnText]}>
              Multiple Unit
            </Text>
            <Text style={styles.typeHint}>Assign workers</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Total Amount (৳)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#76777b"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Pay Per Unit (৳)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#76777b"
          value={unitPay}
          onChangeText={setUnitPay}
          keyboardType="decimal-pad"
        />

        {type === 'multiple' && (
          <>
            <Text style={styles.label}>Total Units</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor="#76777b"
              value={totalUnits}
              onChangeText={setTotalUnits}
              keyboardType="number-pad"
            />
          </>
        )}

        {amount && unitPay && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Cost Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount:</Text>
              <Text style={styles.summaryValue}>৳{parseFloat(amount || '0').toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Per Unit:</Text>
              <Text style={styles.summaryValue}>৳{parseFloat(unitPay || '0').toFixed(2)}</Text>
            </View>
            {type === 'multiple' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Units:</Text>
                <Text style={styles.summaryValue}>{totalUnits || '1'}</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.disabledBtn]}
          onPress={handlePost}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Post Job</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  content: { padding: 16, paddingTop: 110, paddingBottom: 40 },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center',
  },
  balanceLabel: { fontSize: 13, color: '#76777b', marginBottom: 4 },
  balanceAmount: { fontSize: 24, fontWeight: '700', color: '#1c1b1b' },
  label: { fontSize: 14, fontWeight: '600', color: '#1c1b1b', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 15, color: '#1c1b1b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeContainer: { flexDirection: 'row', gap: 12 },
  typeBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center',
  },
  activeTypeBtn: { backgroundColor: '#1c1b1b', borderColor: '#1c1b1b' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#45474b' },
  activeTypeBtnText: { color: '#ffffff' },
  typeHint: { fontSize: 11, color: '#76777b', marginTop: 4 },
  summaryCard: {
    backgroundColor: 'rgba(233,253,255,0.4)', borderRadius: 12, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: 'rgba(233,253,255,0.3)',
  },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: '#2d666d', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontSize: 13, color: '#45474b' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#1c1b1b' },
  submitBtn: {
    backgroundColor: '#2d666d', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  disabledBtn: { opacity: 0.6 },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
