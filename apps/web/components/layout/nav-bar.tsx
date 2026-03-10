import type { ReactElement } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavBar(): ReactElement {
  return (
    <header className="border-b border-border bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)]">
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
          <Link href="/report" aria-label="Báo cáo lừa đảo">
            <Button variant="neon-outline" size="default">
              Báo cáo
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
