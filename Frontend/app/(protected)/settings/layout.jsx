"use client";

// Import Dependencies
import { useState, useEffect } from "react";

// Local Imports
import { Sidebar } from "app/pages/settings/Sidebar";
import { useSidebarContext } from "app/contexts/sidebar/context";
import { useThemeContext } from "app/contexts/theme/context";
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useIsomorphicEffect } from "hooks";

// ----------------------------------------------------------------------

const dataset =
  typeof document !== "undefined" ? document?.body?.dataset : null;

export default function SettingsLayout({ children }) {
  const { themeLayout } = useThemeContext();
  const { close, open } = useSidebarContext();
  const { lgAndDown, xlAndUp } = useBreakpointsContext();
  const [isMounted, setIsMounted] = useState(false);

  useIsomorphicEffect(() => {
    if (xlAndUp) open();
    return () => {
      if (lgAndDown) close();
    };
  }, [close, lgAndDown, open, xlAndUp]);

  useIsomorphicEffect(() => {
    if (dataset) {
      dataset.layout = "main-layout";

      // Fix flicker layout
      queueMicrotask(() => {
        if (dataset) {
          dataset.layout = "main-layout";
        }
      });
    }

    return () => {
      if (dataset) {
        dataset.layout = themeLayout;
      }
    };
  }, [themeLayout]);

  useIsomorphicEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Redirect to general if on settings root
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/settings"
    ) {
      window.location.href = "/settings/general";
    }
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {children}
      <Sidebar />
    </>
  );
}
