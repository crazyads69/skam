import type { ReactElement } from "react";
import Link from "next/link";
import { CaseStatus } from "@skam/shared/types";
import { getAdminAnalytics, listAdminCases } from "@/lib/api";
import { getAdminTokenFromCookie } from "@/lib/admin-auth";
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
  const token = await getAdminTokenFromCookie();
  const pending = token
    ? await listAdminCases(token, CaseStatus.PENDING, currentPage, pageSize).catch(() => null)
    : null;
  const analytics = token ? await getAdminAnalytics(token).catch(() => null) : null;
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
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {currentPage > 1 && (
            <Link href={`/admin?page=${currentPage - 1}`}>
              <Button variant="neon-outline" size="default">
                ← Trang trước
              </Button>
            </Link>
          )}
          <span className="text-sm text-[var(--text-secondary)]">
            Trang {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link href={`/admin?page=${currentPage + 1}`}>
              <Button variant="neon-outline" size="default">
                Trang sau →
              </Button>
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
