import type { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getProfile } from "@/lib/api";
import { formatMoneyVnd } from "@/lib/utils";

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
    <main className="skam-container py-8">
      <Card className="mb-5 p-6">
        <p className="text-xs text-[var(--text-tertiary)]">
          Hồ sơ tài khoản đã tổng hợp
        </p>
        <h1 className="mt-2 font-mono text-2xl">{profile.bankIdentifier}</h1>
        <div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-3">
          <p>Tổng vụ: {profile.totalCases.toLocaleString("vi-VN")}</p>
          <p>Tổng tiền: {formatMoneyVnd(profile.totalAmount)} VND</p>
          <p>Ngân hàng: {profile.bankCode}</p>
        </div>
      </Card>
      <div className="grid gap-4">
        {profile.recentCases.map((item) => (
          <Link href={`/case/${item.id}`} key={item.id}>
            <Card className="p-4">
              <p className="mb-2 text-sm text-[var(--text-secondary)]">
                {item.refinedDescription ?? item.originalDescription}
              </p>
              <p className="font-mono text-xs text-[var(--text-tertiary)]">
                {new Date(item.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
