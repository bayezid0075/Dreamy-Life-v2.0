import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/shared/stores/authStore';
import AuroraBackground from '@/shared/components/AuroraBackground';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function RegisterScreen() {
  const router = useRouter();
  const { ref, returnUrl } = useLocalSearchParams<{ ref?: string; returnUrl?: string }>();
  const { setAuth, isAuthenticated, hydrated } = useAuthStore();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referCode, setReferCode] = useState(ref || '');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace(returnUrl ? (returnUrl as any) : '/dashboard');
    }
  }, [isAuthenticated, hydrated, returnUrl, router]);

  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phoneNumber: phone, password, referCode: referCode || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.error?.message || 'Registration failed' });
        setLoading(false);
        return;
      }
      await setAuth(data.data.accessToken, data.data.refreshToken, data.data.user);
      router.replace(returnUrl ? (returnUrl as any) : '/dashboard');
    } catch (err) {
      setErrors({ general: 'Connection error. Please try again.' });
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <AuroraBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>✨</Text>
        </View>
        <Text style={styles.appName}>Dreamy Life</Text>
        <Text style={styles.tagline}>Create your account to start your journey.</Text>

        <GlassPanel borderRadius={24} style={styles.card}>
          <Text style={styles.cardTitle}>Join Dreamy Life</Text>

          {/* General Error */}
          {errors.general && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          {/* Username */}
          <View style={styles.inputWrap}>
            <View style={[styles.inputRow, errors.username && styles.inputError]}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="rgba(198,198,203,1)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              {errors.username && <Text style={styles.inputErrorIcon}>⚠️</Text>}
            </View>
            {errors.username && <Text style={styles.errorMsg}>{errors.username}</Text>}
          </View>

          {/* Phone */}
          <View style={styles.inputWrap}>
            <View style={[styles.inputRow, errors.phone && styles.inputError]}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="rgba(198,198,203,1)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.inputErrorIcon}>⚠️</Text>}
            </View>
            {errors.phone && <Text style={styles.errorMsg}>{errors.phone}</Text>}
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <View style={[styles.inputRow, errors.password && styles.inputError]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="rgba(198,198,203,1)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorMsg}>{errors.password}</Text>}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputWrap}>
            <View style={[styles.inputRow, errors.confirmPassword && styles.inputError]}>
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
              {errors.confirmPassword && <Text style={styles.inputErrorIcon}>⚠️</Text>}
            </View>
            {errors.confirmPassword && <Text style={styles.errorMsg}>{errors.confirmPassword}</Text>}
          </View>

          {/* Referral Code */}
          <View style={styles.inputWrap}>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🎁</Text>
              <TextInput
                style={styles.input}
                placeholder="Referral Code (Optional)"
                placeholderTextColor="rgba(198,198,203,1)"
                value={referCode}
                onChangeText={setReferCode}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerBtnText}>Sign Up →</Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signinWrap}>
            <Text style={styles.signinText}>
              Already have an account?{' '}
              <Text style={styles.signinLink} onPress={() => router.replace('/login')}>
                Sign in
              </Text>
            </Text>
          </View>
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
  tagline: { fontSize: 14, color: '#45474b', textAlign: 'center', marginBottom: 24 },
  card: { width: '100%', padding: 24 },
  cardTitle: { fontSize: 24, fontWeight: '700', color: '#1c1b1b', marginBottom: 20, textAlign: 'center' },
  errorBanner: {
    backgroundColor: '#ffdad6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, fontWeight: '600', color: '#93000a', textAlign: 'center' },
  inputWrap: { marginBottom: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 8,
  },
  inputError: {
    backgroundColor: 'rgba(255,218,214,0.2)',
    borderColor: 'rgba(186,26,26,0.3)',
  },
  inputIcon: { fontSize: 18, color: '#76777b' },
  input: {
    height: 48,
    fontSize: 16,
    color: '#1c1b1b',
    flex: 1,
  },
  inputErrorIcon: { fontSize: 14, color: '#ba1a1a' },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },
  errorMsg: { fontSize: 12, fontWeight: '600', color: '#ba1a1a', paddingHorizontal: 20, marginTop: 4 },
  registerBtn: {
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
  registerBtnText: { fontSize: 16, fontWeight: '700', color: 'white', letterSpacing: 0.5 },
  signinWrap: { marginTop: 20 },
  signinText: { fontSize: 14, color: '#45474b', textAlign: 'center' },
  signinLink: { fontWeight: '700', color: '#2d666d' },
  footer: { fontSize: 12, color: '#c6c6cb', textAlign: 'center', marginTop: 24 },
});
