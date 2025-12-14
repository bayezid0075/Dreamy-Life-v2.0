"use client";

// Import Dependencies
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Local Imports
import { useAuthContext } from "app/contexts/auth/context";
import { SplashScreen } from "components/template/SplashScreen";
import { HOME_PATH } from "constants/app.constant";

export default function AuthLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthContext();

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated) {
      router.replace(HOME_PATH);
    }
  }, [isAuthenticated, isInitialized, router]);

  if (!isInitialized) {
    return <SplashScreen />;
  }

  if (isAuthenticated) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

