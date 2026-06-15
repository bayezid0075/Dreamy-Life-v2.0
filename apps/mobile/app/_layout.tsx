import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="referral" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="membership" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="wallet-history" />
      <Stack.Screen name="funds-history" />
      <Stack.Screen name="points-history" />
    </Stack>
  );
}
