import { AmbientGlow } from "@/components/ambient-glow";
import { AnimatedCounter } from "@/components/landing/animated-counter";
import { FaqSection } from "@/components/landing/faq-section";
import { FloatingParticles } from "@/components/landing/floating-particles";
import { ScamTicker } from "@/components/landing/scam-ticker";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
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
  Eye,
  FileText,
  HelpCircle,
  Lock,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
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
        <section className="hero-scanline relative overflow-hidden py-20 md:py-32 lg:py-40">
          {/* Grid background */}
          <div
            className="hero-grid pointer-events-none absolute inset-0"
            aria-hidden="true"
          />
          {/* Floating particles */}
          <FloatingParticles />
          {/* Glow line at bottom */}
          <div
            className="glow-line-animated pointer-events-none absolute inset-x-0 bottom-0"
            aria-hidden="true"
          />

          <div className="skam-container relative">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-(--border-neon) bg-neon-ghost px-4 py-1.5">
                <div className="animate-pulse-dot size-2 rounded-full bg-neon" />
                <span className="text-xs font-medium text-neon">
                  Nền tảng chống lừa đảo #1 Việt Nam
                </span>
              </div>

              {/* Shield icon */}
              <div className="mb-8 flex justify-center">
                <div className="relative flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-neon-ghost to-transparent ring-1 ring-(--border-neon) md:size-24">
                  <ShieldCheck
                    className="size-10 text-neon md:size-12"
                    aria-hidden="true"
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl">
                <span className="shimmer-text">Kiểm tra tài khoản</span>
                <br />
                <span className="text-(--text-secondary)">
                  trước khi chuyển tiền
                </span>
              </h1>
              <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-(--text-secondary) md:text-xl">
                Tra cứu nhanh dấu hiệu lừa đảo và xem lịch sử báo cáo đã được
                kiểm duyệt từ cộng đồng.
              </p>

              {/* Search — the primary CTA */}
              <GlassCard
                variant="neon"
                className="mx-auto max-w-3xl p-6 md:p-8"
              >
                <SearchForm />
                <p className="mt-3 text-xs text-(--text-tertiary)">
                  <Lock
                    className="mr-1 inline-block size-3"
                    aria-hidden="true"
                  />
                  Tra cứu hoàn toàn ẩn danh &mdash; không lưu thông tin cá nhân
                </p>
              </GlassCard>

              {/* Quick stats below search */}
              {totalApprovedCases > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-(--text-tertiary) md:gap-6">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldAlert
                      className="size-4 text-danger"
                      aria-hidden="true"
                    />
                    {totalCases.toLocaleString("vi-VN")} vụ được báo cáo
                  </span>
                  <span className="hidden h-4 w-px bg-(--border-default) sm:block" />
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle
                      className="size-4 text-safe"
                      aria-hidden="true"
                    />
                    {totalApprovedCases.toLocaleString("vi-VN")} đã xác minh
                  </span>
                  <span className="hidden h-4 w-px bg-(--border-default) sm:block" />
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4 text-info" aria-hidden="true" />
                    Cộng đồng tin cậy
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── Scam Ticker ─── */}
        <ScamTicker />

        {/* ─── Stats Section ─── */}
        <section className="skam-container pb-16 pt-12 md:pb-20 md:pt-16">
          <div className="grid gap-4 sm:grid-cols-3 md:gap-6">
            <ScrollReveal delay={0}>
              <GlassCard className="bento-card group p-6 text-center md:p-8">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-(--status-danger-bg) ring-1 ring-(--status-danger)/20">
                  <AlertTriangle
                    className="size-6 text-danger"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-(--text-tertiary)">
                  Tổng vụ việc
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-foreground md:text-4xl">
                  <AnimatedCounter end={totalCases} />
                </p>
              </GlassCard>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <GlassCard className="bento-card group p-6 text-center md:p-8">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-(--status-safe-bg) ring-1 ring-(--status-safe)/20">
                  <CheckCircle
                    className="size-6 text-safe"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-(--text-tertiary)">
                  Báo cáo công khai
                </p>
                <p className="mt-2 font-mono text-3xl font-bold text-neon text-glow-subtle md:text-4xl">
                  <AnimatedCounter end={totalApprovedCases} />
                </p>
              </GlassCard>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <GlassCard className="bento-card group p-6 text-center md:p-8">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-(--status-warning-bg) ring-1 ring-(--status-warning)/20">
                  <AlertTriangle
                    className="size-6 text-warning"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-(--text-tertiary)">
                  Thiệt hại ghi nhận
                </p>
                <p className="mt-2 font-mono text-2xl font-bold text-foreground md:text-3xl">
                  <AnimatedCounter
                    end={Math.round(totalScamAmount)}
                    suffix=" VND"
                  />
                </p>
              </GlassCard>
            </ScrollReveal>
          </div>
        </section>

        {/* ─── How It Works Section ─── */}
        <section className="border-y border-(--border-default) bg-(--surface-0)/80 py-16 md:py-20">
          <div className="skam-container">
            <ScrollReveal>
              <div className="mb-12 text-center">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-neon-ghost px-3 py-1 text-xs font-medium text-neon">
                  <Zap className="size-3" aria-hidden="true" />
                  Đơn giản &amp; nhanh chóng
                </div>
                <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
                  Cách hoạt động
                </h2>
                <p className="mx-auto max-w-lg text-(--text-secondary)">
                  3 bước đơn giản để bảo vệ bạn và cộng đồng khỏi lừa đảo
                </p>
              </div>
            </ScrollReveal>
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3 md:gap-4">
              {/* Step 1 */}
              <ScrollReveal delay={0}>
                <div className="step-connector h-full">
                  <GlassCard className="hover-neon-border gradient-border relative h-full p-6 text-center md:p-8">
                    <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-neon-ghost ring-1 ring-(--border-neon)">
                      <Search className="size-7 text-neon" aria-hidden="true" />
                    </div>
                    <div className="mb-2 font-mono text-sm font-bold text-neon">
                      01
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Tra cứu</h3>
                    <p className="text-sm leading-relaxed text-(--text-secondary)">
                      Nhập số tài khoản hoặc tên người nhận để kiểm tra nhanh
                      lịch sử báo cáo lừa đảo.
                    </p>
                  </GlassCard>
                </div>
              </ScrollReveal>

              {/* Step 2 */}
              <ScrollReveal delay={150}>
                <div className="step-connector h-full">
                  <GlassCard className="hover-neon-border gradient-border relative h-full p-6 text-center md:p-8">
                    <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-neon-ghost ring-1 ring-(--border-neon)">
                      <FileText
                        className="size-7 text-neon"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mb-2 font-mono text-sm font-bold text-neon">
                      02
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Báo cáo</h3>
                    <p className="text-sm leading-relaxed text-(--text-secondary)">
                      Nếu bạn là nạn nhân, hãy gửi báo cáo chi tiết để cảnh báo
                      cộng đồng.
                    </p>
                  </GlassCard>
                </div>
              </ScrollReveal>

              {/* Step 3 */}
              <ScrollReveal delay={300}>
                <div className="h-full">
                  <GlassCard className="hover-neon-border gradient-border relative h-full p-6 text-center md:p-8">
                    <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-neon-ghost ring-1 ring-(--border-neon)">
                      <ShieldCheck
                        className="size-7 text-neon"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mb-2 font-mono text-sm font-bold text-neon">
                      03
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Kiểm duyệt</h3>
                    <p className="text-sm leading-relaxed text-(--text-secondary)">
                      Đội ngũ quản trị viên xác minh báo cáo và công khai kết
                      quả cho cộng đồng.
                    </p>
                  </GlassCard>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ─── Features / Why SKAM — Bento Grid ─── */}
        <section className="skam-container py-16 md:py-20">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
                Tại sao chọn SKAM?
              </h2>
              <p className="mx-auto max-w-lg text-(--text-secondary)">
                Nền tảng được thiết kế dành riêng cho người Việt Nam
              </p>
            </div>
          </ScrollReveal>
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
            {/* Large card — spans 2 cols */}
            <ScrollReveal delay={0} className="lg:col-span-2 lg:row-span-2">
              <GlassCard className="bento-card cyber-line flex h-full flex-col justify-between p-8">
                <div>
                  <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-neon-ghost ring-1 ring-(--border-neon)">
                    <Eye className="size-6 text-neon" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">
                    Ẩn danh hoàn toàn
                  </h3>
                  <p className="text-sm leading-relaxed text-(--text-secondary)">
                    Không cần đăng ký. Mọi tra cứu và báo cáo đều ẩn danh tuyệt
                    đối. Địa chỉ IP được mã hóa SHA-256 — không ai có thể truy
                    vết danh tính của bạn.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs text-(--text-tertiary)">
                  <Lock className="size-3.5" aria-hidden="true" />
                  <span className="font-mono">End-to-end privacy</span>
                </div>
              </GlassCard>
            </ScrollReveal>

            {/* Small card top-right */}
            <ScrollReveal delay={100}>
              <GlassCard className="bento-card p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-neon-ghost">
                  <Sparkles className="size-5 text-neon" aria-hidden="true" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">Miễn phí 100%</h3>
                <p className="text-xs leading-relaxed text-(--text-secondary)">
                  Dịch vụ cộng đồng phi lợi nhuận. Không quảng cáo, không phí
                  ẩn.
                </p>
              </GlassCard>
            </ScrollReveal>

            {/* Small card middle-right */}
            <ScrollReveal delay={200}>
              <GlassCard className="bento-card p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-neon-ghost">
                  <Shield className="size-5 text-neon" aria-hidden="true" />
                </div>
                <h3 className="mb-1 text-sm font-semibold">Đã xác minh</h3>
                <p className="text-xs leading-relaxed text-(--text-secondary)">
                  Mọi báo cáo đều được kiểm duyệt thủ công trước khi công khai.
                </p>
              </GlassCard>
            </ScrollReveal>

            {/* Wide card bottom — spans 2 cols */}
            <ScrollReveal delay={300} className="lg:col-span-2">
              <GlassCard className="bento-card flex h-full items-center gap-5 p-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-neon-ghost ring-1 ring-(--border-neon)">
                  <Zap className="size-6 text-neon" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-semibold">
                    Tra cứu tức thì
                  </h3>
                  <p className="text-xs leading-relaxed text-(--text-secondary)">
                    Kết quả trả về trong vài giây. Kiểm tra ngay trước khi
                    chuyển tiền — bảo vệ bạn theo thời gian thực.
                  </p>
                </div>
              </GlassCard>
            </ScrollReveal>
          </div>
        </section>

        {/* ─── Trust Signals ─── */}
        <section className="border-y border-(--border-default) bg-(--surface-0)/80 py-16 md:py-20">
          <div className="skam-container">
            <ScrollReveal direction="scale">
              <GlassCard
                variant="elevated"
                className="mx-auto flex max-w-3xl flex-col items-center gap-8 p-8 text-center md:flex-row md:p-10 md:text-left"
              >
                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex -space-x-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-surface-3 ring-2 ring-surface-1">
                      <Users className="size-6 text-neon" aria-hidden="true" />
                    </div>
                    <div className="flex size-12 items-center justify-center rounded-full bg-surface-3 ring-2 ring-surface-1">
                      <Shield className="size-6 text-info" aria-hidden="true" />
                    </div>
                    <div className="flex size-12 items-center justify-center rounded-full bg-surface-3 ring-2 ring-surface-1">
                      <CheckCircle
                        className="size-6 text-safe"
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
                    Mọi báo cáo đều được xác minh bởi đội ngũ kiểm duyệt. Dữ
                    liệu chỉ được công khai sau khi đã đánh giá cẩn thận — đảm
                    bảo độ chính xác và minh bạch.
                  </p>
                </div>
              </GlassCard>
            </ScrollReveal>
          </div>
        </section>

        {/* ─── Recent Reports ─── */}
        {recent?.data && recent.data.length > 0 && (
          <section className="skam-container py-16 md:py-20">
            <ScrollReveal>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Báo cáo mới nhất
                  </h2>
                  <p className="mt-1 text-sm text-(--text-secondary)">
                    Các vụ lừa đảo vừa được xác minh bởi cộng đồng
                  </p>
                </div>
                <Link
                  href="/search"
                  className="group inline-flex items-center gap-1 rounded-lg border border-(--border-default) px-4 py-2 text-sm font-medium text-neon transition-all hover:border-(--border-neon) hover:shadow-(--shadow-neon)"
                >
                  Xem tất cả
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </ScrollReveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.data.map((item, index) => (
                <ScrollReveal key={item.id} delay={index * 80}>
                  <Link
                    href={`/case/${item.id}`}
                    className="block cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-neon focus-visible:outline-offset-2"
                  >
                    <div className="group h-full transition-transform duration-300 hover:-translate-y-1">
                      <ResultCard
                        status={item.status ?? CaseStatus.PENDING}
                        bankName={item.bankName}
                        accountNumber={item.bankIdentifier}
                        reportCount={item.viewCount}
                        lastReported={new Date(
                          item.createdAt,
                        ).toLocaleDateString("vi-VN")}
                        scammerName={item.scammerName}
                      />
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}

        {/* ─── FAQ Section ─── */}
        <section className="border-y border-(--border-default) bg-(--surface-0)/80 py-16 md:py-20">
          <div className="skam-container">
            <ScrollReveal>
              <div className="mb-10 text-center">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-neon-ghost px-3 py-1 text-xs font-medium text-neon">
                  <HelpCircle className="size-3" aria-hidden="true" />
                  Câu hỏi thường gặp
                </div>
                <h2 className="mb-3 text-2xl font-bold tracking-tight md:text-3xl">
                  Bạn cần biết gì?
                </h2>
                <p className="mx-auto max-w-lg text-(--text-secondary)">
                  Giải đáp những thắc mắc phổ biến về nền tảng SKAM
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={150}>
              <FaqSection />
            </ScrollReveal>
          </div>
        </section>

        {/* ─── Bottom CTA ─── */}
        <section className="relative py-20 md:py-28">
          {/* Decorative glow */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden="true"
          >
            <div
              className="animate-radial-pulse absolute top-1/2 left-1/2 size-96 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, var(--neon-green), transparent 70%)",
              }}
            />
          </div>

          <div className="skam-container relative text-center">
            <ScrollReveal direction="scale">
              <ShieldAlert
                className="mx-auto mb-6 size-14 text-danger md:size-16"
                aria-hidden="true"
                strokeWidth={1.5}
              />
              <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
                Đã từng bị lừa đảo?
              </h2>
              <p className="mx-auto mb-10 max-w-lg text-lg text-(--text-secondary)">
                Hãy gửi báo cáo để cảnh báo cộng đồng và giúp ngăn chặn người
                khác trở thành nạn nhân tiếp theo.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/report">
                  <Button variant="neon" size="xl">
                    Gửi báo cáo ngay
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="neon-outline" size="xl">
                    Tra cứu tài khoản
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </>
  );
}
