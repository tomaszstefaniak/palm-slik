import type { PublicKey } from "@solana/web3.js";

export interface Receipt {
  customer: PublicKey;
  merchant: PublicKey;
  mint: PublicKey;
  decimals: number;
  amount: number;
  feeAmount: number;
  netAmount: number;
  refundedAmount: number;
  amountDisplay: number;
  paymentId: string;
  paymentIdBytes: Uint8Array;
  timestamp: number;
  bump: number;
  pda: PublicKey;
}

export interface PaymentCompleted {
  paymentId: string;
  customer: PublicKey;
  merchant: PublicKey;
  mint: PublicKey;
  decimals: number;
  amount: number;
  feeAmount: number;
  netAmount: number;
  timestamp: number;
}
