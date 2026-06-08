import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLogin } from '../features/auth/api';
import { useAuthStore } from '../features/auth/useAuthStore';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { mutate: login, isPending } = useLogin();

  const handleLogin = () => {
    login({ email, password }, {
      onSuccess: (data) => {
        setAuth(data);
        router.replace('/home');
      },
      onError: (error: any) => {
        Alert.alert('Login Failed', error.response?.data?.error?.message || 'Something went wrong');
      }
    });
  };

  return (
    <StyledView className="flex-1 justify-center px-6 bg-white">
      <StyledText className="text-3xl font-bold text-center mb-8 text-gray-900">
        Welcome Back
      </StyledText>

      <StyledInput
        className="border border-gray-300 p-4 rounded-xl mb-4 text-gray-800"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <StyledInput
        className="border border-gray-300 p-4 rounded-xl mb-6 text-gray-800"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <StyledButton
        className="bg-blue-600 p-4 rounded-xl items-center"
        onPress={handleLogin}
        disabled={isPending}
      >
        <StyledText className="text-white font-bold text-lg">
          {isPending ? 'Signing in...' : 'Login'}
        </StyledText>
      </StyledButton>

      <StyledView className="flex-row justify-center mt-6">
        <StyledText className="text-gray-600">Don't have an account? </StyledText>
        <StyledTouchableOpacity onPress={() => router.push('/register')}>
          <StyledText className="text-blue-600 font-bold">Sign Up</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  );
}

const StyledTouchableOpacity = styled(TouchableOpacity);
