export interface CodeData {
  walletPubkey: string;
  paymentId?: string;
  createdAt: number;
}

export type PaymentStatus = "awaiting_code" | "linked" | "paid" | "expired" | "refunded" | "partially_refunded";

export interface PaymentData {
  /** Human-readable amount */
  amount: number;
  /** Payment currency. Default: "SOL" */
  currency: "SOL" | "USDC" | "PUSD";
  assetSymbol?: string;
  mint?: string;
  decimals?: number;
  status: PaymentStatus;
  merchantWallet: string;
  code?: string;
  reference?: string;
  walletPubkey?: string;
  createdAt: number;
}
