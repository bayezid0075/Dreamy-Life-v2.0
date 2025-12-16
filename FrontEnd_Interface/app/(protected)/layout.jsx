"use client";

// Import Dependencies
import { lazy, useMemo } from "react";

// Local Imports
import { useThemeContext } from "app/contexts/theme/context";
import { Loadable } from "components/shared/Loadable";
import { SplashScreen } from "components/template/SplashScreen";
import { ProtectedGuard } from "./protected-guard";

// ----------------------------------------------------------------------

const themeLayouts = {
  "main-layout": lazy(() => import("app/layouts/MainLayout")),
  sideblock: lazy(() => import("app/layouts/Sideblock")),
};

export default function ProtectedLayout({ children }) {
  const { themeLayout } = useThemeContext();

  const CurrentLayout = useMemo(
    () => Loadable(themeLayouts[themeLayout], SplashScreen),
    [themeLayout],
  );

  return (
    <ProtectedGuard>
      <CurrentLayout>{children}</CurrentLayout>
    </ProtectedGuard>
  );
}
