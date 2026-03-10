import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";

export const metadata: Metadata = {
  title: "Báo cáo tài khoản lừa đảo",
  description:
    "Gửi báo cáo tài khoản lừa đảo kèm mô tả chi tiết và bằng chứng để cộng đồng được bảo vệ tốt hơn.",
};

interface ReportLayoutProps {
  readonly children: ReactNode;
}

export default function ReportLayout({
  children,
}: ReportLayoutProps): ReactElement {
  return <>{children}</>;
}
