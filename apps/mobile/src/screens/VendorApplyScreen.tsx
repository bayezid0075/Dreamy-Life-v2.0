import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const VENDOR_TERMS = [
  {
    title: 'Shop Responsibilities',
    items: [
      'Maintain accurate product listings with up-to-date inventory',
      'Provide honest and detailed product descriptions',
      'Set fair and competitive pricing for all listed items',
      'Respond to customer inquiries within 24 hours',
    ],
  },
  {
    title: 'Product Quality Standards',
    items: [
      'All products must meet Dreamy Life quality guidelines',
      'No counterfeit, prohibited, or restricted items allowed',
      'Proper packaging and labeling is required for all orders',
      'Product images must accurately represent the actual item',
    ],
  },
  {
    title: 'Payment & Fees',
    items: [
      'One-time vendorship fee: Tk 700 (free for VVIP members)',
      'Platform commission applies on each completed sale',
      'Payments are processed securely via UddoktaPay',
      'Payouts are transferred to your registered account',
    ],
  },
  {
    title: 'Order Fulfillment',
    items: [
      'Process and ship orders within the stated delivery timeframe',
      'Handle returns and refunds according to platform policy',
      'Maintain responsive communication with buyers',
      'Provide tracking information for all shipped orders',
    ],
  },
  {
    title: 'Termination',
    items: [
      'Dreamy Life reserves the right to suspend vendors violating terms',
      'Vendors may voluntarily deactivate their shop at any time',
      'Upon termination, pending orders must be fulfilled or refunded',
      'Repeated policy violations will result in permanent ban',
    ],
  },
];

export default function VendorApplyScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'terms' | 'form'>('terms');
  const [agreed, setAgreed] = useState(false);
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [vvipStatus, setVvipStatus] = useState<boolean | null>(null);

  useEffect(() => {
    if (step === 'form') {
      checkVvip();
    }
  }, [step]);

  const checkVvip = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) { router.replace('/login'); return; }
    try {
      const res = await fetch(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setVvipStatus(data.data.user.memberStatus === 'vvip');
      }
    } catch { setVvipStatus(false); }
  };

  const handleApply = async () => {
    if (!shopName.trim() || !address.trim()) { Alert.alert('Error', 'Please fill in all required fields'); return; }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/vendor/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shopName, address, bannerUrl: bannerUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data.error?.message || 'Failed to apply'); return; }
      if (data.data.paymentUrl) {
        Alert.alert('Payment', 'You will be redirected to payment page');
      } else {
        Alert.alert('Success', 'Vendor profile created!', [{ text: 'OK', onPress: () => router.replace('/vendor/dashboard') }]);
      }
    } catch { Alert.alert('Error', 'Connection failed'); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar
        title="Become a Vendor"
        showBack
        onBack={() => (step === 'form' ? setStep('terms') : router.back())}
        showSearch={false}
        showNotification={false}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Vendor Icon */}
        <View style={styles.iconSection}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🏪</Text>
          </View>
          <Text style={styles.iconTitle}>
            {step === 'terms' ? 'Vendor Agreement' : 'Application Form'}
          </Text>
          <Text style={styles.iconDesc}>
            {step === 'terms'
              ? 'Please review and accept the terms before proceeding'
              : 'Fill in your shop details to get started'}
          </Text>
        </View>

        {/* Step 1: Terms */}
        {step === 'terms' && (
          <View style={styles.termsWrapper}>
            <GlassPanel borderRadius={16} style={styles.termsCard}>
              <ScrollView style={styles.termsScroll} nestedScrollEnabled>
                {VENDOR_TERMS.map((section, idx) => (
                  <View key={idx} style={styles.termsSection}>
                    <View style={styles.termsSectionHeader}>
                      <View style={styles.sectionNumber}>
                        <Text style={styles.sectionNumberText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.termsSectionTitle}>{section.title}</Text>
                    </View>
                    <View style={styles.termsItems}>
                      {section.items.map((item, i) => (
                        <View key={i} style={styles.termItem}>
                          <Text style={styles.termBullet}>•</Text>
                          <Text style={styles.termItemText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </GlassPanel>

            {/* Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I have read and agree to the{' '}
                <Text style={styles.checkboxLabelText}>Vendor Terms & Conditions</Text>{' '}
                of Dreamy Life marketplace
              </Text>
            </TouchableOpacity>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.continueBtn, !agreed && styles.continueBtnDisabled]}
                onPress={() => agreed && setStep('form')}
                disabled={!agreed}
                activeOpacity={0.7}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2: Form */}
        {step === 'form' && (
          <View style={styles.formWrapper}>
            <GlassPanel borderRadius={16} style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View style={styles.statusIcon}>
                  <Text style={{ fontSize: 24 }}>🏪</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>Vendor Application</Text>
                  <Text style={styles.statusDesc}>
                    {vvipStatus === null ? 'Checking membership...' : vvipStatus ? 'VVIP - Free vendorship!' : 'Fee: Tk 700 (UddoktaPay)'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setStep('terms')}>
                <Text style={styles.reviewTermsLink}>Review Terms & Conditions</Text>
              </TouchableOpacity>
            </GlassPanel>

            <GlassPanel borderRadius={16} style={styles.formCard}>
              <Text style={styles.label}>Shop Name *</Text>
              <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder="e.g. Premium Store" placeholderTextColor="rgba(69,71,75,0.5)" />

              <Text style={styles.label}>Shop Address *</Text>
              <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="House 12, Road 5, Dhaka" placeholderTextColor="rgba(69,71,75,0.5)" />

              <Text style={styles.label}>Banner URL (optional)</Text>
              <TextInput style={styles.input} value={bannerUrl} onChangeText={setBannerUrl} placeholder="https://example.com/banner.jpg" placeholderTextColor="rgba(69,71,75,0.5)" />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, (loading || vvipStatus === null) && { opacity: 0.6 }]}
                  onPress={handleApply}
                  disabled={loading || vvipStatus === null}
                  activeOpacity={0.7}
                >
                  <Text style={styles.submitBtnText}>
                    {loading ? 'Processing...' : vvipStatus ? 'Create Vendor Profile (Free)' : 'Pay Tk 700 & Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassPanel>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  scroll: { flex: 1 },
  content: { paddingTop: 110, paddingHorizontal: 20, paddingBottom: 40 },

  // Icon section
  iconSection: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#e9fdff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, shadowColor: '#2d666d', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  iconEmoji: { fontSize: 36 },
  iconTitle: { fontSize: 22, fontWeight: '700', color: '#1c1b1b', textAlign: 'center' },
  iconDesc: { fontSize: 13, color: '#45474b', marginTop: 4, textAlign: 'center' },

  // Terms
  termsWrapper: { gap: 16 },
  termsCard: { padding: 16, maxHeight: 400 },
  termsScroll: { flex: 1 },
  termsSection: { marginBottom: 20 },
  termsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionNumber: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#2d666d', alignItems: 'center', justifyContent: 'center',
  },
  sectionNumberText: { color: 'white', fontSize: 12, fontWeight: '700' },
  termsSectionTitle: { fontSize: 15, fontWeight: '700', color: '#1c1b1b' },
  termsItems: { marginLeft: 34, gap: 6 },
  termItem: { flexDirection: 'row', gap: 8 },
  termBullet: { color: '#2d666d', fontSize: 14, fontWeight: '600', marginTop: 1 },
  termItemText: { fontSize: 13, color: '#45474b', lineHeight: 20, flex: 1 },

  // Checkbox
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 4 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#c6c6cb', alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: '#2d666d', borderColor: '#2d666d' },
  checkmark: { color: 'white', fontSize: 14, fontWeight: '700' },
  checkboxLabel: { fontSize: 13, color: '#45474b', lineHeight: 20, flex: 1 },
  checkboxLabelText: { fontWeight: '600', color: '#2d666d' },

  // Terms actions
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },

  // Form
  formWrapper: { gap: 16 },
  statusCard: { padding: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statusIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e9fdff', alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 16, fontWeight: '700', color: '#1c1b1b' },
  statusDesc: { fontSize: 13, color: '#45474b', marginTop: 2 },
  reviewTermsLink: { fontSize: 12, fontWeight: '600', color: '#2d666d', marginTop: 8 },
  formCard: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#5d5e64', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 9999, paddingHorizontal: 20, paddingVertical: 14, fontSize: 15, color: '#1c1b1b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', marginBottom: 16 },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },

  // Shared buttons
  cancelBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 9999,
    paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelBtnText: { color: '#1c1b1b', fontSize: 15, fontWeight: '600' },
  continueBtn: {
    flex: 1, backgroundColor: '#1c1b1b', borderRadius: 9999,
    paddingVertical: 16, alignItems: 'center',
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  submitBtn: { flex: 1, backgroundColor: '#1c1b1b', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
});
