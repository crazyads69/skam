import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@skam/shared/types";
import { Calendar, Eye } from "lucide-react";
import type { ReactElement } from "react";

interface ResultCardProps {
  status: CaseStatus;
  bankName: string;
  accountNumber: string;
  reportCount: number;
  lastReported?: string;
  scammerName?: string | null;
}

export function ResultCard({
  status,
  bankName,
  accountNumber,
  reportCount,
  lastReported,
  scammerName,
}: ResultCardProps): ReactElement {
  const borderColor =
    status === "APPROVED"
      ? "border-danger/40"
      : status === "REJECTED"
        ? "border-safe/40"
        : "border-pending/40";

  return (
    <GlassCard className={cn("hover-neon-border p-6", borderColor)}>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-(--text-tertiary)">{bankName}</p>
          <p className="truncate font-mono text-xl font-semibold tracking-wider">
            {accountNumber}
          </p>
          {scammerName ? (
            <p
              className="truncate text-sm text-(--text-secondary)"
              title={scammerName}
            >
              {scammerName}
            </p>
          ) : null}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Stats row */}
      <div className="flex gap-5 text-sm text-(--text-secondary)">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="size-4" aria-hidden="true" />
          {reportCount} lượt xem
        </span>
        {lastReported ? (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-4" aria-hidden="true" />
            {lastReported}
          </span>
        ) : null}
      </div>
    </GlassCard>
  );
}
