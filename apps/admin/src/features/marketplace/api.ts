const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface MarketplaceSettings {
  id: string;
  platformFeePercent: string;
  maxSubmissionsPerUser: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  platformFeePercent?: number;
  maxSubmissionsPerUser?: number;
  isActive?: boolean;
}

export async function getMarketplaceSettings(): Promise<MarketplaceSettings> {
  const res = await fetch(`${API_URL}/admin/marketplace/settings`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch marketplace settings');
  return res.json();
}

export async function updateMarketplaceSettings(input: UpdateSettingsInput): Promise<MarketplaceSettings> {
  const res = await fetch(`${API_URL}/admin/marketplace/settings`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update marketplace settings');
  }
  return res.json();
}
