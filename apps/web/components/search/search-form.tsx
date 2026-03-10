"use client";

import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SearchForm(): ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    const params = new URLSearchParams({ q: query.trim() });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--text-disabled)]" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nhập số tài khoản hoặc tên lừa đảo"
          className="h-14 pl-12 font-mono text-base"
        />
      </div>
      <Button type="submit" variant="neon" size="xl" disabled={isLoading}>
        {isLoading ? "Đang chuyển..." : "Tra cứu"}
      </Button>
    </form>
  );
}
