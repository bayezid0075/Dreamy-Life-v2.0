"use client";

// Import Dependencies
import { lazy, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Local Imports
import { useAuthContext } from "app/contexts/auth/context";
import { useThemeContext } from "app/contexts/theme/context";
import { Loadable } from "components/shared/Loadable";
import { SplashScreen } from "components/template/SplashScreen";
import { GHOST_ENTRY_PATH, REDIRECT_URL_KEY } from "constants/app.constant";

// ----------------------------------------------------------------------

const themeLayouts = {
  "main-layout": lazy(() => import("app/layouts/MainLayout")),
  sideblock: lazy(() => import("app/layouts/Sideblock")),
};

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthContext();
  const { themeLayout } = useThemeContext();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      router.replace(
        `${GHOST_ENTRY_PATH}?${REDIRECT_URL_KEY}=${currentPath}`
      );
    }
  }, [isAuthenticated, isInitialized, router]);

  const CurrentLayout = useMemo(
    () => Loadable(themeLayouts[themeLayout], SplashScreen),
    [themeLayout]
  );

  if (!isInitialized) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <SplashScreen />;
  }

  return <CurrentLayout>{children}</CurrentLayout>;
}

