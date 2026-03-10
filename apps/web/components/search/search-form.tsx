import type { ReactElement } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SearchForm(): ReactElement {
  return (
    <form
      action="/search"
      method="get"
      className="flex flex-col gap-3 sm:flex-row"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[var(--text-disabled)]" />
        <Input
          name="q"
          placeholder="Nhập số tài khoản hoặc tên lừa đảo"
          className="h-14 pl-12 font-mono text-base"
          required
        />
      </div>
      <Button type="submit" variant="neon" size="xl">
        Tra cứu
      </Button>
    </form>
  );
}
