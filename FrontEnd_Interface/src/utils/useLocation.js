// Compatibility utility for react-router's useLocation in Next.js
import { usePathname, useSearchParams } from "next/navigation";

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  return {
    pathname,
    search: searchParams.toString() ? `?${searchParams.toString()}` : "",
    hash: typeof window !== "undefined" ? window.location.hash : "",
    state: null, // Next.js doesn't have location state
  };
}

