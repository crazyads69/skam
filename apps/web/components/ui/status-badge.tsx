import type { ReactElement } from "react";
import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { CaseStatus } from "@skam/shared/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  readonly status: CaseStatus;
}

export function StatusBadge({ status }: StatusBadgeProps): ReactElement {
  const variant =
    status === CaseStatus.APPROVED
      ? "bg-[var(--status-safe-bg)] text-safe border-safe/30"
      : status === CaseStatus.REJECTED
        ? "bg-[var(--status-danger-bg)] text-danger border-danger/30"
        : "bg-[var(--status-warning-bg)] text-warning border-warning/30";
  const Icon =
    status === CaseStatus.APPROVED
      ? ShieldCheck
      : status === CaseStatus.REJECTED
        ? ShieldAlert
        : ShieldQuestion;
  const label =
    status === CaseStatus.APPROVED
      ? "Đã duyệt"
      : status === CaseStatus.REJECTED
        ? "Từ chối"
        : "Chờ duyệt";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        variant,
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
