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

export default function LoginScreen() {
  const router = useRouter();
  const { returnUrl } = useLocalSearchParams<{ returnUrl?: string }>();
  const { setAuth, isAuthenticated, hydrated } = useAuthStore();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace(returnUrl ? (returnUrl as any) : '/dashboard');
    }
  }, [isAuthenticated, hydrated, returnUrl, router]);

  const handleLogin = async () => {
    if (!emailOrPhone.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }
      setAuth(data.data.accessToken, data.data.refreshToken, data.data.user);
      router.replace(returnUrl ? (returnUrl as any) : '/dashboard');
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <AuroraBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoIcon}>✨</Text>
          </View>
          <Text style={styles.appName}>Dreamy Life</Text>
        </View>

        {/* Card */}
        <GlassPanel borderRadius={24} style={styles.card}>
          {/* Avatar */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>

          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>Enter your credentials to access your account</Text>

          {/* Error */}
          {error !== '' && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email or Phone */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>EMAIL OR PHONE NUMBER</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Enter email or phone number"
                placeholderTextColor="rgba(69,71,75,0.4)"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your password"
                placeholderTextColor="rgba(69,71,75,0.4)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity style={styles.signinBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signinBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupWrap}>
            <Text style={styles.signupText}>
              Don't have an account?{' '}
              <Text style={styles.signupLink} onPress={() => router.push('/register')}>
                Sign up
              </Text>
            </Text>
          </View>
        </GlassPanel>

        {/* Footer */}
        <Text style={styles.footer}>© 2026 Dreamy Life. All rights reserved.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 24 },
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
    marginBottom: 12,
  },
  logoIcon: { fontSize: 24 },
  appName: { fontSize: 28, fontWeight: '800', color: '#1c1b1b', letterSpacing: -0.5 },
  card: { width: '100%', padding: 32, alignItems: 'center' },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarIcon: { fontSize: 36 },
  cardTitle: { fontSize: 24, fontWeight: '700', color: '#1c1b1b', marginBottom: 8, textAlign: 'center' },
  cardSubtitle: { fontSize: 14, color: '#45474b', textAlign: 'center', marginBottom: 24 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#ffdad6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  errorIcon: { fontSize: 16 },
  errorText: { fontSize: 13, fontWeight: '600', color: '#93000a', flex: 1 },
  inputWrap: { width: '100%', marginBottom: 16 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#1c1b1b', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  inputRow: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(118,119,123,0.2)',
    paddingHorizontal: 20,
  },
  input: {
    height: 56,
    fontSize: 16,
    color: '#1c1b1b',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(118,119,123,0.2)',
    paddingHorizontal: 20,
  },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 18 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20, marginTop: 4 },
  forgotText: { fontSize: 13, color: '#2d666d', fontWeight: '600' },
  signinBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#5d5e64',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  signinBtnText: { fontSize: 16, fontWeight: '700', color: 'white', letterSpacing: 0.5 },
  signupWrap: { marginTop: 24 },
  signupText: { fontSize: 14, color: '#45474b', textAlign: 'center' },
  signupLink: { fontWeight: '700', color: '#2d666d' },
  footer: { fontSize: 12, color: '#c6c6cb', textAlign: 'center', marginTop: 24 },
});
