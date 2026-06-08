import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegister } from '../features/auth/api';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);

export default function RegisterScreen() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const router = useRouter();
  const { mutate: register, isPending } = useRegister();

  const handleRegister = () => {
    register(form, {
      onSuccess: () => {
        Alert.alert('Success', 'Account created! Please verify your email.');
        router.replace('/');
      },
      onError: (error: any) => {
        Alert.alert('Registration Failed', error.response?.data?.error?.message || 'Something went wrong');
      }
    });
  };

  return (
    <StyledView className="flex-1 justify-center px-6 bg-white">
      <StyledText className="text-3xl font-bold text-center mb-8 text-gray-900">
        Create Account
      </StyledText>

      <StyledInput
        className="border border-gray-300 p-4 rounded-xl mb-4 text-gray-800"
        placeholder="Full Name"
        value={form.fullName}
        onChangeText={(text) => setForm({ ...form, fullName: text })}
      />

      <StyledInput
        className="border border-gray-300 p-4 rounded-xl mb-4 text-gray-800"
        placeholder="Email"
        value={form.email}
        onChangeText={(text) => setForm({ ...form, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <StyledInput
        className="border border-gray-300 p-4 rounded-xl mb-6 text-gray-800"
        placeholder="Password"
        value={form.password}
        onChangeText={(text) => setForm({ ...form, password: text })}
        secureTextEntry
      />

      <StyledButton
        className="bg-blue-600 p-4 rounded-xl items-center"
        onPress={handleRegister}
        disabled={isPending}
      >
        <StyledText className="text-white font-bold text-lg">
          {isPending ? 'Creating account...' : 'Sign Up'}
        </StyledText>
      </StyledButton>

      <StyledView className="flex-row justify-center mt-6">
        <StyledText className="text-gray-600">Already have an account? </StyledText>
        <StyledTouchableOpacity onPress={() => router.replace('/')}>
          <StyledText className="text-blue-600 font-bold">Login</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  );
}

const StyledTouchableOpacity = styled(TouchableOpacity);
