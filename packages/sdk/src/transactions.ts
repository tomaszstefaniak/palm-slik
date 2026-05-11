import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { 
  getAssociatedTokenAddressSync, 
  createAssociatedTokenAccountInstruction 
} from "@solana/spl-token";
import { buildPayInstruction, buildPayStableInstruction, buildRefundStableInstruction } from "./instructions";
import { PROGRAM_ID, STABLE_ASSET, FEE_WALLET } from "./constants";

export async function createPayTransaction(config: {
  customer: PublicKey;
  merchant: PublicKey;
  amountSol: number;
  paymentId: string;
  connection: Connection;
  programId?: PublicKey;
}): Promise<{ transaction: Transaction; receiptPda: PublicKey }> {
  const {
    customer,
    merchant,
    amountSol,
    paymentId,
    connection,
    programId = PROGRAM_ID,
  } = config;

  const { instruction, receiptPda } = buildPayInstruction({
    customer,
    merchant,
    amountSol,
    paymentId,
    programId,
  });

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer: customer,
  });

  transaction.add(instruction);

  return { transaction, receiptPda };
}

export async function createPayStableTransaction(config: {
  customer: PublicKey;
  merchant: PublicKey;
  amountStable: number;
  paymentId: string;
  connection: Connection;
  programId?: PublicKey;
}): Promise<{ transaction: Transaction; receiptPda: PublicKey }> {
  const {
    customer,
    merchant,
    amountStable,
    paymentId,
    connection,
    programId = PROGRAM_ID,
  } = config;

  const { instruction, receiptPda } = buildPayStableInstruction({
    customer,
    merchant,
    amountStable,
    paymentId,
    programId,
  });

  const merchantStable = getAssociatedTokenAddressSync(STABLE_ASSET.mint, merchant);
  const feeStable = getAssociatedTokenAddressSync(STABLE_ASSET.mint, FEE_WALLET);

  const [merchantAccount, feeAccount] = await connection.getMultipleAccountsInfo([
    merchantStable,
    feeStable,
  ]);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer: customer,
  });

  if (!merchantAccount) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        customer,
        merchantStable,
        merchant,
        STABLE_ASSET.mint
      )
    );
  }

  if (!feeAccount) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        customer,
        feeStable,
        FEE_WALLET,
        STABLE_ASSET.mint
      )
    );
  }

  transaction.add(instruction);

  return { transaction, receiptPda };
}

export async function createRefundStableTransaction(config: {
  merchant: PublicKey;
  customer: PublicKey;
  refundAmountStable: number;
  paymentId: string;
  connection: Connection;
  programId?: PublicKey;
}): Promise<{ transaction: Transaction; receiptPda: PublicKey }> {
  const {
    merchant,
    customer,
    refundAmountStable,
    paymentId,
    connection,
    programId = PROGRAM_ID,
  } = config;

  const { instruction, receiptPda } = buildRefundStableInstruction({
    merchant,
    customer,
    refundAmountStable,
    paymentId,
    programId,
  });

  const customerStable = getAssociatedTokenAddressSync(STABLE_ASSET.mint, customer);
  const customerAccount = await connection.getAccountInfo(customerStable);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer: merchant, // Merchant pays the fee for refund
  });

  // If customer doesn't have an ATA (e.g. they burned it?), we could recreate it, 
  // but let's assume they have it since they just paid us from it.
  if (!customerAccount) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        merchant, // fee payer
        customerStable,
        customer,
        STABLE_ASSET.mint
      )
    );
  }

  transaction.add(instruction);

  return { transaction, receiptPda };
}
