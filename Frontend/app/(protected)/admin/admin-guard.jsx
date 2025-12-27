"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "app/contexts/auth/context";
import { SplashScreen } from "components/template/SplashScreen";
import { toast } from "sonner";

export function AdminGuard({ children }) {
  const { user, isAuthenticated, isInitialized } = useAuthContext();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isInitialized) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Check if user is admin (staff or superuser)
    // User data comes from /api/users/userinfo/ which has nested structure: user.user.is_staff
    const userObj = user?.user || user;
    const isAdmin = userObj?.is_staff || userObj?.is_superuser;
    
    if (user && isAdmin) {
      setIsChecking(false);
    } else {
      toast.error("Access Denied", {
        description: "You do not have permission to access the admin panel",
      });
      router.push("/dashboards/home");
      setIsChecking(false);
    }
  }, [user, isAuthenticated, isInitialized, isMounted, router]);

  if (!isMounted || !isInitialized || isChecking) {
    return <SplashScreen />;
  }

  // Check admin status - handle both nested and flat user structures
  const userObj = user?.user || user;
  const isAdmin = userObj?.is_staff || userObj?.is_superuser;
  
  if (!isAuthenticated || !isAdmin) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

