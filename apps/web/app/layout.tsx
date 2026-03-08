import type { Metadata } from "next";
import type { ReactNode, ReactElement } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKAM Platform",
  description: "Nền tảng kiểm tra tài khoản ngân hàng chống lừa đảo",
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps): ReactElement {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
