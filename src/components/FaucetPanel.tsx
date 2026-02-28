"use client";

import { useState } from "react";

interface FaucetPanelProps {
  wallets: { name: string; address: string }[];
  onFunded: () => void;
}

export default function FaucetPanel({ wallets, onFunded }: FaucetPanelProps) {
  const [selectedWallet, setSelectedWallet] = useState("");
  const [token, setToken] = useState<"eth" | "usdc">("eth");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    url?: string;
  } | null>(null);

  const handleFaucet = async () => {
    if (!selectedWallet) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: selectedWallet, token }),
      });
      const json = await res.json();
      if (json.success) {
        setResult({
          success: true,
          message: `Received testnet ${token.toUpperCase()}`,
          url: json.data.explorerUrl,
        });
        onFunded();
      } else {
        setResult({ success: false, message: json.error });
      }
    } catch (err) {
      setResult({ success: false, message: "Request failed" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">
        Faucet (Base Sepolia)
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wallet</label>
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Select wallet</option>
            {wallets.map((w) => (
              <option key={w.address} value={w.address}>
                {w.name} ({w.address.slice(0, 6)}...{w.address.slice(-4)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Token</label>
          <div className="flex gap-2">
            {(["eth", "usdc"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setToken(t)}
                className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
                  token === t
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleFaucet}
          disabled={loading || !selectedWallet}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {loading ? "Requesting funds..." : "Request Testnet Funds"}
        </button>

        {result && (
          <div
            className={`p-3 rounded-lg text-sm ${
              result.success
                ? "bg-green-900/30 border border-green-800 text-green-400"
                : "bg-red-900/30 border border-red-800 text-red-400"
            }`}
          >
            <p>{result.message}</p>
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400 text-xs mt-1 block"
              >
                View on BaseScan
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
