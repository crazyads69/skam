import type { ReactElement } from "react";
import { Card } from "@/components/ui/card";

export default function PublicLoading(): ReactElement {
  return (
    <main className="skam-container py-8">
      <Card className="p-5 text-sm text-[var(--text-secondary)]">
        Đang tải dữ liệu công khai...
      </Card>
    </main>
  );
}
