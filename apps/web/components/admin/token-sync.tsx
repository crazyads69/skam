"use client";

import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AdminTokenSync(): ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();
  const exchangingRef = useRef(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code: string = url.searchParams.get("code") ?? "";
    if (!code || exchangingRef.current) return;
    exchangingRef.current = true;
    window.history.replaceState({}, "", pathname);
    const controller = new AbortController();
    fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Token không hợp lệ");
        router.replace("/admin");
        router.refresh();
      })
      .catch(() => {
        exchangingRef.current = false;
      });
    return () => controller.abort();
  }, [pathname, router]);

  return null;
}
