import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider } from '@/shared/i18n';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="social-feed" />
          <Stack.Screen name="posts/create" />
          <Stack.Screen name="posts/[id]" />
          <Stack.Screen name="comments/[postId]" />
          <Stack.Screen name="users/[id]" />
          <Stack.Screen name="referral" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="settings/language" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="membership" />
          <Stack.Screen name="membership-payment-success" />
          <Stack.Screen name="wallet" />
          <Stack.Screen name="wallet-history" />
          <Stack.Screen name="funds-history" />
          <Stack.Screen name="points-history" />
          <Stack.Screen name="friends" />
          <Stack.Screen name="marketplace" />
          <Stack.Screen name="marketplace/post" />
          <Stack.Screen name="marketplace/[id]" />
          <Stack.Screen name="vendor/apply" />
          <Stack.Screen name="vendor/dashboard" />
          <Stack.Screen name="vendor/products" />
          <Stack.Screen name="vendor/products/create" />
          <Stack.Screen name="vendor/products/[id]" />
          <Stack.Screen name="reseller-shop" />
          <Stack.Screen name="reseller-shop/[id]" />
          <Stack.Screen name="reselling/orders" />
          <Stack.Screen name="reselling/tracking/[id]" />
        </Stack>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
