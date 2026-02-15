"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store";
import { usersApi } from "@/lib/api";

export function useAccountStatus() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["account-status"],
    queryFn: () => usersApi.getAccountStatus(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const isAreaAllowed = (area: string): boolean => {
    if (!data) return true;
    return !(data.restricted_areas ?? []).includes(area);
  };

  return {
    accountStatus: data?.account_status ?? "active",
    restrictedAreas: data?.restricted_areas ?? [],
    message: data?.message ?? null,
    isVerified: data?.is_verified ?? false,
    memberStatus: data?.member_status ?? "user",
    isAreaAllowed,
    isLoading,
    refetch,
  };
}
