"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token } from "@capacitor/push-notifications";

import { notificationsApi } from "@/lib/api";
import { useAuthStore } from "@/store";

const PUSH_TOKEN_STORAGE_KEY = "dlv2_native_push_token";

async function registerNativePushToken() {
  if (!Capacitor.isNativePlatform()) return;

  let permissionStatus = await PushNotifications.checkPermissions();
  if (permissionStatus.receive === "prompt") {
    permissionStatus = await PushNotifications.requestPermissions();
  }
  if (permissionStatus.receive !== "granted") return;

  await PushNotifications.register();
}

export function MobilePushProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const registrationListener = PushNotifications.addListener(
      "registration",
      async (token: Token) => {
        const value = token.value?.trim();
        if (!value) return;
        localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, value);
        try {
          await notificationsApi.registerDeviceToken({
            token: value,
            platform: Capacitor.getPlatform() as "android" | "ios",
          });
        } catch (error) {
          console.error("Failed to register native push token", error);
        }
      }
    );

    const errorListener = PushNotifications.addListener(
      "registrationError",
      (error) => {
        console.error("Push registration error", error);
      }
    );

    const actionListener = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (event) => {
        const link = event.notification?.data?.link;
        if (typeof link === "string" && link.trim()) {
          window.location.href = link;
        }
      }
    );

    return () => {
      registrationListener.then((h) => h.remove());
      errorListener.then((h) => h.remove());
      actionListener.then((h) => h.remove());
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    if (isAuthenticated) {
      registerNativePushToken().catch((error) => {
        console.error("Failed to initialize native push", error);
      });
      return;
    }

    const token = localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (!token) return;
    notificationsApi
      .unregisterDeviceToken({ token, platform: Capacitor.getPlatform() as "android" | "ios" })
      .catch(() => null);
    localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  }, [isAuthenticated]);

  return <>{children}</>;
}
