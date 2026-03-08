export interface ScammerProfile {
  id: string
  bankIdentifier: string
  bankCode: string
  scammerName: string | null
  totalCases: number
  totalAmount: number
  firstReportedAt: string
  lastReportedAt: string
}
