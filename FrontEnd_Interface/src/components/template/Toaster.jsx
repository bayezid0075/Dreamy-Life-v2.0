"use client";

// Import Dependencies
import { useEffect, useState } from "react";
import { Toaster as SonnerToaster } from "sonner";

// Local Imports
import { defaultTheme } from "configs/theme.config";
import { useThemeContext } from "app/contexts/theme/context";
import { isServer } from "utils/isServer";

// ----------------------------------------------------------------------

export default function Toaster() {
  const { isDark, notification } = useThemeContext();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isServer || !isMounted) {
    return null;
  }

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
