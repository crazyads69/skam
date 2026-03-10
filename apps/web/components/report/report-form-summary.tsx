import type { ReactElement } from "react";

interface ReportFormSummaryProps {
  status: string;
  platformsLabel: string;
}

export function ReportFormSummary({
  status,
  platformsLabel,
}: ReportFormSummaryProps): ReactElement {
  return (
    <>
      {status ? (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">{status}</p>
      ) : null}
      <p className="mt-3 text-xs text-[var(--text-tertiary)]">
        Nền tảng hỗ trợ liên kết mạng xã hội loại: {platformsLabel}.
      </p>
    </>
  );
}
