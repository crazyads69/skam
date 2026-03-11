import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getProfile } from "@/lib/api";
import { formatMoneyVnd } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  FileText,
  Shield,
} from "lucide-react";

interface ProfilePageProps {
  readonly params: Promise<{ identifier: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { identifier } = await params;
  return {
    title: `Hồ sơ ${identifier}`,
    description:
      "Xem hồ sơ tổng hợp các vụ việc đã duyệt liên quan đến tài khoản ngân hàng này.",
  };
}

export default async function ProfilePage({
  params,
}: ProfilePageProps): Promise<ReactElement> {
  const { identifier } = await params;
  const response = await getProfile(identifier).catch(() => null);
  const profile = response?.data;
  if (!response?.success || !profile) notFound();
  return (
    <main className="skam-container py-8 md:py-12">
      {/* Back nav */}
      <div className="mb-6">
        <Link
          href="/search"
          className="group inline-flex items-center gap-1.5 text-sm text-(--text-secondary) transition-colors hover:text-neon"
        >
          <ArrowLeft
            className="size-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
          Quay lại tra cứu
        </Link>
      </div>

      <div className="mx-auto max-w-3xl space-y-4">
        {/* Profile header */}
        <GlassCard variant="neon" className="p-6 md:p-8">
          <div className="mb-1 flex items-center gap-2 text-xs text-(--text-tertiary)">
            <Shield className="size-3.5" aria-hidden="true" />
            Hồ sơ tài khoản đã tổng hợp
          </div>
          <h1 className="font-mono text-2xl font-bold md:text-3xl">
            {profile.bankIdentifier}
          </h1>
        </GlassCard>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-(--status-danger-bg)">
                <AlertTriangle
                  className="size-4.5 text-danger"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-xs text-(--text-tertiary)">Tổng vụ</p>
                <p className="font-mono text-sm font-semibold">
                  {profile.totalCases.toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-(--status-warning-bg)">
                <Banknote
                  className="size-4.5 text-warning"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-xs text-(--text-tertiary)">Tổng tiền</p>
                <p className="font-mono text-sm font-semibold text-danger">
                  {formatMoneyVnd(profile.totalAmount)}
                </p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-neon-ghost">
                <Shield className="size-4.5 text-neon" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-(--text-tertiary)">Ngân hàng</p>
                <p className="font-mono text-sm font-semibold">
                  {profile.bankCode}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Recent cases */}
        {profile.recentCases.length > 0 && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-(--text-tertiary)">
              <FileText className="size-4" aria-hidden="true" />
              Các vụ việc liên quan
            </h2>
            <div className="stagger-children space-y-3">
              {profile.recentCases.map((item) => (
                <Link
                  href={`/case/${item.id}`}
                  key={item.id}
                  className="block rounded-xl focus-visible:outline-2 focus-visible:outline-neon focus-visible:outline-offset-2"
                >
                  <GlassCard className="group p-5 transition-all duration-300 hover:border-(--border-neon) hover:shadow-(--shadow-neon)">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <StatusBadge status={item.status} />
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-(--text-tertiary)">
                        <CalendarDays className="size-3" aria-hidden="true" />
                        {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm leading-relaxed text-(--text-secondary) transition-colors group-hover:text-foreground">
                      {item.refinedDescription ?? item.originalDescription}
                    </p>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
