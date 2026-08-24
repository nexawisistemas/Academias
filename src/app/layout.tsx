import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConsentManager } from "@/components/analytics/consent-manager";
import { getPlatformSiteSettings } from "@/lib/platform-site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { analytics } = await getPlatformSiteSettings();
  return {
    metadataBase: new URL("https://academias.nexawi.com.br"),
    title: { default: "NexaWi Academias", template: "%s | NexaWi Academias" },
    description: "Gestão, vendas, financeiro, treinos e presença digital em um único ecossistema para academias.",
    alternates: { canonical: "/" },
    verification: analytics.searchConsoleVerification ? { google: analytics.searchConsoleVerification } : undefined,
    openGraph: { title: "NexaWi Academias", description: "Sua academia em outro nível.", url: "/", siteName: "NexaWi Academias", locale: "pt_BR", type: "website" },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { analytics } = await getPlatformSiteSettings();
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<ConsentManager analytics={analytics} /></body>
    </html>
  );
}
