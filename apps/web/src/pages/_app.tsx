import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { I18nProvider } from '@/i18n';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import ErrorBoundary from '@/shared/components/ErrorBoundary';
import '@/styles/globals.css';

const queryClient = new QueryClient();

function NotificationSocketProvider({ children }: { children: React.ReactNode }) {
  useNotificationSocket();
  return <>{children}</>;
}

function useGlobal401Interceptor() {
  const router = useRouter();

  useEffect(() => {
    const originalFetch = window.fetch;
    let redirecting = false;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401 && !redirecting) {
        redirecting = true;
        useAuthStore.getState().clearAuth();
        router.replace('/login');
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [router]);
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  useGlobal401Interceptor();

  return (
    <ErrorBoundary source="frontend-web">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <NotificationSocketProvider>
            <Component {...pageProps} />
          </NotificationSocketProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
