import type { ReactElement } from "react";
import Link from "next/link";
import { CaseStatus } from "@skam/shared/types";
import { listAdminCases } from "@/lib/api";
import { requireAdminToken } from "@/lib/admin-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

interface AdminCasesPageProps {
  readonly searchParams: Promise<{ status?: CaseStatus; page?: string }>;
}

export default async function AdminCasesPage({
  searchParams,
}: AdminCasesPageProps): Promise<ReactElement> {
  const token = await requireAdminToken();
  const { status, page: pageParam } = await searchParams;
  const currentPage: number = Math.max(1, Number(pageParam) || 1);
  const pageSize: number = 50;
  const payload = await listAdminCases(
    token,
    status,
    currentPage,
    pageSize,
  ).catch(() => null);
  const selectedStatus: string = status ?? "all";
  const totalPages: number = payload?.totalPages ?? 1;
  return (
    <section className="grid gap-3">
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/cases">
            <Button variant={selectedStatus === "all" ? "neon" : "ghost"}>
              Tất cả
            </Button>
          </Link>
          <Link href={`/admin/cases?status=${CaseStatus.PENDING}`}>
            <Button
              variant={
                selectedStatus === CaseStatus.PENDING ? "neon" : "neon-outline"
              }
            >
              Chờ duyệt
            </Button>
          </Link>
          <Link href={`/admin/cases?status=${CaseStatus.APPROVED}`}>
            <Button
              variant={
                selectedStatus === CaseStatus.APPROVED ? "neon" : "ghost"
              }
            >
              Đã duyệt
            </Button>
          </Link>
          <Link href={`/admin/cases?status=${CaseStatus.REJECTED}`}>
            <Button
              variant={
                selectedStatus === CaseStatus.REJECTED ? "danger" : "ghost"
              }
            >
              Từ chối
            </Button>
          </Link>
        </div>
      </Card>
      {payload?.data?.length === 0 ? (
        <Card className="p-5 text-sm text-[var(--text-secondary)]">
          Không có vụ việc theo bộ lọc hiện tại.
        </Card>
      ) : null}
      {payload?.data?.map((item) => (
        <Link href={`/admin/cases/${item.id}`} key={item.id}>
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between gap-4">
              <p className="font-mono text-sm">
                {item.bankCode} · {item.bankIdentifier}
              </p>
              <StatusBadge status={item.status} />
            </div>
            <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">
              {item.originalDescription}
            </p>
          </Card>
        </Link>
      ))}
      {totalPages > 1 ? (
        <Card className="flex items-center justify-center gap-2 p-4">
          {currentPage > 1 ? (
            <Link
              href={`/admin/cases?${new URLSearchParams({ ...(status ? { status } : {}), page: String(currentPage - 1) }).toString()}`}
            >
              <Button variant="ghost" size="sm">
                &larr; Trước
              </Button>
            </Link>
          ) : null}
          <span className="text-sm text-[var(--text-secondary)]">
            Trang {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link
              href={`/admin/cases?${new URLSearchParams({ ...(status ? { status } : {}), page: String(currentPage + 1) }).toString()}`}
            >
              <Button variant="ghost" size="sm">
                Sau &rarr;
              </Button>
            </Link>
          ) : null}
        </Card>
      ) : null}
    </section>
  );
}
