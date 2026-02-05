'use client';

import { useQuery } from '@tanstack/react-query';
import { vendorsApi } from '@/lib/api';
import type { Vendor } from '@/types';

export function useVendor() {
  const { data: vendors, isLoading, error } = useQuery({
    queryKey: ['vendors'],
    queryFn: vendorsApi.getVendors,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const vendor: Vendor | null = vendors?.[0] ?? null;
  const hasVendor = !!vendor;
  const isPaid = vendor?.payment_status ?? false;

  return {
    vendor,
    hasVendor,
    isPaid,
    isLoading,
    error,
  };
}
