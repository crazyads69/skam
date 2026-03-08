'use client'

import type { ReactElement } from 'react'

interface ErrorPageProps {
  readonly error: Error
  readonly reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps): ReactElement {
  return (
    <main style={{ padding: 24 }}>
      <h2>Đã xảy ra lỗi</h2>
      <p>{error.message}</p>
      <button type="button" onClick={reset}>
        Thử lại
      </button>
    </main>
  )
}
