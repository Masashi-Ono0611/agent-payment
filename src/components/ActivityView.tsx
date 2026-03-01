"use client";

import type { TransactionRecord } from "@/app/page";

interface ActivityViewProps {
  transactions: TransactionRecord[];
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ActivityView({ transactions }: ActivityViewProps) {
  if (transactions.length === 0) {
    return (
      <div className="animate-fade-in text-center py-20">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "var(--bg-secondary)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          No activity yet
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          Transactions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mt-2 mx-1">
      <h2 className="text-[11px] uppercase tracking-wider font-medium mb-3 px-1" style={{ color: "var(--text-tertiary)" }}>
        Recent Transactions
      </h2>
      <div className="space-y-1.5">
        {transactions
          .slice()
          .reverse()
          .map((tx, i) => (
            <a
              key={`${tx.transactionHash}-${i}`}
              href={tx.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 animate-slide-up"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                animationDelay: `${i * 50}ms`,
              }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{
                  background: tx.status === "confirmed" ? "var(--accent-bg)" : "var(--danger-bg)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tx.status === "confirmed" ? "var(--accent-light)" : "var(--danger)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5" /><path d="M5 12l7-7 7 7" />
                </svg>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Sent
                  </span>
                  <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-primary)" }}>
                    -{tx.amount} {tx.token.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono truncate" style={{ color: "var(--text-tertiary)" }}>
                    To {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                  </span>
                  <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: "var(--text-tertiary)" }}>
                    {timeAgo(tx.timestamp)}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          ))}
      </div>
    </div>
  );
}
