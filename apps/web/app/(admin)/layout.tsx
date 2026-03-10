import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Quản trị",
    template: "%s | Admin SKAM",
  },
  description: "Khu vực quản trị và kiểm duyệt báo cáo lừa đảo của SKAM.",
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminGroupLayoutProps {
  readonly children: ReactNode;
}

export default function AdminGroupLayout({
  children,
}: AdminGroupLayoutProps): ReactElement {
  return <>{children}</>;
}
