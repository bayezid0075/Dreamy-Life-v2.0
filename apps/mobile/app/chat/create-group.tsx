import { Stack } from 'expo-router';
import CreateGroupScreen from '@/features/chat/screens/CreateGroupScreen';

export default function CreateGroup() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <CreateGroupScreen />
    </>
  );
}
