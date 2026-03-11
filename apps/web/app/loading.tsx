import type { ReactElement } from "react";
import { Loader2 } from "lucide-react";

export default function LoadingPage(): ReactElement {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Đang tải dữ liệu"
      className="flex flex-col items-center justify-center gap-3 py-20"
    >
      <Loader2 className="size-8 animate-spin text-neon" />
      <p className="text-sm text-(--text-secondary)">Đang tải dữ liệu...</p>
    </div>
  );
}
