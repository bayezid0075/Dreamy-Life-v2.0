"use client";

import { useEffect } from "react";
import { useAuthContext } from "app/contexts/auth/context";
import { SplashScreen } from "components/template/SplashScreen";
import { HOME_PATH, GHOST_ENTRY_PATH } from "constants/app.constant";

export default function Home() {
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
