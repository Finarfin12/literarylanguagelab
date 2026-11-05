import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Alegreya } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

// Sans untuk seluruh UI. Serif = Michelangelus (hanya lewat local(), lihat globals.css) lalu Alegreya.
const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
});

const alegreya = Alegreya({
  variable: "--font-alegreya",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Literary Language Lab",
  description: "Belajar bahasa Inggris melalui literatur sastra.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Literary Lab",
  },
};

export const viewport: Viewport = {
  themeColor: "#2fa16b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${sourceSans.variable} ${alegreya.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <PwaRegister />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
