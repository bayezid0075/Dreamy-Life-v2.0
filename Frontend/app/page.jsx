"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "app/contexts/auth/context";
import { SplashScreen } from "components/template/SplashScreen";
import { HOME_PATH, GHOST_ENTRY_PATH } from "constants/app.constant";

// ----------------------------------------------------------------------

function HomeContent() {
  const { isAuthenticated, isInitialized } = useAuthContext();

  useEffect(() => {
    if (!isInitialized) return;

    if (typeof window !== "undefined") {
      if (isAuthenticated) {
        window.location.href = HOME_PATH;
      } else {
        window.location.href = GHOST_ENTRY_PATH;
      }
    }
  }, [isAuthenticated, isInitialized]);

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
