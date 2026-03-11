"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const footerLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/report", label: "Báo cáo" },
  { href: "/search", label: "Tra cứu" },
] as const;

export function Footer(): ReactElement {
  const pathname = usePathname();

  return (
    <footer className="mt-auto border-t border-border bg-(--glass-bg) backdrop-blur-(--glass-blur)">
      <div className="skam-container flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-(--text-secondary)">
          <ShieldCheck className="size-4 text-neon" aria-hidden="true" />
          <span>SKAM &mdash; Nền tảng tra cứu lừa đảo ngân hàng</span>
        </div>
        <nav
          aria-label="Footer"
          className="flex gap-6 text-sm text-(--text-tertiary)"
        >
          {footerLinks.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "transition-colors hover:text-neon",
                  isActive && "text-neon font-medium",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
