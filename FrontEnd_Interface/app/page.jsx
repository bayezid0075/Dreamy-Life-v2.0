"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "app/contexts/auth/context";
import { SplashScreen } from "components/template/SplashScreen";
import { HOME_PATH, GHOST_ENTRY_PATH } from "constants/app.constant";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthContext();

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated) {
      router.replace("/dashboards/home");
    } else {
      router.replace(GHOST_ENTRY_PATH);
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return <SplashScreen />;
  }

  return <SplashScreen />;
}

