'use client';

import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { ThemeProvider } from './theme-provider';
import { LanguageProvider } from './language-provider';
import { MobilePushProvider } from './mobile-push-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <AuthProvider>
          <MobilePushProvider>
            <LanguageProvider>
              {children}
              <Toaster position="top-right" richColors />
            </LanguageProvider>
          </MobilePushProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export { QueryProvider } from './query-provider';
export { AuthProvider } from './auth-provider';
export { ThemeProvider } from './theme-provider';
export { LanguageProvider } from './language-provider';
export { MobilePushProvider } from './mobile-push-provider';

