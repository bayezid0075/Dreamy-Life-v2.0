const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  if (url.includes('localhost:') && !url.startsWith(API_URL)) {
    return url.replace(/http:\/\/localhost:\d+/, API_URL);
  }
  return url;
}
