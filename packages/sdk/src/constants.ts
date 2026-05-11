import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "CogFZCvMEXKpvg2okzEUQMLAeTRqwdC9v7JXE8CHvzNP"
);

export const FEE_WALLET = new PublicKey(
  "2df3JmriVkhkBqdmYT2TgDBRo8E71WAJE1SbtLQ71Fkc"
);

export const FEE_BPS = 20; // 0.2% = 20 basis points

export const PAY_DISCRIMINATOR = new Uint8Array([
  119, 18, 216, 65, 192, 117, 122, 220,
]);

export const RECEIPT_DISCRIMINATOR = new Uint8Array([
  39, 154, 73, 106, 80, 102, 145, 153,
]);

// ---- Stablecoin config ----
export const STABLE_ASSET = {
  symbol: "PUSD",
  // Palm USD mainnet mint
  mint: process.env.NEXT_PUBLIC_PALM_USD_MINT ? new PublicKey(process.env.NEXT_PUBLIC_PALM_USD_MINT) : new PublicKey("CZzgUBvxaMLwMhVSLgqJn3npmxoTo6nzMNQPAnwtHF3s"),
  decimals: 6,
  tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
} as const;

// SHA256("global:pay_stable") first 8 bytes
export const PAY_STABLE_DISCRIMINATOR = new Uint8Array([
  102, 255, 123,  10, 231,  87, 103, 202
]);

// SHA256("global:refund_stable") first 8 bytes
export const REFUND_STABLE_DISCRIMINATOR = new Uint8Array([
  205,  70, 224,  62,  43, 101, 112, 107
]);
