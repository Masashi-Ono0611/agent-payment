"use client";

import { useState, useCallback } from "react";
import WalletView from "@/components/WalletView";
import SendView from "@/components/SendView";
import ActivityView from "@/components/ActivityView";
import BottomNav from "@/components/BottomNav";
import { TransactionResult } from "@/components/SendView";

export interface WalletInfo {
  name: string;
  address: string;
  ethBalance?: string;
  usdcBalance?: string;
}

export type TabType = "wallet" | "send" | "activity";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("wallet");
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
              ? { ...w, ethBalance: json.data.eth, usdcBalance: json.data.usdc }
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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 px-5 pt-4 pb-3 flex items-center justify-between" style={{ background: "var(--bg-primary)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="3" width="10" height="10" rx="2" fill="white"/>
            </svg>
          </div>
          <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Agent Pay
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
          <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: "var(--success)" }} />
          Base Sepolia
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto px-4">
          {activeTab === "wallet" && (
            <WalletView
              wallets={wallets}
              onWalletCreated={handleWalletCreated}
              onRefreshBalance={refreshBalance}
              onRefreshAll={refreshAllBalances}
              loading={balanceLoading}
            />
          )}
          {activeTab === "send" && (
            <SendView
              wallets={wallets}
              onTransferComplete={handleTransferComplete}
              onNavigateToWallet={() => setActiveTab("wallet")}
            />
          )}
          {activeTab === "activity" && (
            <ActivityView transactions={transactions} />
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        txCount={transactions.length}
      />
    </div>
  );
}
