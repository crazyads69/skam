import type { Metadata } from "next";
import type { ReactNode, ReactElement } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NavBar } from "@/components/layout/nav-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKAM",
  description:
    "Nền tảng kiểm tra tài khoản ngân hàng chống lừa đảo tại Việt Nam",
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
