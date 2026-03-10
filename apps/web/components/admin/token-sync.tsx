"use client";

import type { ReactElement } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AdminTokenSync(): ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const url = new URL(window.location.href);
    const code: string = url.searchParams.get("code") ?? "";
    if (!code) return;
    fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Token không hợp lệ");
        window.history.replaceState({}, "", pathname);
        router.replace("/admin");
        router.refresh();
      })
      .catch(() => {
        window.history.replaceState({}, "", pathname);
      });
  }, [pathname, router]);

  return null;
}
