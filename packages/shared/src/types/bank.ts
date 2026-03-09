export interface Bank {
  id: number;
  code: string;
  bin: string;
  name: string;
  shortName: string;
  logo: string | null;
  transferSupported: 0 | 1;
  lookupSupported: 0 | 1;
  short_name?: string;
  isTransfer?: 0 | 1;
  support?: number;
  swift_code?: string;
}

export interface BankResponse {
  code?: string;
  desc?: string;
  data: Bank[];
}

export interface VietQrBankItem {
  id?: number;
  name?: string;
  code?: string;
  bin?: string;
  shortName?: string;
  logo?: string;
  transferSupported?: number;
  lookupSupported?: number;
  short_name?: string;
  support?: number;
  isTransfer?: number;
  swift_code?: string;
}

export interface VietQrBankResponse {
  code?: string;
  desc?: string;
  data?: VietQrBankItem[];
}

export interface CachedBanksPayload {
  fetchedAt: number;
  data: Bank[];
}
