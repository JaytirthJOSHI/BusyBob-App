export default {
  expo: {
    name: "BusyBob",
    slug: "busybob-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.busybob.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.busybob.mobile"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "your-supabase-url",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "your-supabase-anon-key",
      spotifyClientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || "your-spotify-client-id",
      spotifyClientSecret: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || "your-spotify-client-secret"
    }
  }
}; 