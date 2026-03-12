import type { ReactElement } from "react";
import Link from "next/link";
import { CaseStatus } from "@skam/shared/types";
import { getAdminAnalytics, listAdminCases } from "@/lib/api";
import { requireAdminToken } from "@/lib/admin-auth";
import { Pagination } from "@/components/ui/pagination";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface AdminDashboardPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps): Promise<ReactElement> {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = 20;
  const token = await requireAdminToken();
  const pending = await listAdminCases(
    token,
    CaseStatus.PENDING,
    currentPage,
    pageSize,
  ).catch(() => null);
  const analytics = await getAdminAnalytics(token).catch(() => null);
  const breakdown = analytics?.data?.statusBreakdown ?? {};
  const totalPages = pending?.totalPages ?? 1;
  return (
    <section className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-(--status-warning-bg)">
              <Clock className="size-4.5 text-warning" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-(--text-tertiary)">Hàng chờ duyệt</p>
              <p className="font-mono text-xl font-bold text-neon">
                {(pending?.total ?? 0).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-neon-ghost">
              <AlertTriangle
                className="size-4.5 text-neon"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-xs text-(--text-tertiary)">Tổng vụ việc</p>
              <p className="font-mono text-xl font-bold text-neon">
                {(analytics?.data?.totalCases ?? 0).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-(--status-safe-bg)">
              <CheckCircle className="size-4.5 text-safe" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-(--text-tertiary)">Đã duyệt</p>
              <p className="font-mono text-xl font-bold text-neon">
                {(breakdown[CaseStatus.APPROVED] ?? 0).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-(--status-danger-bg)">
              <XCircle className="size-4.5 text-danger" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-(--text-tertiary)">Từ chối</p>
              <p className="font-mono text-xl font-bold text-neon">
                {(breakdown[CaseStatus.REJECTED] ?? 0).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5">
        <p className="mb-3 text-sm font-medium">Top tài khoản bị báo cáo</p>
        <ul className="space-y-2 text-sm">
          {(analytics?.data?.topReportedAccounts ?? []).map((item) => (
            <li
              key={`${item.bankCode}-${item.bankIdentifier}`}
              className="flex items-center gap-2 rounded-lg border border-(--border-default) p-2.5"
            >
              <span className="font-mono text-neon">{item.bankCode}</span>
              <span className="text-(--text-tertiary)">·</span>
              <span className="font-mono">{item.bankIdentifier}</span>
              <span className="ml-auto rounded-full bg-neon-ghost px-2 py-0.5 text-xs font-medium text-neon">
                {item.count.toLocaleString("vi-VN")} báo cáo
              </span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <div className="space-y-3">
        {pending?.data?.map((item) => (
          <GlassCard key={item.id} className="p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="font-mono text-sm font-medium">
                {item.bankCode} · {item.bankIdentifier}
              </p>
              <StatusBadge status={item.status} />
            </div>
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-(--text-secondary)">
              {item.originalDescription}
            </p>
            <Link href={`/admin/cases/${item.id}`}>
              <Button variant="neon-outline" size="sm">
                Xem chi tiết
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </GlassCard>
        ))}
      </div>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        previousHref={`/admin?page=${currentPage - 1}`}
        nextHref={`/admin?page=${currentPage + 1}`}
      />
    </section>
  );
}
