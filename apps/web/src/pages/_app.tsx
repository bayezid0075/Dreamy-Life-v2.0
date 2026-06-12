import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import '@/styles/globals.css';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
