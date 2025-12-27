"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "app/contexts/auth/context";
import { SplashScreen } from "components/template/SplashScreen";
import { HOME_PATH } from "constants/app.constant";

// ----------------------------------------------------------------------

function HomeContent() {
  const { isAuthenticated, isInitialized } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated) {
      router.replace(HOME_PATH);
    } else {
      // Redirect to login page for unauthenticated users
      router.replace("/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  return <SplashScreen />;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted (prevents SSR/hydration issues)
  // This ensures AuthProvider is available before accessing context
  if (!mounted) {
    return <SplashScreen />;
  }

  return <HomeContent />;
}
