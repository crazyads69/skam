import type { ReactElement } from "react";
import Link from "next/link";
import { CaseStatus } from "@skam/shared/types";
import { getAdminAnalytics, listAdminCases } from "@/lib/api";
import { requireAdminToken } from "@/lib/admin-auth";
import { Pagination } from "@/components/ui/pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

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
        <Card className="p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Hàng chờ duyệt</p>
          <p className="mt-2 font-mono text-2xl text-neon">
            {(pending?.total ?? 0).toLocaleString("vi-VN")}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Tổng vụ việc</p>
          <p className="mt-2 font-mono text-2xl text-neon">
            {(analytics?.data?.totalCases ?? 0).toLocaleString("vi-VN")}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Đã duyệt</p>
          <p className="mt-2 font-mono text-2xl text-neon">
            {(breakdown[CaseStatus.APPROVED] ?? 0).toLocaleString("vi-VN")}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Từ chối</p>
          <p className="mt-2 font-mono text-2xl text-neon">
            {(breakdown[CaseStatus.REJECTED] ?? 0).toLocaleString("vi-VN")}
          </p>
        </Card>
      </div>
      <Card className="p-4">
        <p className="mb-2 text-sm font-medium">Top tài khoản bị báo cáo</p>
        <ul className="grid gap-2 text-sm">
          {(analytics?.data?.topReportedAccounts ?? []).map((item) => (
            <li key={`${item.bankCode}-${item.bankIdentifier}`}>
              <span className="font-mono">{item.bankCode}</span> ·{" "}
              <span className="font-mono">{item.bankIdentifier}</span> ·{" "}
              <span className="text-[var(--text-secondary)]">
                {item.count.toLocaleString("vi-VN")} báo cáo
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="grid gap-3">
        {pending?.data?.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="font-mono text-sm">
                {item.bankCode} · {item.bankIdentifier}
              </p>
              <StatusBadge status={item.status} />
            </div>
            <p className="mb-3 line-clamp-2 text-sm text-[var(--text-secondary)]">
              {item.originalDescription}
            </p>
            <Link href={`/admin/cases/${item.id}`}>
              <Button variant="neon-outline">Xem chi tiết</Button>
            </Link>
          </Card>
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
