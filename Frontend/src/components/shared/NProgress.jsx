"use client";

// Import Dependencies
import { useNProgress } from "@tanem/react-nprogress";
import PropTypes from "prop-types";
import { useEffect, useState, useRef } from "react";

// Local Imports
import { useThemeContext } from "app/contexts/theme/context";

// ----------------------------------------------------------------------

function NProgressContent({ isAnimating }) {
  // Access theme context - will be available since this is only rendered after context is ready
  const { primaryColorScheme: primary, isDark } = useThemeContext();
  const { animationDuration, isFinished, progress } = useNProgress({
    isAnimating,
  });

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 h-0.5 w-full"
      style={{
        zIndex: 9999,
      }}
    >
      {!isFinished && (
        <div
          className="relative h-full"
          style={{
            backgroundColor: isDark ? primary[500] : primary[600],
            width: `${progress * 100}%`,
            transition: `width ${animationDuration}ms ease-out`,
          }}
        >
          <div
            className="absolute right-0 h-full opacity-100"
            style={{
              boxShadow: `0 0 10px ${
                isDark ? primary[500] : primary[600]
              }, 0 0 5px ${isDark ? primary[500] : primary[600]}`,
              transform: "rotate(3deg) translate(0px, -4px)",
              width: 100,
            }}
          />
        </div>
      )}
    </div>
  );
}

function NProgress({ isAnimating }) {
  const [mounted, setMounted] = useState(false);
  const [contextReady, setContextReady] = useState(false);
  const retryTimeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Wait for mount
    setMounted(true);

    // Use a sufficient delay to ensure ThemeProvider has fully initialized
    // ThemeProvider uses useLocalStorage which needs time to initialize on first render
    // Using requestAnimationFrame + setTimeout ensures we're past the initial render cycle
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Longer delay to ensure useLocalStorage and all effects have run
        retryTimeoutRef.current = setTimeout(() => {
          setContextReady(true);
        }, 300);
      });
    });

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Don't render until mounted and context is ready
  if (!mounted || !contextReady) {
    return null;
  }

  return <NProgressContent isAnimating={isAnimating} />;
}

NProgress.displayName = "NProgress";

NProgress.propTypes = {
  isAnimating: PropTypes.bool,
};

export { NProgress };
