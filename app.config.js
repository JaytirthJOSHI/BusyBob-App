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
      supabaseUrl: "https://vypzihmbljzswpznzlzr.supabase.co",
      supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cHppaG1ibGp6c3dwem56bHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTYyMDksImV4cCI6MjA2NDk5MjIwOX0.vJn0C4arneVjPD10Zj6UQXtM3xlr88h2h9mxGyEx1t8",
      spotifyClientId: "033d5c62b23e48e5a563c03eeb6a6704",
      spotifyClientSecret: "c001096f8483489bb0db3356239cca26"
    }
  }
}; 