import type { Metadata } from "next";
import type { ReactNode, ReactElement } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NavBar } from "@/components/layout/nav-bar";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";
import "./globals.css";

const siteUrl: string = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export default function RootLayout({
  children,
}: RootLayoutProps): ReactElement {
  return (
    <html lang="vi">
      <body className={`${inter.className} ${jetbrains.className}`}>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
