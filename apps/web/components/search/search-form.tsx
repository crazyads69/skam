"use client";

import type { ChangeEvent, FormEvent, ReactElement } from "react";
import { useState } from "react";
import type { ScamCase } from "@skam/shared/types";
import { searchCases } from "@/lib/api";

export default function SearchForm(): ReactElement {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<ScamCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setErrorMessage("");
    const response = await searchCases({ q: query.trim() });
    if (!response.success) {
      setErrorMessage(response.error ?? "Không thể tìm kiếm lúc này");
      setIsLoading(false);
      return;
    }
    setResults(response.data ?? []);
    setIsLoading(false);
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setQuery(event.target.value)
          }
          placeholder="Nhập số tài khoản hoặc tên lừa đảo"
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #30363D",
            background: "#161B22",
            color: "#E6EDF3",
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            border: "none",
            background: "#00FF7F",
            color: "#0A0A0F",
            fontWeight: 600,
          }}
        >
          {isLoading ? "Đang tìm..." : "Kiểm tra"}
        </button>
      </form>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <ul style={{ marginTop: 16 }}>
        {results.map((item) => (
          <li key={item.id} style={{ marginBottom: 12 }}>
            {item.bankCode} · {item.bankIdentifier} · {item.originalDescription}
          </li>
        ))}
      </ul>
    </div>
  );
}
