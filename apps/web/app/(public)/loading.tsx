import type { ReactElement } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

export default function PublicLoading(): ReactElement {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Đang tải dữ liệu"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20"
    >
      <div className="relative">
        <ShieldCheck
          className="size-10 text-neon/30"
          aria-hidden="true"
          strokeWidth={1.5}
        />
        <Loader2 className="absolute inset-0 m-auto size-6 animate-spin text-neon" />
      </div>
      <p className="text-sm text-(--text-secondary)">Đang tải dữ liệu...</p>
    </div>
  );
}
