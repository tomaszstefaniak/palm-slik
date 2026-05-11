import { pgTable, uuid, text, numeric, timestamp, index } from "drizzle-orm/pg-core";

export const merchants = pgTable("merchants", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletAddress: text("wallet_address").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  status: text("status").notNull().default("active"), // active | blocked
  currencyPreference: text("currency_preference").default("SOL"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_merchant_wallet").on(table.walletAddress),
]);

export const merchantTransactions = pgTable("merchant_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id").notNull().references(() => merchants.id),
  paymentId: text("payment_id").notNull().unique(),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull(),
  fee: numeric("fee").notNull(),
  customerWallet: text("customer_wallet").notNull(),
  mint: text("mint"),
  assetSymbol: text("asset_symbol"),
  receiptPda: text("receipt_pda"),
  signature: text("signature"),
  status: text("status").notNull().default("completed"),
  refundStatus: text("refund_status").default("none"),
  refundedAmount: numeric("refunded_amount").default("0"),
  webhookDeliveryStatus: text("webhook_delivery_status").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_transactions_merchant").on(table.merchantId),
]);
