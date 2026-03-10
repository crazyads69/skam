import { AmbientGlow } from "@/components/ambient-glow";
import { ResultCard } from "@/components/result-card";
import SearchForm from "@/components/search/search-form";
import { GlassCard } from "@/components/ui/glass-card";
import { getRecentCases, getSummary } from "@/lib/api";
import { CaseStatus } from "@skam/shared/types";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Tra cứu tài khoản lừa đảo",
  description:
    "Tra cứu nhanh tài khoản ngân hàng nghi ngờ lừa đảo và xem báo cáo đã kiểm duyệt.",
};

export default async function HomePage(): Promise<ReactElement> {
  const [summary, recent] = await Promise.all([
    getSummary().catch(() => null),
    getRecentCases(1, 6).catch(() => null),
  ]);
  const totalCases: number = summary?.data?.totalCases ?? 0;
  const totalApprovedCases: number = summary?.data?.totalApprovedCases ?? 0;
  const totalScamAmount: number = summary?.data?.totalScamAmount ?? 0;

  return (
    <>
      <AmbientGlow />
      <main className="skam-container relative z-10 py-12 md:py-20">
        {/* Hero Section */}
        <section className="mx-auto mb-12 max-w-4xl text-center md:mb-16">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--neon-green-ghost)] to-transparent ring-1 ring-[var(--border-neon)] md:size-20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-8 text-neon md:size-10"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground text-glow md:text-6xl">
            Kiểm tra tài khoản ngân hàng
            <br />
            trước khi chuyển tiền
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[var(--text-secondary)] md:text-xl">
            Tra cứu nhanh dấu hiệu lừa đảo và xem lịch sử báo cáo đã được kiểm
            duyệt từ cộng đồng.
          </p>
        </section>

        {/* Search Section */}
        <GlassCard
          variant="neon"
          className="mx-auto mb-16 max-w-3xl p-6 md:p-8"
        >
          <SearchForm />
        </GlassCard>

        {/* Stats Section */}
        <div className="stagger-children mb-20 grid gap-5 sm:grid-cols-3">
          <GlassCard className="hover-lift p-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Tổng vụ việc
            </p>
            <p className="mt-2 font-mono text-3xl font-bold text-neon text-glow-subtle">
              {totalCases.toLocaleString("vi-VN")}
            </p>
          </GlassCard>
          <GlassCard className="hover-lift p-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Báo cáo công khai
            </p>
            <p className="mt-2 font-mono text-3xl font-bold text-neon text-glow-subtle">
              {totalApprovedCases.toLocaleString("vi-VN")}
            </p>
          </GlassCard>
          <GlassCard className="hover-lift p-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Thiệt hại ghi nhận
            </p>
            <p className="mt-2 font-mono text-3xl font-bold text-neon text-glow-subtle">
              {Math.round(totalScamAmount).toLocaleString("vi-VN")}
              <span className="ml-1 text-base font-normal text-[var(--text-tertiary)]">
                VND
              </span>
            </p>
          </GlassCard>
        </div>

        {/* Recent Reports */}
        <section className="grid gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              Báo cáo mới nhất
            </h2>
            <Link
              href="/search"
              className="text-sm font-medium text-neon hover:text-neon-light hover:underline"
            >
              Xem tất cả &rarr;
            </Link>
          </div>
          <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent?.data?.map((item) => (
              <Link href={`/case/${item.id}`} key={item.id} className="block">
                <div className="group h-full transition-transform duration-300 hover:-translate-y-1">
                  <ResultCard
                    status={item.status ?? CaseStatus.PENDING}
                    bankName={item.bankName}
                    accountNumber={item.bankIdentifier}
                    reportCount={item.viewCount} // Assuming viewCount as proxy for interest/activity since report count isn't in DTO
                    lastReported={new Date(item.createdAt).toLocaleDateString(
                      "vi-VN",
                    )}
                    scammerName={item.scammerName}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
