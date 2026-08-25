import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Standalone mobile app: all web assets are bundled from dist/mobile.
 * There is intentionally NO server.url — the APK must not load the hosted site.
 */
const config: CapacitorConfig = {
  appId: "com.mobioq.weathermap",
  appName: "Weather Map - Hava Haritası",
  webDir: "dist/mobile",
  android: {
    // https://localhost origin → secure context (geolocation) + clean CORS.
    androidScheme: "https",
  },
  server: {
    cleartext: false,
  },
};

export default config;
