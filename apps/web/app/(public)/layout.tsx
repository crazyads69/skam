import type { Metadata } from "next";
import type { ReactElement, ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "SKAM",
    template: "%s | SKAM",
  },
  description:
    "Nền tảng tra cứu và báo cáo tài khoản ngân hàng có dấu hiệu lừa đảo tại Việt Nam.",
};

interface PublicLayoutProps {
  readonly children: ReactNode;
}

export default function PublicLayout({
  children,
}: PublicLayoutProps): ReactElement {
  return <>{children}</>;
}
