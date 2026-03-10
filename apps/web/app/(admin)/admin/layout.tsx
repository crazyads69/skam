import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/admin/logout-button";
import { AdminTokenSync } from "@/components/admin/token-sync";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAdminMe } from "@/lib/api";
import { getAdminTokenFromCookie } from "@/lib/admin-auth";

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
      <Card className="mb-5 flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-xs text-[var(--text-tertiary)]">Admin đã đăng nhập</p>
          <p className="font-mono text-sm">{me.data?.username}</p>
        </div>
        <LogoutButton />
      </Card>
      <div className="mb-4 flex gap-2">
        <Link href="/admin">
          <Button variant="neon-outline">Tổng quan</Button>
        </Link>
        <Link href="/admin/cases">
          <Button variant="ghost">Tất cả vụ việc</Button>
        </Link>
      </div>
      {children}
    </main>
  );
}
