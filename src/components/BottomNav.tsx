"use client";

import { TabType } from "@/app/page";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  txCount: number;
}

const tabs: { id: TabType; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: "wallet",
    label: "Wallet",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--accent)" : "var(--text-tertiary)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="14" rx="3" />
        <path d="M2 10h20" />
        <circle cx="17" cy="14" r="1.5" fill={active ? "var(--accent)" : "var(--text-tertiary)"} stroke="none" />
        <path d="M6 6V5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1" />
      </svg>
    ),
  },
  {
    id: "chat",
    label: "Chat",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--accent)" : "var(--text-tertiary)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "activity",
    label: "Activity",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--accent)" : "var(--text-tertiary)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

export default function BottomNav({ activeTab, onTabChange, txCount }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl"
      style={{
        background: "rgba(13, 17, 23, 0.92)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-xl transition-all duration-200 relative"
            style={{
              background: activeTab === tab.id ? "var(--accent-bg)" : "transparent",
            }}
          >
            {tab.icon(activeTab === tab.id)}
            <span
              className="text-[10px] font-medium"
              style={{
                color: activeTab === tab.id ? "var(--accent)" : "var(--text-tertiary)",
              }}
            >
              {tab.label}
            </span>
            {tab.id === "activity" && txCount > 0 && (
              <span
                className="absolute -top-0.5 right-3 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white px-1"
                style={{ background: "var(--accent)" }}
              >
                {txCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
