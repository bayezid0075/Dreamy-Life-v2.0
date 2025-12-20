"use client";

// Import Dependencies
import { lazy, useEffect } from "react";

// Local Imports
import { AuthProvider } from "app/contexts/auth/Provider";
import { BreakpointProvider } from "app/contexts/breakpoint/Provider";
import { LocaleProvider } from "app/contexts/locale/Provider";
import { SidebarProvider } from "app/contexts/sidebar/Provider";
import { ThemeProvider } from "app/contexts/theme/Provider";
import { SplashScreen } from "components/template/SplashScreen";
import { Progress } from "components/template/Progress";
import { Loadable } from "components/shared/Loadable";

// Import i18n config
import "i18n/config";

// Import styles
import "simplebar-react/dist/simplebar.min.css";
import "styles/index.css";

const ToasterLazy = lazy(() => import("components/template/Toaster"));
const TooltipLazy = lazy(() => import("components/template/Tooltip"));

const Toaster = Loadable(ToasterLazy, SplashScreen);
const Tooltip = Loadable(TooltipLazy, SplashScreen);

// ----------------------------------------------------------------------

export function ClientProviders({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LocaleProvider>
          <BreakpointProvider>
            <SidebarProvider>
              <Progress />
              {children}
              <Tooltip />
              <Toaster />
            </SidebarProvider>
          </BreakpointProvider>
        </LocaleProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

