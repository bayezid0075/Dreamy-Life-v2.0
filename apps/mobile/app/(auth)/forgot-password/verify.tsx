import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const phoneNumber = phone || '';
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otpCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Invalid OTP');
        setLoading(false);
        return;
      }

      router.push(`/forgot-password/reset?phone=${encodeURIComponent(phoneNumber)}&otp=${encodeURIComponent(otpCode)}`);
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <AuroraBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>✅</Text>
        </View>
        <Text style={styles.appName}>Verify OTP</Text>
        <Text style={styles.tagline}>Enter the 6-digit code sent to {phoneNumber}</Text>

        <GlassPanel borderRadius={24} style={styles.card}>
          {/* General Error */}
          {error !== '' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* OTP Code */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>VERIFICATION CODE</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.otpInput}
                placeholder="000000"
                placeholderTextColor="rgba(198,198,203,1)"
                value={otpCode}
                onChangeText={(text) => setOtpCode(text.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
            </View>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.submitBtn, otpCode.length !== 6 && styles.submitBtnDisabled]}
            onPress={handleVerifyOtp}
            disabled={loading || otpCode.length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitBtnText}>Verify →</Text>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Didn't receive the code? Resend OTP</Text>
          </TouchableOpacity>
        </GlassPanel>

        <Text style={styles.footer}>© 2026 Dreamy Life. All rights reserved.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  logoIcon: { fontSize: 24 },
  appName: { fontSize: 28, fontWeight: '800', color: '#1c1b1b', letterSpacing: -0.5, textAlign: 'center' },
  tagline: { fontSize: 14, color: '#45474b', textAlign: 'center', marginBottom: 24, paddingHorizontal: 16 },
  card: { width: '100%', padding: 24 },
  errorBanner: {
    backgroundColor: '#ffdad6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, fontWeight: '600', color: '#93000a', textAlign: 'center' },
  inputWrap: { marginBottom: 16 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#1c1b1b', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  inputRow: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 20,
  },
  otpInput: {
    height: 56,
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1b1b',
    letterSpacing: 8,
  },
  submitBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#1c1b1b',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#c6c6cb',
  },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: 'white', letterSpacing: 0.5 },
  backBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#2d666d' },
  footer: { fontSize: 12, color: '#c6c6cb', textAlign: 'center', marginTop: 24 },
});
