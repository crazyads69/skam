export function formatVND(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(amount)} VND`
}

export function formatDate(input: string | Date): string {
  const date: Date = input instanceof Date ? input : new Date(input)
  return new Intl.DateTimeFormat('vi-VN').format(date)
}
