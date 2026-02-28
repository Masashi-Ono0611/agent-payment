export interface WalletInfo {
  name: string;
  address: string;
}

export interface TransactionRecord {
  id: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  transactionHash: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
  explorerUrl: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
