'use client'

import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ErrorPageProps {
  readonly error: Error
  readonly reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps): ReactElement {
  return (
    <main className="skam-container py-8">
      <Card className="grid gap-3 p-5">
        <h2 className="text-lg font-semibold">Đã xảy ra lỗi</h2>
        <p className="text-sm text-[var(--text-secondary)]">{error.message}</p>
        <div>
          <Button type="button" variant="neon-outline" onClick={reset}>
            Thử lại
          </Button>
        </div>
      </Card>
    </main>
  )
}
