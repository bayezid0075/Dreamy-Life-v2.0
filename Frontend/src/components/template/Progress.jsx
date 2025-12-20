"use client";

// Import Dependencies
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Local Imports
import { NProgress } from "components/shared/NProgress";

// ----------------------------------------------------------------------

export function Progress() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return <NProgress isAnimating={isLoading} />;
}
