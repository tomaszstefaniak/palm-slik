import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PROGRAM_ID,
  PAY_DISCRIMINATOR,
  PAY_STABLE_DISCRIMINATOR,
  REFUND_STABLE_DISCRIMINATOR,
  FEE_WALLET,
  STABLE_ASSET,
} from "./constants";
import { uuidToBytes } from "./uuid";
import { deriveReceiptPda } from "./pda";

export function buildPayInstruction(config: {
  customer: PublicKey;
  merchant: PublicKey;
  amountSol: number;
  paymentId: string;
  programId?: PublicKey;
}): { instruction: TransactionInstruction; receiptPda: PublicKey } {
  const {
    customer,
    merchant,
    amountSol,
    paymentId,
    programId = PROGRAM_ID,
  } = config;

  const paymentIdBytes = uuidToBytes(paymentId);
  const lamports = BigInt(Math.round(amountSol * LAMPORTS_PER_SOL));
  const [receiptPda] = deriveReceiptPda(paymentIdBytes, programId);

  // Serialize: discriminator (8) + amount u64 LE (8) + payment_id (16) = 32 bytes
  const data = Buffer.alloc(32);
  data.set(PAY_DISCRIMINATOR, 0);

  // Write u64 little-endian
  for (let i = 0; i < 8; i++) {
    data[8 + i] = Number((lamports >> BigInt(i * 8)) & BigInt(0xff));
  }

  data.set(paymentIdBytes, 16);

  const instruction = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: customer, isSigner: true, isWritable: true },
      { pubkey: merchant, isSigner: false, isWritable: true },
      { pubkey: FEE_WALLET, isSigner: false, isWritable: true },
      { pubkey: receiptPda, isSigner: false, isWritable: true },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    data,
  });

  return { instruction, receiptPda };
}

export function buildPayStableInstruction(config: {
  customer: PublicKey;
  merchant: PublicKey;
  amountStable: number; // human-readable, e.g. 25.00
  paymentId: string;
  programId?: PublicKey;
}): { instruction: TransactionInstruction; receiptPda: PublicKey } {
  const {
    customer,
    merchant,
    amountStable,
    paymentId,
    programId = PROGRAM_ID,
  } = config;

  const paymentIdBytes = uuidToBytes(paymentId);
  const atomicAmount = BigInt(Math.round(amountStable * 10 ** STABLE_ASSET.decimals));
  const [receiptPda] = deriveReceiptPda(paymentIdBytes, programId);

  const customerStable = getAssociatedTokenAddressSync(STABLE_ASSET.mint, customer);
  const merchantStable = getAssociatedTokenAddressSync(STABLE_ASSET.mint, merchant);
  const feeStable = getAssociatedTokenAddressSync(STABLE_ASSET.mint, FEE_WALLET);

  // Serialize: discriminator (8) + amount u64 LE (8) + payment_id (16) = 32 bytes
  const data = Buffer.alloc(32);
  data.set(PAY_STABLE_DISCRIMINATOR, 0);
  for (let i = 0; i < 8; i++) {
    data[8 + i] = Number((atomicAmount >> BigInt(i * 8)) & BigInt(0xff));
  }
  data.set(paymentIdBytes, 16);

  const instruction = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: customer, isSigner: true, isWritable: true },
      { pubkey: merchant, isSigner: false, isWritable: true },
      { pubkey: FEE_WALLET, isSigner: false, isWritable: true },
      { pubkey: customerStable, isSigner: false, isWritable: true },
      { pubkey: merchantStable, isSigner: false, isWritable: true },
      { pubkey: feeStable, isSigner: false, isWritable: true },
      { pubkey: STABLE_ASSET.mint, isSigner: false, isWritable: false },
      { pubkey: receiptPda, isSigner: false, isWritable: true },
      { pubkey: new PublicKey(STABLE_ASSET.tokenProgram), isSigner: false, isWritable: false },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    data,
  });

  return { instruction, receiptPda };
}

export function buildRefundStableInstruction(config: {
  merchant: PublicKey;
  customer: PublicKey;
  refundAmountStable: number; // human-readable
  paymentId: string;
  programId?: PublicKey;
}): { instruction: TransactionInstruction; receiptPda: PublicKey } {
  const {
    merchant,
    customer,
    refundAmountStable,
    paymentId,
    programId = PROGRAM_ID,
  } = config;

  const paymentIdBytes = uuidToBytes(paymentId);
  const atomicAmount = BigInt(Math.round(refundAmountStable * 10 ** STABLE_ASSET.decimals));
  const [receiptPda] = deriveReceiptPda(paymentIdBytes, programId);

  const merchantStable = getAssociatedTokenAddressSync(STABLE_ASSET.mint, merchant);
  const customerStable = getAssociatedTokenAddressSync(STABLE_ASSET.mint, customer);

  // Serialize: discriminator (8) + refund_amount u64 LE (8) = 16 bytes
  const data = Buffer.alloc(16);
  data.set(REFUND_STABLE_DISCRIMINATOR, 0);
  for (let i = 0; i < 8; i++) {
    data[8 + i] = Number((atomicAmount >> BigInt(i * 8)) & BigInt(0xff));
  }

  const instruction = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: merchant, isSigner: true, isWritable: true },
      { pubkey: customer, isSigner: false, isWritable: true },
      { pubkey: merchantStable, isSigner: false, isWritable: true },
      { pubkey: customerStable, isSigner: false, isWritable: true },
      { pubkey: STABLE_ASSET.mint, isSigner: false, isWritable: false },
      { pubkey: receiptPda, isSigner: false, isWritable: true },
      { pubkey: new PublicKey(STABLE_ASSET.tokenProgram), isSigner: false, isWritable: false },
    ],
    data,
  });

  return { instruction, receiptPda };
}
