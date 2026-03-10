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
        >
          <Shield className="size-5 text-neon" />
          SKAM
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/report">
            <Button variant="neon-outline" size="default">
              Báo cáo
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
