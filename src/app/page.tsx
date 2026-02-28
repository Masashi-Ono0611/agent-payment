"use client";

import { useState, useCallback } from "react";
import WalletPanel from "@/components/WalletPanel";
import FaucetPanel from "@/components/FaucetPanel";
import TransferPanel, { TransactionResult } from "@/components/TransferPanel";
import TransactionHistory from "@/components/TransactionHistory";

interface WalletInfo {
  name: string;
  address: string;
  ethBalance?: string;
  usdcBalance?: string;
}

export default function Home() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [transactions, setTransactions] = useState<TransactionResult[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const refreshBalance = useCallback(async (address: string) => {
    setBalanceLoading(true);
    try {
      const res = await fetch(`/api/balance?address=${address}`);
      const json = await res.json();
      if (json.success) {
        setWallets((prev) =>
          prev.map((w) =>
            w.address === address
              ? {
                  ...w,
                  ethBalance: json.data.eth,
                  usdcBalance: json.data.usdc,
                }
              : w
          )
        );
      }
    } catch (err) {
      console.error("Balance refresh error:", err);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const refreshAllBalances = useCallback(() => {
    wallets.forEach((w) => refreshBalance(w.address));
  }, [wallets, refreshBalance]);

  const handleWalletCreated = useCallback(
    (wallet: WalletInfo) => {
      setWallets((prev) => [...prev, wallet]);
      refreshBalance(wallet.address);
    },
    [refreshBalance]
  );

  const handleTransferComplete = useCallback(
    (tx: TransactionResult) => {
      setTransactions((prev) => [...prev, tx]);
      refreshAllBalances();
    },
    [refreshAllBalances]
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Agent Payment Demo
          </h1>
          <p className="text-gray-400">
            Coinbase CDP SDK &middot; Base Sepolia Testnet
          </p>
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-500">Base Sepolia</span>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <WalletPanel
              wallets={wallets}
              onWalletCreated={handleWalletCreated}
              onRefreshBalance={refreshBalance}
              loading={balanceLoading}
            />
            <FaucetPanel wallets={wallets} onFunded={refreshAllBalances} />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <TransferPanel
              wallets={wallets}
              onTransferComplete={handleTransferComplete}
            />
            <TransactionHistory transactions={transactions} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-gray-600">
          <p>
            Powered by{" "}
            <a
              href="https://docs.cdp.coinbase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Coinbase Developer Platform
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
