"use client";

import { TransactionResult } from "./TransferPanel";

interface TransactionHistoryProps {
  transactions: TransactionResult[];
}

export default function TransactionHistory({
  transactions,
}: TransactionHistoryProps) {
  if (transactions.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">
        Transaction History
      </h2>
      <div className="space-y-3">
        {transactions
          .slice()
          .reverse()
          .map((tx, i) => (
            <div
              key={`${tx.transactionHash}-${i}`}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    tx.status === "confirmed"
                      ? "bg-green-900/50 text-green-400"
                      : tx.status === "failed"
                      ? "bg-red-900/50 text-red-400"
                      : "bg-yellow-900/50 text-yellow-400"
                  }`}
                >
                  {tx.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-white mb-1">
                <span className="text-gray-400">
                  {tx.amount} {tx.token.toUpperCase()}
                </span>
              </p>
              <p className="text-xs text-gray-500 font-mono">
                {tx.from.slice(0, 8)}... → {tx.to.slice(0, 8)}...
              </p>
              <a
                href={tx.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline mt-1 inline-block"
              >
                View on BaseScan
              </a>
            </div>
          ))}
      </div>
    </div>
  );
}
