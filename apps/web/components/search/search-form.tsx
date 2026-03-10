"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function SearchForm(): ReactElement {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  return (
    <form
      action="/search"
      method="get"
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={() => setIsSubmitting(true)}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--text-disabled)]" />
        <Input
          name="q"
          placeholder="Nhập số tài khoản hoặc tên lừa đảo"
          className={cn(
            "h-14 pl-12 pr-4 text-lg font-mono",
            "bg-[var(--surface-1)] border-[var(--border-default)]",
            "placeholder:text-[var(--text-disabled)]",
            "focus:border-[var(--neon-green)] focus:ring-2 focus:ring-[var(--neon-green)]/20",
            "focus:shadow-[var(--shadow-neon)]",
            "rounded-xl transition-all duration-200",
          )}
          required
        />
      </div>
      <Button type="submit" variant="neon" size="xl" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          "Tra cứu"
        )}
      </Button>
    </form>
  );
}
