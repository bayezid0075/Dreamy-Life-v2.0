import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4080';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export async function sendPushTokenToServer(expoPushToken: string): Promise<void> {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (!accessToken) return;

    await fetch(`${API_URL}/notifications/register-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token: expoPushToken,
        platform: Platform.OS,
      }),
    });
  } catch (err) {
    console.error('Failed to register push token:', err);
  }
}

export function setupNotificationListeners(
  onReceive?: (notification: Notifications.Notification) => void,
  onForeground?: (notification: Notifications.Notification) => void,
) {
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    onReceive?.(notification);
    onForeground?.(notification);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    console.log('Notification opened:', data);
  });

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}
