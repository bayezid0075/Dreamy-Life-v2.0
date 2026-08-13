const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'avif'];

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  if (url.includes('localhost:') && !url.startsWith(API_URL)) {
    return url.replace(/http:\/\/localhost:\d+/, API_URL);
  }
  return url;
}

export function isImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].split('#')[0];
  const ext = clean.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.includes(ext);
}

export function fileNameFromUrl(url?: string | null): string {
  if (!url) return 'file';
  const clean = url.split('?')[0].split('#')[0];
  const name = clean.split('/').pop() || 'file';
  return decodeURIComponent(name);
}
