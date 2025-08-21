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
  title: "Colecionáveis Digitais",
  description: "Plataforma de colecionáveis digitais gamificada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
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
