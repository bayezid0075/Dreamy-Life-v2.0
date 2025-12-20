"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "app/contexts/auth/context";
import { SplashScreen } from "components/template/SplashScreen";
import { HOME_PATH } from "constants/app.constant";

export function AuthGuard({ children }) {
  const { isAuthenticated, isInitialized } = useAuthContext();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isInitialized) return;

    if (isAuthenticated && typeof window !== "undefined") {
      window.location.href = HOME_PATH;
    }
  }, [isAuthenticated, isInitialized, isMounted]);

  if (!isMounted || !isInitialized) {
    return <SplashScreen />;
  }

  if (isAuthenticated) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

