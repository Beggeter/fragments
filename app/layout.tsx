import type { Metadata } from "next";
import { Figtree, Geist, Geist_Mono, Manrope, Mulish } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "600", "800", "900", "700"],
  style: ["normal", "italic"],
  variable: "--font-figtree",
});

const mulish = Manrope({
  subsets: ["latin", 'cyrillic'],
  weight: ["400", "600", "800",  "700"],
  style: ["normal"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Fragments",
  description: "Play Fragments game!",
  manifest: "/manifest.json",
  other: {
    "telegram-web-app-ready": "true",
    "telegram-web-app-version": "6.0",
  },
};

export const viewport = {
  width: "device-width",
  height: "device-height",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${figtree.variable} ${mulish.variable} antialiased overflow-y-hidden overflow-x-hidden`}
      suppressHydrationWarning={true}
    >
      <head>
        {/* Telegram Web App Script */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
