export interface Bank {
  code: string
  name: string
  shortName: string
}

export interface BankResponse {
  data: Bank[]
}
