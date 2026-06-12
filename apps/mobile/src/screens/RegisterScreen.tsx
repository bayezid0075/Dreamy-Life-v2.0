import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export default function RegisterScreen({ navigation, route }: any) {
  const refCode = route?.params?.ref || '';
  const [form, setForm] = useState({
    username: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    referCode: refCode,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!form.phoneNumber.trim()) errs.phoneNumber = 'Phone number is required';
    if (form.password.length < 6) errs.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          phoneNumber: form.phoneNumber,
          password: form.password,
          referCode: form.referCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Registration Failed', data.error?.message || 'Something went wrong');
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem('accessToken', data.data.accessToken);
      navigation?.replace('Dashboard');
    } catch (err) {
      Alert.alert('Connection Error', 'Please check your connection');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🌸</Text>
          </View>
          <Text style={styles.title}>Join Dreamy Life</Text>
          <Text style={styles.subtitle}>Create your account to start your journey.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <View style={[styles.inputWrapper, errors.username && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#45474b80"
                value={form.username}
                onChangeText={(t) => setForm({ ...form, username: t })}
                autoCapitalize="none"
              />
            </View>
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <View style={[styles.inputWrapper, errors.phoneNumber && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#45474b80"
                value={form.phoneNumber}
                onChangeText={(t) => setForm({ ...form, phoneNumber: t })}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                placeholder="Password"
                placeholderTextColor="#45474b80"
                value={form.password}
                onChangeText={(t) => setForm({ ...form, password: t })}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <View style={[styles.passwordWrapper, errors.confirmPassword && styles.inputError]}>
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                placeholder="Confirm Password"
                placeholderTextColor="#45474b80"
                value={form.confirmPassword}
                onChangeText={(t) => setForm({ ...form, confirmPassword: t })}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                <Text>{showConfirm ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Referral Code (Optional)"
              placeholderTextColor="#45474b80"
              value={form.referCode}
              onChangeText={(t) => setForm({ ...form, referCode: t })}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>Sign Up</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation?.navigate('Login')}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8ff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1b1b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#45474b',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 4,
  },
  inputWrapper: {
    borderRadius: 28,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  inputError: {
    backgroundColor: 'rgba(255, 218, 214, 0.2)',
    borderColor: 'rgba(186, 26, 26, 0.3)',
  },
  input: {
    height: 52,
    fontSize: 16,
    color: '#1c1b1b',
  },
  passwordWrapper: {
    borderRadius: 28,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 20,
    top: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ba1a1a',
    paddingLeft: 24,
  },
  submitBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1c1b1b',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 16,
    color: '#45474b',
  },
  footerLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d666d',
  },
});
