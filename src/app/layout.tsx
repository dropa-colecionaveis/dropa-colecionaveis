import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextAuthProvider from "@/providers/session-provider";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

// Validate environment variables on app startup (server-side only)
if (typeof window === 'undefined') {
  import('@/lib/env-validator').catch(console.error);
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dropa! - Colecionáveis Digitais",
  description: "Plataforma de colecionáveis digitais gamificada com sistema revolucionário de escassez",
  keywords: ["colecionáveis", "digitais", "NFT", "gamificação", "raridade", "escassez", "pacotes"],
  authors: [{ name: "Dropa! Team" }],
  creator: "Dropa!",
  publisher: "Dropa!",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Dropa! - Colecionáveis Digitais",
    description: "Plataforma de colecionáveis digitais gamificada com sistema revolucionário de escassez",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "Dropa! Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dropa! - Colecionáveis Digitais",
    description: "Plataforma de colecionáveis digitais gamificada com sistema revolucionário de escassez",
    images: ["/favicon.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/favicon.png", sizes: "128x128", type: "image/png" },
      { url: "/favicon.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: [
      { url: "/favicon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "icon",
        url: "/favicon.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#9333ea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Dropa!" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Dropa!" />
        <meta name="msapplication-TileColor" content="#9333ea" />
        <meta name="msapplication-config" content="none" />
      </head>
      <body
        className={`${inter.variable} antialiased`}
      >
        <NextAuthProvider>
          {children}
          <CookieConsent />
        </NextAuthProvider>
      </body>
    </html>
  );
}
