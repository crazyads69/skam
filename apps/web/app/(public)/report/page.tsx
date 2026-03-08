"use client";

import type { ChangeEvent, FormEvent, ReactElement } from "react";
import { useState } from "react";

interface SubmitResponse {
  success: boolean;
  error?: string;
}

const defaultApiUrl: string = "http://localhost:4000/api/v1";
const apiUrl: string = process.env.NEXT_PUBLIC_API_URL ?? defaultApiUrl;

export default function ReportPage(): ReactElement {
  const [bankIdentifier, setBankIdentifier] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [bankCode, setBankCode] = useState<string>("VCB");
  const [originalDescription, setOriginalDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string>("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setResultMessage("");
    const response: Response = await fetch(`${apiUrl}/cases`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bankIdentifier,
        bankName,
        bankCode,
        originalDescription,
      }),
    });
    const payload: SubmitResponse = await response.json();
    if (!payload.success) {
      setResultMessage(payload.error ?? "Gửi báo cáo thất bại");
      setIsSubmitting(false);
      return;
    }
    setResultMessage("Gửi báo cáo thành công");
    setIsSubmitting(false);
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <h1>Báo cáo tài khoản lừa đảo</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          value={bankIdentifier}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setBankIdentifier(event.target.value)
          }
          placeholder="Số tài khoản"
        />
        <input
          value={bankName}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setBankName(event.target.value)
          }
          placeholder="Tên chủ tài khoản"
        />
        <input
          value={bankCode}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setBankCode(event.target.value)
          }
          placeholder="Mã ngân hàng"
        />
        <textarea
          value={originalDescription}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setOriginalDescription(event.target.value)
          }
          placeholder="Mô tả vụ việc"
          rows={6}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
        </button>
      </form>
      {resultMessage ? <p>{resultMessage}</p> : null}
    </main>
  );
}
