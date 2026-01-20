import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#1e293b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Morning Scroll",
  description: "Your daily news catchup, personalized for you.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Morning Scroll",
  },
  openGraph: {
    type: "website",
    siteName: "Morning Scroll",
    title: "Morning Scroll",
    description: "Your daily news catchup, personalized for you.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Morning Scroll",
    description: "Your daily news catchup, personalized for you.",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icon-192.png",
  },
};

import { BookmarkProvider } from '@/context/BookmarkContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BookmarkProvider>
          {children}
        </BookmarkProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
        <GoogleAnalytics gaId="G-JXF3M87MZ6" />
      </body>
    </html>
  );
}
