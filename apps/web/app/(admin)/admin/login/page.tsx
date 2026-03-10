import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { apiUrl } from "@/lib/api";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AdminTokenSync } from "@/components/admin/token-sync";

export const metadata: Metadata = {
  title: "Đăng nhập quản trị",
};

export default function AdminLoginPage(): ReactElement {
  return (
    <main className="skam-container py-10">
      <AdminTokenSync />
      <GlassCard className="mx-auto max-w-lg p-6">
        <h1 className="mb-2 text-2xl font-semibold">Đăng nhập quản trị</h1>
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          Đăng nhập bằng GitHub, chỉ tài khoản có trong whitelist mới được truy
          cập.
        </p>
        <a href={`${apiUrl}/auth/github`}>
          <Button variant="neon" size="lg" className="w-full">
            Đăng nhập với GitHub
          </Button>
        </a>
      </GlassCard>
    </main>
  );
}
