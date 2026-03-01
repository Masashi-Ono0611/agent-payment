"use client";

import { useState, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import WalletView from "@/components/WalletView";
import ChatView from "@/components/ChatView";
import ActivityView from "@/components/ActivityView";
import BottomNav from "@/components/BottomNav";

export interface WalletInfo {
  name: string;
  address: string;
  ethBalance?: string;
  usdcBalance?: string;
}

export interface TransactionRecord {
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  status: string;
  explorerUrl: string;
  timestamp: number;
}

export type TabType = "wallet" | "chat" | "activity";

export default function Home() {
  const { address: connectedAddress, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [transactions] = useState<TransactionRecord[]>([]);

  // Track per-wallet loading state to avoid race conditions
  const loadingAddresses = useRef<Set<string>>(new Set());
  const [balanceLoading, setBalanceLoading] = useState(false);

  const refreshBalance = useCallback(async (address: string) => {
    if (loadingAddresses.current.has(address)) return;
    loadingAddresses.current.add(address);
    setBalanceLoading(true);
    try {
      const res = await fetch(
        `/api/balance?address=${encodeURIComponent(address)}`
      );
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
      loadingAddresses.current.delete(address);
      if (loadingAddresses.current.size === 0) {
        setBalanceLoading(false);
      }
    }
  }, []);

  const refreshAllBalances = useCallback(() => {
    wallets.forEach((w) => refreshBalance(w.address));
  }, [wallets, refreshBalance]);

  const handleWalletCreated = useCallback(
    (wallet: WalletInfo) => {
      setWallets((prev) => {
        if (prev.some((w) => w.address === wallet.address)) return prev;
        return [...prev, wallet];
      });
      refreshBalance(wallet.address);
    },
    [refreshBalance]
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-5 pt-4 pb-3 flex items-center justify-between"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="3" width="10" height="10" rx="2" fill="white" />
            </svg>
          </div>
          <span
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            PayAgent
          </span>
        </div>
        <ConnectButton
          chainStatus="icon"
          accountStatus="avatar"
          showBalance={false}
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-lg mx-auto px-4 h-full">
          {activeTab === "wallet" && (
            <div
              className="overflow-y-auto pb-24"
              style={{ height: "calc(100vh - 120px)" }}
            >
              <WalletView
                wallets={wallets}
                onWalletCreated={handleWalletCreated}
                onRefreshBalance={refreshBalance}
                onRefreshAll={refreshAllBalances}
                loading={balanceLoading}
              />
            </div>
          )}
          {activeTab === "chat" && (
            <ChatView
              wallets={wallets}
              onWalletCreated={handleWalletCreated}
              onRefreshBalance={refreshBalance}
              connectedAddress={isConnected ? connectedAddress : undefined}
            />
          )}
          {activeTab === "activity" && (
            <div
              className="overflow-y-auto pb-24"
              style={{ height: "calc(100vh - 120px)" }}
            >
              <ActivityView transactions={transactions} />
            </div>
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
