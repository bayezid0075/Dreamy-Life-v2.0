import { useAuthStore } from '@/shared/stores/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: Response) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token as any);
    }
  });
  failedQueue = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (res.ok && data.data?.accessToken) {
      const newToken = data.data.accessToken;
      useAuthStore.setState({ accessToken: newToken });
      return newToken;
    }
  } catch {
    // Refresh failed
  }
  return null;
}

export async function authFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = input.startsWith('http') ? input : `${API_URL}${input}`;
  let response = await fetch(url, { ...init, headers });

  if (response.status === 401 && accessToken) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(async (token) => {
        const retryHeaders = { ...headers, Authorization: `Bearer ${token}` };
        return fetch(url, { ...init, headers: retryHeaders });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        processQueue(null, newToken);
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        response = await fetch(url, { ...init, headers: retryHeaders });
      } else {
        processQueue(new Error('Refresh failed'), null);
        useAuthStore.getState().clearAuth();
      }
    } catch (err) {
      processQueue(err, null);
      useAuthStore.getState().clearAuth();
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}
