"use client";

// Import Dependencies
import { useEffect, useState } from "react";
import { Toaster as SonnerToaster } from "sonner";

// Local Imports
import { defaultTheme } from "configs/theme.config";
import { useThemeContext } from "app/contexts/theme/context";
import { isServer } from "utils/isServer";

// ----------------------------------------------------------------------

function ToasterContent() {
  // Access theme context - will be available since this is only rendered after mount
  const { isDark, notification } = useThemeContext();

  return (
    <SonnerToaster
      theme={isDark ? "dark" : "light"}
      offset="16px"
      position={notification?.position || defaultTheme?.notification?.position}
      expand={
        notification?.isExpanded || defaultTheme?.notification?.isExpanded
      }
      visibleToasts={
        notification?.visibleToasts || defaultTheme?.notification?.visibleToasts
      }
      richColors
    />
  );
}

export default function Toaster() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render until mounted (prevents SSR/hydration issues)
  // This ensures ThemeProvider is available before accessing context
  if (isServer || !isMounted) {
    return null;
  }

  return <ToasterContent />;
}
