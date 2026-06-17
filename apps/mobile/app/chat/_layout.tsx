import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create-group" />
      <Stack.Screen name="people" />
      <Stack.Screen name="calls" />
      <Stack.Screen name="stories" />
    </Stack>
  );
}
