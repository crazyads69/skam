"use client";

import type { ReactElement } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AdminTokenSync(): ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const hash: string = window.location.hash;
    if (!hash.startsWith("#token=")) return;
    const token: string = decodeURIComponent(hash.replace("#token=", ""));
    fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Token không hợp lệ");
        window.history.replaceState({}, "", pathname);
        router.refresh();
      })
      .catch(() => {
        window.history.replaceState({}, "", pathname);
      });
  }, [pathname, router]);

  return null;
}
