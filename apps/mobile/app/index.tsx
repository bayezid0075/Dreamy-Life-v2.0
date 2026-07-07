import { Redirect } from 'expo-router';
import { useAuthStore } from '@/shared/stores/authStore';

export default function Index() {
  const { isAuthenticated, hydrated } = useAuthStore();

  if (!hydrated) return null;

  return isAuthenticated ? <Redirect href="/dashboard" /> : <Redirect href="/login" />;
}
