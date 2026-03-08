import type { ReactElement } from 'react'
import SearchForm from '@/components/search/search-form'

export default function HomePage(): ReactElement {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ textAlign: 'center' }}>SKAM Platform</h1>
      <p style={{ textAlign: 'center' }}>Kiểm tra tài khoản ngân hàng trước khi chuyển khoản</p>
      <SearchForm />
    </main>
  )
}
