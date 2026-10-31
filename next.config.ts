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
    return ["/leaderboard", "/duels", "/tools/weekly-challenge", "/english-lab/writing-challenge"].map((source) => ({
      source,
      destination: "/dashboard",
      permanent: false,
    }));
  },
};

export default withPWA(nextConfig);
