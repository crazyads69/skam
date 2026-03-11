import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

interface ReportFormSummaryProps {
  status: string;
  platformsLabel: string;
}

export function ReportFormSummary({
  status,
  platformsLabel,
}: ReportFormSummaryProps): ReactElement {
  const isSuccess = status.includes("thành công");
  return (
    <>
      {status ? (
        <div
          role="alert"
          className={cn(
            "mt-4 rounded-lg border p-3 text-sm",
            isSuccess
              ? "border-safe/20 bg-(--status-safe-bg) text-safe"
              : "border-danger/20 bg-(--status-danger-bg) text-danger",
          )}
        >
          {status}
        </div>
      ) : null}
      <p className="mt-3 text-xs text-(--text-tertiary)">
        Nền tảng hỗ trợ liên kết mạng xã hội loại: {platformsLabel}.
      </p>
    </>
  );
}
