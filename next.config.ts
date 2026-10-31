import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  // v2: halaman gamifikasi dihapus, arahkan bookmark lama ke dashboard
  async redirects() {
    const gamification = ["/leaderboard", "/duels", "/tools/weekly-challenge", "/english-lab/writing-challenge"].map((source) => ({
      source,
      destination: "/dashboard",
      permanent: false,
    }));
    // v3: Tone Detector digabung ke Tone & Gaya (mode "Deteksi Nada")
    return [
      ...gamification,
      { source: "/tools/tone-detector", destination: "/tools/tone-analyzer", permanent: false },
    ];
  },
};

export default withPWA(nextConfig);
