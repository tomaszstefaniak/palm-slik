"use client";

import { useState, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMerchantPayment } from "@slik-pay/sdk/react";
import CodeInput from "@/components/CodeInput";
import { WalletButton } from "@/components/WalletButton";
import { Nav } from "@/components/Nav";
import bs58 from "bs58";

type StatusColor = "green" | "yellow" | "red" | "idle";

const PERFUME_PRICE_PUSD = 25.00;
const PERFUME_PRICE_SOL = 0.15; // fallback fallback

export default function PerfumePOS() {
  const { publicKey, connected, signMessage } = useWallet();
  const { connection } = useConnection();

  const { status, amount, paymentId, error, createPayment, linkCode, reset } =
    useMerchantPayment({ apiBaseUrl: "/api", connection });

  const [enteredCode, setEnteredCode] = useState<string>("");
  const [transitioning, setTransitioning] = useState(false);
  const prevStatusRef = useRef(status);

  const [selectedCurrency, setSelectedCurrency] = useState<"PUSD" | "SOL">("PUSD");

  const withTransition = useCallback((fn: () => void) => {
    setTransitioning(true);
    setTimeout(() => {
      fn();
      setTransitioning(false);
    }, 180);
  }, []);

  if (prevStatusRef.current !== status) {
    prevStatusRef.current = status;
    if (!transitioning) {
      setTransitioning(true);
      setTimeout(() => setTransitioning(false), 180);
    }
  }

  const handleCharge = useCallback(async () => {
    if (!publicKey || !signMessage) return;
    try {
      const amt = selectedCurrency === "PUSD" ? PERFUME_PRICE_PUSD : PERFUME_PRICE_SOL;
      const message = new TextEncoder().encode(`create:${amt}:${selectedCurrency}`);
      const signature = await signMessage(message);
      const b58Signature = bs58.encode(signature);
      
      await createPayment(amt, publicKey.toBase58(), selectedCurrency, b58Signature);
    } catch (err) {
      console.error("Signature failed", err);
    }
  }, [publicKey, signMessage, selectedCurrency, createPayment]);

  const handleCodeComplete = useCallback(
    async (code: string) => {
      setEnteredCode(code);
      if (!publicKey || !signMessage || !paymentId) return;
      try {
        const message = new TextEncoder().encode(`link:${paymentId}:${code}`);
        const signature = await signMessage(message);
        const b58Signature = bs58.encode(signature);
        await linkCode(code, b58Signature, publicKey.toBase58());
      } catch (err) {
        console.error("Signature failed", err);
      }
    },
    [linkCode, publicKey, signMessage, paymentId]
  );

  const handleReset = useCallback(() => {
    withTransition(() => {
      reset();
      setEnteredCode("");
    });
  }, [reset, withTransition]);

  const statusInfo = getStatusInfo(status);

  const isIdle = status === "idle";
  const isAwaitingCode = status === "awaiting_code";
  const isConfirming = status === "confirming" || status === "linked";
  const isPaid = status === "paid";
  const isError = status === "error" || status === "expired";

  return (
    <>
      <Nav />
      <div className="relative z-10 flex flex-col min-h-dvh w-full items-center bg-zinc-950 text-white font-sans" style={{ paddingTop: 68 }}>
        
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

        <header className="w-full max-w-[420px] flex items-center justify-between px-5 pt-6 pb-3 z-10">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-medium tracking-wide">Aura Boutique</h1>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: STATUS_COLORS[statusInfo.color],
                boxShadow: `0 0 10px ${STATUS_COLORS[statusInfo.color]}80`,
                animation: statusInfo.color !== "idle" ? "pulse 2s infinite" : "none",
              }}
            />
            <span className="text-xs tracking-wide text-zinc-400 font-mono">
              POS: {statusInfo.label}
            </span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center w-full max-w-[420px] px-5 py-8 z-10"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? "translateY(8px)" : "translateY(0)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {isIdle && !connected && (
            <div className="flex flex-col items-center gap-6 w-full p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-purple-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-medium mb-2">Connect Terminal</h2>
                <p className="text-sm text-zinc-400">Authenticate merchant wallet to accept Palm USD payments.</p>
              </div>
              <WalletButton />
            </div>
          )}

          {isIdle && connected && (
            <div className="w-full flex flex-col gap-6">
              {/* Product Card */}
              <div className="p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent">
                <div className="flex flex-col items-center gap-6 p-8 rounded-[22px] bg-zinc-900 border border-white/5">
                  <div className="w-32 h-40 bg-zinc-800 rounded-xl flex items-center justify-center border border-white/10 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <img src="/perfume-bottle.png" alt="L'Essence Sample" className="object-cover w-full h-full z-10 transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold tracking-wide">L'Essence Sample</h2>
                    <p className="text-zinc-400 mt-1">35ml Signature Collection</p>
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <div className="w-full flex justify-between items-center bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setSelectedCurrency("PUSD")}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${selectedCurrency === 'PUSD' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-400 hover:text-white'}`}
                    >
                      $25.00 PUSD
                    </button>
                    <button 
                      onClick={() => setSelectedCurrency("SOL")}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${selectedCurrency === 'SOL' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-zinc-400 hover:text-white'}`}
                    >
                      {PERFUME_PRICE_SOL} SOL
                    </button>
                  </div>

                  <button
                    onClick={handleCharge}
                    className="w-full py-4 rounded-xl bg-white text-black font-semibold text-lg hover:bg-zinc-200 transition-colors duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    Charge {selectedCurrency === "PUSD" ? "$25.00" : `${PERFUME_PRICE_SOL} SOL`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isAwaitingCode && amount !== null && (
            <CodeStep
              amount={amount}
              currency={selectedCurrency}
              onCodeComplete={handleCodeComplete}
              onCancel={handleReset}
            />
          )}

          {isConfirming && amount !== null && (
            <WaitingStep amount={amount} currency={selectedCurrency} code={enteredCode} />
          )}

          {isPaid && amount !== null && (
            <SuccessStep
              amount={amount}
              currency={selectedCurrency}
              onReset={handleReset}
            />
          )}

          {isError && (
            <ErrorStep
              message={error || (status === "expired" ? "Payment expired." : "An error occurred")}
              onRetry={handleReset}
            />
          )}
        </main>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CodeStep({ amount, currency, onCodeComplete, onCancel }: { amount: number; currency: string; onCodeComplete: (code: string) => void; onCancel: () => void; }) {
  return (
    <div className="flex flex-col items-center w-full gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-center gap-2 p-6 rounded-3xl bg-white/5 border border-white/10 w-full backdrop-blur-md">
        <span className="text-xs tracking-widest uppercase text-purple-400 font-mono">Amount Due</span>
        <span className="text-4xl font-light tracking-tight">
          {currency === 'PUSD' ? '$' : ''}{amount.toFixed(2)} <span className="text-xl text-zinc-500 font-medium">{currency}</span>
        </span>
      </div>

      <div className="w-full max-w-[320px]">
        <h3 className="text-center text-sm text-zinc-400 mb-6">Ask customer for their 6-digit Palm SLIK code</h3>
        <CodeInput onComplete={onCodeComplete} />
      </div>

      <button onClick={onCancel} className="mt-4 text-sm text-zinc-500 hover:text-white transition-colors duration-200 uppercase tracking-widest font-mono">
        Cancel Order
      </button>
    </div>
  );
}

function WaitingStep({ amount, currency, code }: { amount: number; currency: string; code: string; }) {
  return (
    <div className="flex flex-col items-center w-full gap-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs tracking-widest uppercase text-yellow-500 font-mono animate-pulse">Awaiting Customer Approval</span>
        <span className="text-3xl font-light">
          {currency === 'PUSD' ? '$' : ''}{amount.toFixed(2)} <span className="text-lg text-zinc-500">{currency}</span>
        </span>
      </div>

      <div className="flex gap-3 justify-center">
        {code.split("").map((digit, i) => (
          <div
            key={i}
            className="w-12 h-14 flex items-center justify-center text-xl font-medium rounded-xl bg-white/5 border border-white/10 text-white opacity-60"
          >
            {digit}
          </div>
        ))}
      </div>

      <p className="text-sm text-center text-zinc-400 max-w-[260px] leading-relaxed">
        Customer is confirming the transaction in their wallet app.
      </p>
    </div>
  );
}

function SuccessStep({ amount, currency, onReset }: { amount: number; currency: string; onReset: () => void; }) {
  return (
    <div className="flex flex-col items-center w-full gap-8 animate-in fade-in zoom-in duration-500">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 rounded-full border border-green-500/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-[0_0_30px_rgba(74,222,128,0.3)] z-10">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" className="animate-[bounce_0.5s_ease-out]">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-xs tracking-widest uppercase text-green-400 font-mono">Payment Successful</span>
        <span className="text-4xl font-light">
          {currency === 'PUSD' ? '$' : ''}{amount.toFixed(2)} <span className="text-xl text-zinc-500">{currency}</span>
        </span>
      </div>

      <button
        onClick={onReset}
        className="w-full mt-4 py-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 border border-white/10 transition-all duration-200"
      >
        New Transaction
      </button>
    </div>
  );
}

function ErrorStep({ message, onRetry }: { message: string; onRetry: () => void; }) {
  return (
    <div className="flex flex-col items-center w-full gap-8 animate-in fade-in duration-300">
      <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs tracking-widest uppercase text-red-400 font-mono">Transaction Failed</span>
        <p className="text-sm text-zinc-400 max-w-[280px]">{message}</p>
      </div>

      <button
        onClick={onRetry}
        className="w-full py-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 border border-white/10 transition-all duration-200"
      >
        Try Again
      </button>
    </div>
  );
}

const STATUS_COLORS: Record<StatusColor, string> = {
  green: "#4ade80",
  yellow: "#eab308",
  red: "#ef4444",
  idle: "#52525b",
};

function getStatusInfo(status: string): { label: string; color: StatusColor; } {
  switch (status) {
    case "idle": return { label: "Ready", color: "green" };
    case "awaiting_code": return { label: "Waiting for code", color: "yellow" };
    case "linked":
    case "confirming": return { label: "Processing", color: "yellow" };
    case "paid": return { label: "Confirmed", color: "green" };
    case "expired":
    case "error": return { label: "Error", color: "red" };
    default: return { label: "Unknown", color: "idle" };
  }
}
