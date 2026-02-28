"use client";

import { useState } from "react";

interface TransferPanelProps {
  wallets: { name: string; address: string }[];
  onTransferComplete: (tx: TransactionResult) => void;
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

export default function TransferPanel({
  wallets,
  onTransferComplete,
}: TransferPanelProps) {
  const [fromName, setFromName] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<"eth" | "usdc">("eth");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTransfer = async () => {
    if (!fromName || !to || !amount) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromName, to, amount, token }),
      });
      const json = await res.json();
      if (json.success) {
        onTransferComplete({
          ...json.data,
          timestamp: Date.now(),
        });
        setAmount("");
        setTo("");
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError("Transfer failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">
        Agent Payment
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            From (Agent Wallet)
          </label>
          <select
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select sender wallet</option>
            {wallets.map((w) => (
              <option key={w.address} value={w.name}>
                {w.name} ({w.address.slice(0, 6)}...{w.address.slice(-4)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">
            To (Recipient Address)
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
          />
          {/* Quick-fill from existing wallets */}
          {wallets.length > 1 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {wallets
                .filter((w) => w.name !== fromName)
                .map((w) => (
                  <button
                    key={w.address}
                    onClick={() => setTo(w.address)}
                    className="text-xs text-blue-400 hover:text-blue-300 bg-gray-800 px-2 py-0.5 rounded"
                  >
                    {w.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Amount</label>
            <input
              type="number"
              step="any"
              placeholder="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Token</label>
            <div className="flex gap-1">
              {(["eth", "usdc"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setToken(t)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    token === t
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 border border-gray-700"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleTransfer}
          disabled={loading || !fromName || !to || !amount}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {loading ? "Sending..." : "Send Payment"}
        </button>

        {error && (
          <div className="p-3 rounded-lg text-sm bg-red-900/30 border border-red-800 text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
