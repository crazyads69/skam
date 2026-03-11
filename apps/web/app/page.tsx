import { AmbientGlow } from "@/components/ambient-glow";
import { ResultCard } from "@/components/result-card";
import SearchForm from "@/components/search/search-form";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { getRecentCases, getSummary } from "@/lib/api";
import { CaseStatus } from "@skam/shared/types";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  FileText,
  Search,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";

export const metadata: Metadata = {
  title: "Tra cứu tài khoản lừa đảo",
  description:
    "Tra cứu nhanh tài khoản ngân hàng nghi ngờ lừa đảo và xem báo cáo đã kiểm duyệt.",
};

export default async function HomePage(): Promise<ReactElement> {
  const RECENT_CASES_LIMIT = 6;
  const [summary, recent] = await Promise.all([
    getSummary().catch(() => null),
    getRecentCases(1, RECENT_CASES_LIMIT).catch(() => null),
  ]);
  const totalCases: number = summary?.data?.totalCases ?? 0;
  const totalApprovedCases: number = summary?.data?.totalApprovedCases ?? 0;
  const totalScamAmount: number = summary?.data?.totalScamAmount ?? 0;

  return (
    <>
      <AmbientGlow />
      <main className="relative z-10">
        {/* ─── Hero Section ─── */}
        <section className="skam-container py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Animated shield icon */}
            <div className="mb-8 flex justify-center">
              <div className="animate-shield-float relative flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-neon-ghost to-transparent ring-1 ring-(--border-neon) md:size-24">
                <ShieldCheck
                  className="size-10 text-neon md:size-12"
                  aria-hidden="true"
                  strokeWidth={1.5}
                />
                {/* Subtle pulse ring */}
                <div className="animate-neon-pulse absolute inset-0 rounded-2xl" />
              </div>
            </div>

            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              <span className="shimmer-text">Kiểm tra tài khoản</span>
              <br />
              trước khi chuyển tiền
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-(--text-secondary) md:text-xl">
              Tra cứu nhanh dấu hiệu lừa đảo và xem lịch sử báo cáo đã được kiểm
              duyệt từ cộng đồng.
            </p>

            {/* Search — the primary CTA */}
            <GlassCard variant="neon" className="mx-auto max-w-3xl p-6 md:p-8">
              <SearchForm />
            </GlassCard>
          </div>
        </section>

        {/* ─── Stats Section ─── */}
        <section className="skam-container pb-16 md:pb-20">
          <div className="stagger-children grid gap-4 sm:grid-cols-3 md:gap-6">
            <GlassCard className="hover-lift group p-6 text-center md:p-8">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-(--status-danger-bg)">
                <AlertTriangle
                  className="size-5 text-danger"
                  aria-hidden="true"
                />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-(--text-tertiary)">
                Tổng vụ việc
              </p>
              <p className="animate-count-up mt-2 font-mono text-3xl font-bold text-foreground md:text-4xl">
                {totalCases.toLocaleString("vi-VN")}
              </p>
            </GlassCard>
            <GlassCard className="hover-lift group p-6 text-center md:p-8">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-(--status-safe-bg)">
                <CheckCircle className="size-5 text-safe" aria-hidden="true" />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-(--text-tertiary)">
                Báo cáo công khai
              </p>
              <p className="animate-count-up mt-2 font-mono text-3xl font-bold text-neon text-glow-subtle md:text-4xl">
                {totalApprovedCases.toLocaleString("vi-VN")}
              </p>
            </GlassCard>
            <GlassCard className="hover-lift group p-6 text-center md:p-8">
              <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-(--status-warning-bg)">
                <AlertTriangle
                  className="size-5 text-warning"
                  aria-hidden="true"
                />
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-(--text-tertiary)">
                Thiệt hại ghi nhận
              </p>
              <p className="animate-count-up mt-2 font-mono text-2xl font-bold text-foreground md:text-3xl">
                {Math.round(totalScamAmount).toLocaleString("vi-VN")}
                <span className="ml-1 text-sm font-normal text-(--text-tertiary)">
                  VND
                </span>
              </p>
            </GlassCard>
          </div>
        </section>

        {/* ─── How It Works Section ─── */}
        <section className="border-y border-(--border-default) bg-(--surface-0)/80 py-16 md:py-20">
          <div className="skam-container">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
                Cách hoạt động
              </h2>
              <p className="mx-auto max-w-lg text-(--text-secondary)">
                3 bước đơn giản để bảo vệ bạn và cộng đồng khỏi lừa đảo
              </p>
            </div>
            <div className="stagger-children mx-auto grid max-w-4xl gap-6 md:grid-cols-3 md:gap-8">
              {/* Step 1 */}
              <GlassCard className="hover-neon-border relative p-6 text-center md:p-8">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-neon-ghost ring-1 ring-(--border-neon)">
                  <Search className="size-6 text-neon" aria-hidden="true" />
                </div>
                <div className="mb-2 font-mono text-xs text-neon">01</div>
                <h3 className="mb-2 text-lg font-semibold">Tra cứu</h3>
                <p className="text-sm leading-relaxed text-(--text-secondary)">
                  Nhập số tài khoản hoặc tên người nhận để kiểm tra nhanh lịch
                  sử báo cáo lừa đảo.
                </p>
              </GlassCard>

              {/* Step 2 */}
              <GlassCard className="hover-neon-border relative p-6 text-center md:p-8">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-neon-ghost ring-1 ring-(--border-neon)">
                  <FileText className="size-6 text-neon" aria-hidden="true" />
                </div>
                <div className="mb-2 font-mono text-xs text-neon">02</div>
                <h3 className="mb-2 text-lg font-semibold">Báo cáo</h3>
                <p className="text-sm leading-relaxed text-(--text-secondary)">
                  Nếu bạn là nạn nhân, hãy gửi báo cáo chi tiết để cảnh báo cộng
                  đồng.
                </p>
              </GlassCard>

              {/* Step 3 */}
              <GlassCard className="hover-neon-border relative p-6 text-center md:p-8">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-neon-ghost ring-1 ring-(--border-neon)">
                  <ShieldCheck
                    className="size-6 text-neon"
                    aria-hidden="true"
                  />
                </div>
                <div className="mb-2 font-mono text-xs text-neon">03</div>
                <h3 className="mb-2 text-lg font-semibold">Kiểm duyệt</h3>
                <p className="text-sm leading-relaxed text-(--text-secondary)">
                  Đội ngũ quản trị viên xác minh báo cáo và công khai kết quả
                  cho cộng đồng.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* ─── Trust Signals ─── */}
        <section className="skam-container py-16 md:py-20">
          <GlassCard
            variant="elevated"
            className="mx-auto flex max-w-3xl flex-col items-center gap-8 p-8 text-center md:flex-row md:p-10 md:text-left"
          >
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex -space-x-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-surface-3 ring-2 ring-surface-1">
                  <Users className="size-5 text-neon" aria-hidden="true" />
                </div>
                <div className="flex size-10 items-center justify-center rounded-full bg-surface-3 ring-2 ring-surface-1">
                  <Shield className="size-5 text-info" aria-hidden="true" />
                </div>
                <div className="flex size-10 items-center justify-center rounded-full bg-surface-3 ring-2 ring-surface-1">
                  <CheckCircle
                    className="size-5 text-safe"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Được cộng đồng tin cậy
              </h3>
              <p className="text-sm leading-relaxed text-(--text-secondary)">
                Mọi báo cáo đều được xác minh bởi đội ngũ kiểm duyệt. Dữ liệu
                chỉ được công khai sau khi đã đánh giá cẩn thận — đảm bảo độ
                chính xác và minh bạch.
              </p>
            </div>
          </GlassCard>
        </section>

        {/* ─── Recent Reports ─── */}
        {recent?.data && recent.data.length > 0 && (
          <section className="skam-container pb-16 md:pb-20">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">
                Báo cáo mới nhất
              </h2>
              <Link
                href="/search"
                className="group inline-flex items-center gap-1 text-sm font-medium text-neon hover:text-neon-light"
              >
                Xem tất cả
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
            <div className="stagger-children grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.data.map((item) => (
                <Link
                  href={`/case/${item.id}`}
                  key={item.id}
                  className="block cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-neon focus-visible:outline-offset-2"
                >
                  <div className="group h-full transition-transform duration-300 hover:-translate-y-1">
                    <ResultCard
                      status={item.status ?? CaseStatus.PENDING}
                      bankName={item.bankName}
                      accountNumber={item.bankIdentifier}
                      reportCount={item.viewCount}
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
        )}

        {/* ─── Bottom CTA ─── */}
        <section className="border-t border-(--border-default) bg-(--surface-0)/80 py-16 md:py-20">
          <div className="skam-container text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
              Đã từng bị lừa đảo?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-(--text-secondary)">
              Hãy gửi báo cáo để cảnh báo cộng đồng và giúp ngăn chặn người khác
              trở thành nạn nhân tiếp theo.
            </p>
            <Link href="/report">
              <Button variant="neon" size="xl">
                Gửi báo cáo ngay
                <ArrowRight className="size-5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
