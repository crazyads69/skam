import type { ReactElement } from "react";
import {
  Clock,
  Info,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { CaseStatus } from "@skam/shared/types";
import { cn } from "@/lib/utils";

type StatusBadgeVariant =
  | CaseStatus
  | "safe"
  | "danger"
  | "warning"
  | "pending"
  | "info";

interface StatusBadgeProps {
  readonly status: StatusBadgeVariant;
}

const statusConfig = {
  safe: {
    label: "An toàn",
    icon: ShieldCheck,
    className:
      "bg-[var(--status-safe-bg)] text-[var(--status-safe)] border-[var(--status-safe)]/20",
  },
  danger: {
    label: "Nguy hiểm",
    icon: ShieldAlert,
    className:
      "bg-[var(--status-danger-bg)] text-[var(--status-danger)] border-[var(--status-danger)]/20",
  },
  warning: {
    label: "Đáng ngờ",
    icon: ShieldQuestion,
    className:
      "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning)]/20",
  },
  pending: {
    label: "Đang xem xét",
    icon: Clock,
    className:
      "bg-[var(--status-pending-bg)] text-[var(--status-pending)] border-[var(--status-pending)]/20",
  },
  info: {
    label: "Thông tin",
    icon: Info,
    className:
      "bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info)]/20",
  },
} as const;

const caseStatusMap: Record<CaseStatus, keyof typeof statusConfig> = {
  [CaseStatus.APPROVED]: "safe",
  [CaseStatus.REJECTED]: "danger",
  [CaseStatus.PENDING]: "pending",
};

function isCaseStatus(value: StatusBadgeVariant): value is CaseStatus {
  return Object.values(CaseStatus).includes(value as CaseStatus);
}

function resolveVariant(status: StatusBadgeVariant): keyof typeof statusConfig {
  if (isCaseStatus(status)) return caseStatusMap[status];
  if (status in statusConfig) return status as keyof typeof statusConfig;
  return "info";
}

export function StatusBadge({ status }: StatusBadgeProps): ReactElement {
  const variant = resolveVariant(status);
  const { label, icon: Icon, className } = statusConfig[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
