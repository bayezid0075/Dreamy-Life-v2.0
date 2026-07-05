import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { I18nProvider } from '@/i18n';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import '@/styles/globals.css';

const queryClient = new QueryClient();

function NotificationSocketProvider({ children }: { children: React.ReactNode }) {
  useNotificationSocket();
  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <NotificationSocketProvider>
          <Component {...pageProps} />
        </NotificationSocketProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
