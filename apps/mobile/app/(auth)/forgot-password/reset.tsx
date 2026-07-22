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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { phone, otp } = useLocalSearchParams<{ phone: string; otp: string }>();
  const phoneNumber = phone || '';
  const otpCode = otp || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otpCode, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <AuroraBackground />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <Text style={styles.logoIcon}>✅</Text>
          </View>
          <Text style={styles.appName}>Password Reset</Text>
          <Text style={styles.tagline}>Your password has been reset successfully. You can now sign in with your new password.</Text>

          <GlassPanel borderRadius={24} style={styles.card}>
            <TouchableOpacity style={styles.submitBtn} onPress={() => router.replace('/login')}>
              <Text style={styles.submitBtnText}>Sign In →</Text>
            </TouchableOpacity>
          </GlassPanel>

          <Text style={styles.footer}>© 2026 Dreamy Life. All rights reserved.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <AuroraBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>🔒</Text>
        </View>
        <Text style={styles.appName}>Reset Password</Text>
        <Text style={styles.tagline}>Enter your new password</Text>

        <GlassPanel borderRadius={24} style={styles.card}>
          {/* General Error */}
          {error !== '' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* New Password */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>NEW PASSWORD</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="New Password"
                placeholderTextColor="rgba(198,198,203,1)"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Confirm Password"
                placeholderTextColor="rgba(198,198,203,1)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleResetPassword} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitBtnText}>Reset Password →</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Back to Login</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 20,
    gap: 8,
  },
  inputIcon: { fontSize: 18 },
  input: {
    height: 48,
    fontSize: 16,
    color: '#1c1b1b',
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },
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
  submitBtnText: { fontSize: 16, fontWeight: '700', color: 'white', letterSpacing: 0.5 },
  backBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#2d666d' },
  footer: { fontSize: 12, color: '#c6c6cb', textAlign: 'center', marginTop: 24 },
});
