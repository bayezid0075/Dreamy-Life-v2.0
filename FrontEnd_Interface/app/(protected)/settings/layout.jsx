"use client";

// Import Dependencies
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Local Imports
import { Page } from "components/shared/Page";
import { Header } from "app/layouts/MainLayout/Header";
import { Sidebar } from "app/pages/settings/Sidebar";
import { Card } from "components/ui";
import { useSidebarContext } from "app/contexts/sidebar/context";
import { useThemeContext } from "app/contexts/theme/context";
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useIsomorphicEffect } from "hooks";

// ----------------------------------------------------------------------

const dataset = typeof document !== "undefined" ? document?.body?.dataset : null;

export default function SettingsLayout({ children }) {
  const router = useRouter();
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
    if (typeof window !== "undefined" && window.location.pathname === "/settings") {
      router.replace("/settings/general");
    }
  }, [router]);

  if (!isMounted) return null;

  return (
    <Page title="Setting">
      <Header />
      <main className="main-content transition-content grid flex-1 grid-cols-1 place-content-start px-(--margin-x) py-6">
        <Card className="h-full w-full p-4 sm:px-5 2xl:mx-auto 2xl:max-w-5xl">
          {children}
        </Card>
      </main>
      <Sidebar />
    </Page>
  );
}

