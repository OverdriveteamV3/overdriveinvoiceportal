import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppInitSync } from "@/components/AppInitSync";
import CookieNotice from "@/components/home/CookieNotice";
import SupportChat from "@/components/home/SupportChat";
import { getLocale } from "@/lib/get-locale";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Over Drive OS — Invoice & Quote System",
  description: "Corporate invoice and quote dashboard for Over Drive OS",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppInitSync />
        {children}
        <CookieNotice locale={locale} />
        <SupportChat locale={locale} />
      </body>
    </html>
  );
}
