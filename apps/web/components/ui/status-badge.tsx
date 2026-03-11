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
      "bg-(--status-safe-bg) text-(--status-safe) border-(--status-safe)/20",
  },
  danger: {
    label: "Nguy hiểm",
    icon: ShieldAlert,
    className:
      "bg-(--status-danger-bg) text-(--status-danger) border-(--status-danger)/20",
  },
  warning: {
    label: "Đáng ngờ",
    icon: ShieldQuestion,
    className:
      "bg-(--status-warning-bg) text-(--status-warning) border-(--status-warning)/20",
  },
  pending: {
    label: "Đang xem xét",
    icon: Clock,
    className:
      "bg-(--status-pending-bg) text-(--status-pending) border-(--status-pending)/20",
  },
  info: {
    label: "Thông tin",
    icon: Info,
    className:
      "bg-(--status-info-bg) text-(--status-info) border-(--status-info)/20",
  },
} as const;

const caseStatusMap: Record<CaseStatus, keyof typeof statusConfig> = {
  [CaseStatus.APPROVED]: "danger", // Verified scam -> Danger
  [CaseStatus.REJECTED]: "safe", // Rejected report -> Safe (or at least dismissed)
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
      role="img"
      aria-label={label}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
