import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/admin/logout-button";
import { AdminTokenSync } from "@/components/admin/token-sync";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { getAdminMe } from "@/lib/api";
import { getAdminTokenFromCookie } from "@/lib/admin-auth";
import { LayoutDashboard, List, ShieldCheck } from "lucide-react";

interface AdminLayoutProps {
  readonly children: ReactNode;
}

export default async function AdminLayout({
  children,
}: AdminLayoutProps): Promise<ReactElement> {
  const token = await getAdminTokenFromCookie();
  if (!token) redirect("/admin/login");
  const me = await getAdminMe(token).catch(() => null);
  if (!me?.success) redirect("/admin/login");
  return (
    <main className="skam-container py-8">
      <AdminTokenSync />
      <GlassCard className="mb-5 flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-neon-ghost ring-1 ring-(--border-neon)">
            <ShieldCheck className="size-4.5 text-neon" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-(--text-tertiary)">Admin đã đăng nhập</p>
            <p className="font-mono text-sm font-medium">{me.data?.username}</p>
          </div>
        </div>
        <LogoutButton />
      </GlassCard>
      <div className="mb-4 flex gap-2">
        <Link href="/admin">
          <Button variant="neon-outline" size="sm">
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Tổng quan
          </Button>
        </Link>
        <Link href="/admin/cases">
          <Button variant="ghost" size="sm">
            <List className="size-4" aria-hidden="true" />
            Tất cả vụ việc
          </Button>
        </Link>
      </div>
      {children}
    </main>
  );
}
