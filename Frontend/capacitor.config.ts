import type { CapacitorConfig } from "@capacitor/cli";

const appUrl = process.env.CAPACITOR_LIVE_URL || "https://your-frontend-domain.com";

const config: CapacitorConfig = {
  appId: "com.dreamylife.app",
  appName: "Dreamy Life",
  webDir: ".next",
  server: {
    url: appUrl,
    cleartext: appUrl.startsWith("http://"),
    androidScheme: "https",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
