import type { ReactElement } from "react";
import Link from "next/link";
import { CaseStatus } from "@skam/shared/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRecentCases, getSummary } from "@/lib/api";
import SearchForm from "@/components/search/search-form";

export default async function HomePage(): Promise<ReactElement> {
  const summary = await getSummary().catch(() => null);
  const recent = await getRecentCases(1, 6).catch(() => null);
  const totalCases: number = summary?.data?.totalCases ?? 0;
  const totalApprovedCases: number = summary?.data?.totalApprovedCases ?? 0;
  const totalScamAmount: number = summary?.data?.totalScamAmount ?? 0;
  return (
    <main className="skam-container py-10">
      <section className="mx-auto mb-8 max-w-4xl text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Kiểm tra tài khoản ngân hàng trước khi chuyển tiền
        </h1>
        <p className="mx-auto max-w-2xl text-base text-[var(--text-secondary)] sm:text-lg">
          Tra cứu nhanh dấu hiệu lừa đảo và xem lịch sử báo cáo đã được kiểm
          duyệt từ cộng đồng.
        </p>
      </section>
      <Card className="mx-auto mb-8 max-w-4xl p-5 sm:p-6">
        <SearchForm />
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Tổng vụ việc</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-neon">
            {totalCases.toLocaleString("vi-VN")}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Báo cáo công khai</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-neon">
            {totalApprovedCases.toLocaleString("vi-VN")}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Thiệt hại ghi nhận</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-neon">
            {Math.round(totalScamAmount).toLocaleString("vi-VN")} VND
          </p>
        </Card>
      </div>
      <section className="mt-8 grid gap-4">
        <h2 className="text-xl font-semibold">Báo cáo mới nhất</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recent?.data?.map((item) => (
            <Link href={`/case/${item.id}`} key={item.id}>
              <Card className="h-full p-4 transition-all hover:border-[var(--border-hover)]">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-mono text-sm">
                    {item.bankCode} · {item.bankIdentifier}
                  </p>
                  <StatusBadge status={item.status ?? CaseStatus.PENDING} />
                </div>
                <p className="line-clamp-3 text-sm text-[var(--text-secondary)]">
                  {item.refinedDescription ?? item.originalDescription}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
