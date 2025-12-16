"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "app/contexts/auth/context";
import { SplashScreen } from "components/template/SplashScreen";
import { GHOST_ENTRY_PATH, REDIRECT_URL_KEY } from "constants/app.constant";

export function ProtectedGuard({ children }) {
  const { isAuthenticated, isInitialized } = useAuthContext();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isInitialized) return;

    if (!isAuthenticated && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      window.location.href = `${GHOST_ENTRY_PATH}?${REDIRECT_URL_KEY}=${currentPath}`;
    }
  }, [isAuthenticated, isInitialized, isMounted]);

  if (!isMounted || !isInitialized) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

