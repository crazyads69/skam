"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchFilterBank {
  code: string;
  shortName?: string;
  short_name?: string;
}

interface SearchFiltersProps {
  readonly defaultQuery: string;
  readonly defaultBankCode?: string;
  readonly banks: SearchFilterBank[];
}

export default function SearchFilters({
  defaultQuery,
  defaultBankCode,
  banks,
}: SearchFiltersProps): ReactElement {
  const [query, setQuery] = useState<string>(defaultQuery);
  const [bankCode, setBankCode] = useState<string>(defaultBankCode ?? "_all");

  return (
    <form
      action="/search"
      method="get"
      className="grid gap-3 sm:grid-cols-[1fr_220px_120px]"
    >
      <Input
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Từ khóa"
      />
      <Select value={bankCode} onValueChange={setBankCode}>
        <SelectTrigger>
          <SelectValue placeholder="Tất cả ngân hàng" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Tất cả ngân hàng</SelectItem>
          {banks.map((bank) => (
            <SelectItem key={bank.code} value={bank.code}>
              {bank.shortName || bank.short_name || bank.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input type="hidden" name="page" value="1" />
      <input
        type="hidden"
        name="bankCode"
        value={bankCode === "_all" ? "" : bankCode}
      />
      <FormSubmitButton
        label="Lọc"
        pendingLabel="Đang lọc..."
        variant="neon-outline"
      />
    </form>
  );
}
