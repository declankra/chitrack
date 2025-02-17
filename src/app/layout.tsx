// /src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Providers } from './providers';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "Chitrack: Chicago CTA Ventra Transit Tracker",
  description: "Real-time updates on Chicago CTA Ventra transit status and delays, better than Transit Tracker.",
  keywords: ["Chicago", "CTA", "Ventra", "Transit", "Tracker", "Transit Status", "Transit Delays"],

    // Open Graph metadata for rich sharing previews
    openGraph: {
      title: "Chitrack: Chicago CTA Ventra Transit Tracker",
      description: "Real-time updates on Chicago CTA Ventra transit status and delays, better than Transit Tracker.",
      siteName: "Chitrack: Chicago CTA Ventra Transit Tracker",
      images: [{
          url: "/og-image.png", // This should be 1200x630px for optimal sharing
          width: 1200,
          height: 630,
          alt: "Chitrack Preview",
        }],
      locale: "en_US",
      type: "website",
      url: process.env.NEXT_PUBLIC_BASE_URL,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

  // Favicon and manifest
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-touch-icon-precomposed.png" }
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-precomposed.png" />
      </head>
      <body
        className={`${inter.variable} antialiased min-h-screen w-full overflow-x-hidden`}
        suppressHydrationWarning
      >
        <Providers>
          <Header />
          <main className="w-full overflow-x-hidden">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}