"use client";

import { useState } from "react";
import type { WalletInfo } from "@/app/page";

interface SendViewProps {
  wallets: WalletInfo[];
  onTransferComplete: (tx: TransactionResult) => void;
  onNavigateToWallet: () => void;
}

export interface TransactionResult {
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  status: string;
  explorerUrl: string;
  timestamp: number;
}

export default function SendView({
  wallets,
  onTransferComplete,
  onNavigateToWallet,
}: SendViewProps) {
  const [fromName, setFromName] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<"eth" | "usdc">("eth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<TransactionResult | null>(null);

  const handleTransfer = async () => {
    if (!fromName || !to || !amount) return;
    setLoading(true);
    setError("");
    setSuccess(null);
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromName, to, amount, token }),
      });
      const json = await res.json();
      if (json.success) {
        const tx = { ...json.data, timestamp: Date.now() };
        onTransferComplete(tx);
        setSuccess(tx);
        setAmount("");
      } else {
        setError(json.error);
      }
    } catch {
      setError("Transfer failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (wallets.length === 0) {
    return (
      <div className="animate-fade-in text-center py-20">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "var(--accent-bg)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" /><path d="M5 12l7-7 7 7" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Create a wallet first
        </p>
        <p className="text-xs mt-1 mb-4" style={{ color: "var(--text-tertiary)" }}>
          You need at least one wallet to send payments
        </p>
        <button
          onClick={onNavigateToWallet}
          className="px-5 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          Go to Wallet
        </button>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="animate-fade-in text-center py-12">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{ background: "var(--success-bg)" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          Payment Sent
        </h3>
        <p className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          {success.amount} {success.token.toUpperCase()}
        </p>
        <p className="text-xs font-mono mb-6" style={{ color: "var(--text-tertiary)" }}>
          To {success.to.slice(0, 8)}...{success.to.slice(-6)}
        </p>
        <a
          href={success.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium mb-3"
          style={{ background: "var(--bg-secondary)", color: "var(--accent-light)", border: "1px solid var(--border)" }}
        >
          View on BaseScan
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <br />
        <button
          onClick={() => setSuccess(null)}
          className="mt-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          Send Another
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mt-2">
      {/* Amount Input */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          {(["eth", "usdc"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setToken(t)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200"
              style={{
                background: token === t ? "var(--accent)" : "var(--bg-secondary)",
                color: token === t ? "white" : "var(--text-secondary)",
                border: `1px solid ${token === t ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex items-baseline justify-center gap-1">
          <input
            type="number"
            step="any"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-transparent text-center text-5xl font-bold outline-none w-48"
            style={{ color: amount ? "var(--text-primary)" : "var(--text-tertiary)" }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          {token.toUpperCase()}
        </p>
      </div>

      {/* From */}
      <div className="mx-1 space-y-3">
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-medium mb-1.5 px-1" style={{ color: "var(--text-tertiary)" }}>
            From
          </label>
          <select
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200"
            style={{
              background: "var(--bg-secondary)",
              color: fromName ? "var(--text-primary)" : "var(--text-tertiary)",
              border: "1px solid var(--border)",
            }}
          >
            <option value="">Select wallet</option>
            {wallets.map((w) => (
              <option key={w.address} value={w.name}>
                {w.name} ({w.address.slice(0, 6)}...{w.address.slice(-4)})
              </option>
            ))}
          </select>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M19 12l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* To */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-medium mb-1.5 px-1" style={{ color: "var(--text-tertiary)" }}>
            To
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm font-mono outline-none transition-all duration-200"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          />
          {wallets.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-2 px-1">
              {wallets
                .filter((w) => w.name !== fromName)
                .map((w) => (
                  <button
                    key={w.address}
                    onClick={() => setTo(w.address)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200"
                    style={{
                      background: to === w.address ? "var(--accent-bg)" : "var(--bg-tertiary)",
                      color: to === w.address ? "var(--accent-light)" : "var(--text-secondary)",
                      border: `1px solid ${to === w.address ? "rgba(0,82,255,0.3)" : "var(--border)"}`,
                    }}
                  >
                    {w.name}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mx-1 mt-4 px-4 py-3 rounded-xl text-xs animate-slide-up"
          style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
        >
          {error}
        </div>
      )}

      {/* Send Button */}
      <div className="mx-1 mt-6">
        <button
          onClick={handleTransfer}
          disabled={loading || !fromName || !to || !amount}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-30"
          style={{ background: loading || !fromName || !to || !amount ? "var(--text-tertiary)" : "var(--accent)" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />
              Sending...
            </span>
          ) : (
            "Send Payment"
          )}
        </button>
      </div>
    </div>
  );
}
