import { Stack } from 'expo-router';
import ChatListScreen from '@/features/chat/screens/ChatListScreen';

export default function ChatIndex() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatListScreen />
    </>
  );
}
