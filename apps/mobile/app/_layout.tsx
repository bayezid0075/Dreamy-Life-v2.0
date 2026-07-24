import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider } from '@/shared/i18n';
import { useNotificationSocket } from '@/shared/hooks/useNotificationSocket';
import { useAuthStore } from '@/shared/stores/authStore';

function NotificationSocketProvider({ children }: { children: React.ReactNode }) {
  useNotificationSocket();
  return <>{children}</>;
}

function useGlobal401Interceptor() {
  const router = useRouter();

  useEffect(() => {
    const originalFetch = globalThis.fetch;
    let redirecting = false;

    globalThis.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401 && !redirecting) {
        redirecting = true;
        useAuthStore.getState().clearAuth();
        router.replace('/login');
      }

      return response;
    };

    return () => {
      globalThis.fetch = originalFetch;
    };
  }, [router]);
}

export default function RootLayout() {
  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  useGlobal401Interceptor();

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <NotificationSocketProvider>
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
            <Stack.Screen name="notifications/[id]" />
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
            <Stack.Screen name="recharge" />
            <Stack.Screen name="recharge-history" />
            <Stack.Screen name="drive-pack" />
            <Stack.Screen name="drive-pack-history" />
          </Stack>
        </NotificationSocketProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
