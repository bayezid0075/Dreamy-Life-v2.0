const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface PlanFeature {
  text: string;
  icon: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  price: string;
  description: string | null;
  level: number;
  features: PlanFeature[];
  buttonText: string;
  isPopular: boolean;
  sortOrder: number;
  colorTheme: string;
  commissionRates: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipStats {
  totalPurchases: number;
  totalRevenue: number;
  totalCommissions: number;
  planBreakdown: {
    planId: string;
    planName: string;
    price: number;
    purchaseCount: number;
    revenue: number;
  }[];
  usersByStatus: {
    status: string;
    count: number;
  }[];
}

export interface CreatePlanInput {
  name: string;
  price: string;
  description?: string;
  level: number;
  features?: PlanFeature[];
  buttonText?: string;
  isPopular?: boolean;
  sortOrder?: number;
  colorTheme?: string;
  commissionRates?: number[];
  isActive?: boolean;
}

export interface UpdatePlanInput {
  name?: string;
  price?: string;
  description?: string;
  level?: number;
  features?: PlanFeature[];
  buttonText?: string;
  isPopular?: boolean;
  sortOrder?: number;
  colorTheme?: string;
  commissionRates?: number[];
  isActive?: boolean;
}

export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  const res = await fetch(`${API_URL}/admin/membership-plans`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch membership plans');
  const data = await res.json();
  return data.data;
}

export async function getMembershipPlanById(id: string): Promise<MembershipPlan> {
  const res = await fetch(`${API_URL}/admin/membership-plans/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch membership plan');
  const data = await res.json();
  return data.data;
}

export async function createMembershipPlan(input: CreatePlanInput): Promise<MembershipPlan> {
  const res = await fetch(`${API_URL}/admin/membership-plans`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create membership plan');
  }
  const data = await res.json();
  return data.data;
}

export async function updateMembershipPlan(id: string, input: UpdatePlanInput): Promise<MembershipPlan> {
  const res = await fetch(`${API_URL}/admin/membership-plans/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update membership plan');
  }
  const data = await res.json();
  return data.data;
}

export async function deleteMembershipPlan(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/membership-plans/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete membership plan');
  }
}

export async function getMembershipStats(): Promise<MembershipStats> {
  const res = await fetch(`${API_URL}/admin/membership-stats`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch membership stats');
  const data = await res.json();
  return data.data;
}
