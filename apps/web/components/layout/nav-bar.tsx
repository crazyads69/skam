"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NavBar(): ReactElement {
  const pathname = usePathname();
  const isReport = pathname === "/report";
  const isSearch = pathname === "/search";

  return (
    <header className="border-b border-border bg-(--glass-bg) backdrop-blur-(--glass-blur)">
      <div className="skam-container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
          aria-label="Trang chủ SKAM"
        >
          <Shield className="size-5 text-neon" aria-hidden="true" />
          SKAM
        </Link>
        <nav className="flex items-center gap-2" aria-label="Menu chính">
          <Link
            href="/search"
            aria-label="Tra cứu"
            aria-current={isSearch ? "page" : undefined}
          >
            <Button
              variant="ghost"
              size="default"
              className={cn(
                "gap-1.5 text-(--text-secondary) hover:text-foreground",
                isSearch && "text-neon bg-neon-ghost",
              )}
            >
              <Search className="size-4" aria-hidden="true" />
              Tra cứu
            </Button>
          </Link>
          <Link
            href="/report"
            aria-label="Báo cáo lừa đảo"
            aria-current={isReport ? "page" : undefined}
          >
            <Button
              variant="neon-outline"
              size="default"
              className={cn(isReport && "bg-neon-ghost shadow-(--shadow-neon)")}
            >
              Báo cáo
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
