import { Stack, useLocalSearchParams } from 'expo-router';
import ChatScreen from '@/features/chat/screens/ChatScreen';

export default function ChatDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatScreen conversationId={id!} />
    </>
  );
}
