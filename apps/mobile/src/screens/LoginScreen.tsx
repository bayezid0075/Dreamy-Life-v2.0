import React, { useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import AuroraBackground from '@/shared/components/AuroraBackground';
import GlassPanel from '@/shared/components/GlassPanel';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Login Failed', data.error?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }
      await AsyncStorage.setItem('accessToken', data.data.accessToken);
      router.replace('/dashboard');
    } catch (err) {
      Alert.alert('Connection Error', 'Please check your connection and try again');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <AuroraBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.centerWrap}>
          <Text style={styles.logo}>✨</Text>
          <Text style={styles.appName}>Dreamy Life</Text>
          <Text style={styles.tagline}>Welcome back to your elegant space</Text>

          <GlassPanel borderRadius={24} intensity={30} style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="rgba(69,71,75,0.4)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Password</Text>
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
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signinBtn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.signinBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.signupText}>
                Don't have an account? <Text style={styles.signupLink}>Create Account</Text>
              </Text>
            </TouchableOpacity>
          </GlassPanel>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8ff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  centerWrap: { alignItems: 'center' },
  logo: { fontSize: 48, marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: '800', color: '#1c1b1b', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#45474b', marginBottom: 32 },
  card: { width: '100%', padding: 24 },
  cardTitle: { fontSize: 24, fontWeight: '700', color: '#1c1b1b', marginBottom: 24, textAlign: 'center' },
  inputWrap: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#45474b', letterSpacing: 0.5, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 9999, paddingHorizontal: 20, paddingVertical: 14, fontSize: 16, color: '#1c1b1b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 12 },
  eyeIcon: { fontSize: 18 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { fontSize: 13, color: '#2d666d', fontWeight: '600' },
  signinBtn: { backgroundColor: '#1c1b1b', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  signinBtnText: { fontSize: 16, fontWeight: '600', color: 'white' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: '#45474b' },
  signupText: { textAlign: 'center', fontSize: 14, color: '#45474b' },
  signupLink: { fontWeight: '700', color: '#2d666d' },
});
