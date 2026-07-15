import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { useAuthStore } from '@/shared/stores/authStore';
import { authFetch } from '@/shared/api';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import TopBar from '@/shared/components/TopBar';
import GlassPanel from '@/shared/components/GlassPanel';
import { useI18n } from '@/shared/i18n';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function VendorApplyScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { isAuthenticated, accessToken } = useAuthStore();

  const VENDOR_TERMS = [
    {
      title: t('shopResponsibilitiesTitle'),
      items: [
        t('maintainAccurateListings'),
        t('provideHonestDescriptions'),
        t('setFairPricing'),
        t('respondToInquiries'),
      ],
    },
    {
      title: t('productQualityStandardsTitle'),
      items: [
        t('meetQualityGuidelines'),
        t('noCounterfeitItems'),
        t('properPackaging'),
        t('accurateImages'),
      ],
    },
    {
      title: t('paymentFeesTitle'),
      items: [
        t('oneTimeVendorshipFee'),
        t('platformCommission'),
        t('securePayments'),
        t('payoutToAccount'),
      ],
    },
    {
      title: t('orderFulfillmentTitle'),
      items: [
        t('processAndShipOrders'),
        t('handleReturns'),
        t('responsiveCommunication'),
        t('provideTrackingInfo'),
      ],
    },
    {
      title: t('terminationTitle'),
      items: [
        t('suspendVendors'),
        t('voluntaryDeactivate'),
        t('fulfillOrRefund'),
        t('permanentBan'),
      ],
    },
  ];
  const [step, setStep] = useState<'terms' | 'form'>('terms');
  const [agreed, setAgreed] = useState(false);
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [vvipStatus, setVvipStatus] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (step === 'form') {
      checkVvip();
    }
  }, [step]);

  const checkVvip = async () => {
    if (!accessToken) { router.replace('/login'); return; }
    try {
      const res = await authFetch(`${API_URL}/auth/profile`);
      if (res.ok) {
        const data = await res.json();
        setVvipStatus(data.data.user.memberStatus === 'vvip');
      }
    } catch { setVvipStatus(false); }
  };

  const handleApply = async () => {
    if (!shopName.trim() || !address.trim()) { Alert.alert(t('error'), t('pleaseSelectImageFile')); return; }
    setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/vendor/apply`, {
        method: 'POST',
        body: JSON.stringify({ shopName, address, bannerUrl: bannerUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert(t('error'), data.error?.message || t('failedToApply')); return; }
      if (data.data.paymentUrl) {
        Alert.alert(t('vendorApplication'), t('vendorPaymentRedirect'));
      } else {
        Alert.alert(t('success'), t('vendorProfileCreated'), [{ text: 'OK', onPress: () => router.replace('/vendor/dashboard') }]);
      }
    } catch { Alert.alert(t('error'), t('connectionFailed')); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <TopBar
        title={t('becomeAVendor')}
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
            {step === 'terms' ? t('vendorAgreement') : t('applicationForm')}
          </Text>
          <Text style={styles.iconDesc}>
            {step === 'terms'
              ? t('reviewAndAcceptTerms')
              : t('fillShopDetails')}
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
                {t('agreedToTerms')}{' '}
                <Text style={styles.checkboxLabelText}>{t('vendorTermsAndConditions')}</Text>{' '}
                {t('vendorMarketplaceOf')}
              </Text>
            </TouchableOpacity>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.continueBtn, !agreed && styles.continueBtnDisabled]}
                onPress={() => agreed && setStep('form')}
                disabled={!agreed}
                activeOpacity={0.7}
              >
                <Text style={styles.continueBtnText}>{t('continue')}</Text>
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
                  <Text style={styles.statusTitle}>{t('vendorApplication')}</Text>
                  <Text style={styles.statusDesc}>
                    {vvipStatus === null ? t('checkingMembership') : vvipStatus ? t('vvipFreeVendorship') : t('feeOneTime')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setStep('terms')}>
                <Text style={styles.reviewTermsLink}>{t('reviewTermsAndConditions')}</Text>
              </TouchableOpacity>
            </GlassPanel>

            <GlassPanel borderRadius={16} style={styles.formCard}>
              <Text style={styles.label}>{t('shopName')}</Text>
              <TextInput style={styles.input} value={shopName} onChangeText={setShopName} placeholder={t('shopNamePlaceholder')} placeholderTextColor="rgba(69,71,75,0.5)" />

              <Text style={styles.label}>{t('shopAddress')}</Text>
              <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder={t('shopAddressPlaceholder')} placeholderTextColor="rgba(69,71,75,0.5)" />

              <Text style={styles.label}>{t('uploadShopBanner')}</Text>
              <TextInput style={styles.input} value={bannerUrl} onChangeText={setBannerUrl} placeholder={t('dragDropOrClick')} placeholderTextColor="rgba(69,71,75,0.5)" />

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, (loading || vvipStatus === null) && { opacity: 0.6 }]}
                  onPress={handleApply}
                  disabled={loading || vvipStatus === null}
                  activeOpacity={0.7}
                >
                  <Text style={styles.submitBtnText}>
                    {loading ? t('processing') : vvipStatus ? t('createVendorProfileFree') : t('payAndCreateVendorProfile')}
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
