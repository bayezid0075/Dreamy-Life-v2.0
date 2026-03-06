const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface BannerSlidePublic {
  id: number;
  title: string;
  image_url: string;
  link: string;
}

export interface BannerSlideAdmin extends BannerSlidePublic {
  image?: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Public: list active banners for the dashboard slider (no auth). */
export async function getBanners(): Promise<BannerSlidePublic[]> {
  const res = await fetch(`${API_BASE}/api/banners/`);
  if (!res.ok) throw new Error("Failed to fetch banners");
  return res.json();
}

export const bannersApi = {
  getBanners,

  /** Admin: list all banners (requires auth). */
  adminList: async (): Promise<BannerSlideAdmin[]> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const res = await fetch(`${API_BASE}/api/banners/admin/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to fetch admin banners");
    return res.json();
  },

  /** Admin: create banner (multipart: image + link, title, order, is_active). */
  adminCreate: async (data: FormData): Promise<BannerSlideAdmin> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const res = await fetch(`${API_BASE}/api/banners/admin/`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.image?.[0] || "Failed to create banner");
    }
    return res.json();
  },

  /** Admin: update banner (multipart optional). */
  adminUpdate: async (id: number, data: FormData): Promise<BannerSlideAdmin> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const res = await fetch(`${API_BASE}/api/banners/admin/${id}/`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update banner");
    }
    return res.json();
  },

  /** Admin: delete banner. */
  adminDelete: async (id: number): Promise<void> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const res = await fetch(`${API_BASE}/api/banners/admin/${id}/`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to delete banner");
  },
};
