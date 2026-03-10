import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@skam/shared/types";
import { Calendar, Users } from "lucide-react";
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
      ? "border-[var(--status-danger)]/40"
      : status === "REJECTED"
        ? "border-[var(--status-safe)]/40"
        : "border-[var(--status-pending)]/40";

  return (
    <GlassCard className={cn("p-6", borderColor)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-tertiary)]">{bankName}</p>
          <p className="text-xl font-mono font-semibold tracking-wider">
            {accountNumber}
          </p>
          {scammerName ? (
            <p className="text-sm text-[var(--text-secondary)]">
              {scammerName}
            </p>
          ) : null}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Stats row */}
      <div className="flex gap-6 text-sm text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-4" />
          {reportCount} báo cáo
        </span>
        {lastReported ? (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-4" />
            {lastReported}
          </span>
        ) : null}
      </div>
    </GlassCard>
  );
}
