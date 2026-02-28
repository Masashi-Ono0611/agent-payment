"use client";

import { useState } from "react";

interface WalletInfo {
  name: string;
  address: string;
  ethBalance?: string;
  usdcBalance?: string;
}

interface WalletPanelProps {
  wallets: WalletInfo[];
  onWalletCreated: (wallet: WalletInfo) => void;
  onRefreshBalance: (address: string) => void;
  loading: boolean;
}

export default function WalletPanel({
  wallets,
  onWalletCreated,
  onRefreshBalance,
  loading,
}: WalletPanelProps) {
  const [walletName, setWalletName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!walletName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: walletName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        onWalletCreated(json.data);
        setWalletName("");
      } else {
        alert(json.error);
      }
    } catch (err) {
      alert("Failed to create wallet");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Agent Wallets</h2>

      {/* Create wallet form */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Wallet name (e.g. Agent-1)"
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !walletName.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </div>

      {/* Wallet list */}
      {wallets.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          No wallets yet. Create one to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {wallets.map((w) => (
            <div
              key={w.address}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-400">
                  {w.name}
                </span>
                <button
                  onClick={() => onRefreshBalance(w.address)}
                  disabled={loading}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Refresh
                </button>
              </div>
              <p className="text-xs text-gray-400 font-mono break-all mb-2">
                {w.address}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-300">
                  <span className="text-gray-500">ETH:</span>{" "}
                  {w.ethBalance ?? "—"}
                </span>
                <span className="text-gray-300">
                  <span className="text-gray-500">USDC:</span>{" "}
                  {w.usdcBalance ?? "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
