"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useMemo, FormEvent } from "react";
import type { WalletInfo } from "@/app/page";

interface ChatViewProps {
  wallets: WalletInfo[];
  onWalletCreated: (wallet: WalletInfo) => void;
  onRefreshBalance: (address: string) => void;
  connectedAddress?: string;
}

// Helper to extract tool name from part type (e.g., "tool-create_wallet" → "create_wallet")
function getToolName(partType: string): string | null {
  if (partType.startsWith("tool-")) return partType.slice(5);
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPart = any;

export default function ChatView({
  wallets,
  onWalletCreated,
  onRefreshBalance,
  connectedAddress,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  // Keep refs so the transport body always has latest data
  const walletsRef = useRef(wallets);
  walletsRef.current = wallets;
  const connectedRef = useRef(connectedAddress);
  connectedRef.current = connectedAddress;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        body: () => ({
          wallets: walletsRef.current.map((w) => ({
            name: w.name,
            address: w.address,
          })),
          connectedAddress: connectedRef.current,
        }),
      }),
    []
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Sync wallet creations from tool calls
  useEffect(() => {
    for (const msg of messages) {
      if (msg.role !== "assistant" || !msg.parts) continue;
      for (const part of msg.parts) {
        const toolName = getToolName(part.type);
        if (!toolName) continue;
        const p = part as AnyPart;

        if (toolName === "create_wallet" && p.state === "output-available") {
          const result = p.output as { success: boolean; name: string; address: string };
          if (result?.success && result.address) {
            onWalletCreated({ name: result.name, address: result.address });
          }
        }
        if (toolName === "check_balance" && p.state === "output-available") {
          const result = p.output as { address?: string };
          if (result?.address) onRefreshBalance(result.address);
        }
        if ((toolName === "request_faucet" || toolName === "send_payment") && p.state === "output-available") {
          wallets.forEach((w) => onRefreshBalance(w.address));
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    sendMessage({ text });
  };

  const handleSuggestion = (text: string) => {
    setInput("");
    sendMessage({ text });
  };

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "var(--accent-bg)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              PayAgent
            </h3>
            <p className="text-xs mb-6" style={{ color: "var(--text-tertiary)" }}>
              Your AI payment assistant on Base Sepolia
            </p>

            {/* Quick Actions */}
            <div className="space-y-2 max-w-xs mx-auto">
              {[
                "Create a wallet called MyAgent",
                "Check my balance",
                "Get testnet ETH from faucet",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-xs transition-all duration-200"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          if (message.role !== "user" && message.role !== "assistant") return null;

          // Extract text content and tool parts
          const textParts: string[] = [];
          const toolParts: { name: string; state: string; result?: unknown }[] = [];

          if (message.parts) {
            for (const part of message.parts) {
              if (part.type === "text" && (part as AnyPart).text) {
                textParts.push((part as AnyPart).text);
              }
              const toolName = getToolName(part.type);
              if (toolName) {
                const p = part as AnyPart;
                toolParts.push({
                  name: toolName,
                  state: p.state,
                  result: p.state === "output-available" ? p.output : undefined,
                });
              }
            }
          }

          const textContent = textParts.join("");
          const isUser = message.role === "user";

          return (
            <div key={message.id}>
              {/* Tool indicators */}
              {toolParts.map((tp, i) => (
                <div key={`${message.id}-tool-${i}`} className="flex justify-start mb-1.5">
                  <div
                    className="px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {tp.state === "output-available" ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : tp.state === "output-error" ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--error, red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    ) : (
                      <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full spinner" />
                    )}
                    {tp.name.replace(/_/g, " ")}
                  </div>
                </div>
              ))}

              {/* Text bubble */}
              {textContent && (
                <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-slide-up`}>
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isUser ? "rounded-br-md" : "rounded-bl-md"
                    }`}
                    style={{
                      background: isUser ? "var(--accent)" : "var(--bg-secondary)",
                      color: isUser ? "white" : "var(--text-primary)",
                      border: isUser ? "none" : "1px solid var(--border)",
                    }}
                  >
                    <MessageContent content={textContent} />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading */}
        {isLoading && messages.length > 0 && (() => {
          const lastMsg = messages[messages.length - 1];
          const hasActiveToolCall = lastMsg?.parts?.some((p: AnyPart) => {
            const tn = getToolName(p.type);
            return tn && p.state !== "output-available" && p.state !== "output-error";
          });
          return !hasActiveToolCall;
        })() && (
          <div className="flex justify-start animate-slide-up">
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-md"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "var(--accent)", animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "var(--accent)", animationDelay: "200ms" }} />
                <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: "var(--accent)", animationDelay: "400ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-1 pb-2 pt-2">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-xl p-1.5"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message PayAgent..."
            disabled={isLoading}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-20"
            style={{ background: "var(--accent)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" /><path d="M5 12l7-7 7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  if (!content) return null;
  const parts = content.split(/(https:\/\/sepolia\.basescan\.org\/tx\/\S+)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("https://sepolia.basescan.org")) {
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer"
              className="underline break-all" style={{ color: "var(--accent-light)" }}>
              View on BaseScan
            </a>
          );
        }
        const codeParts = part.split(/(`[^`]+`)/g);
        return codeParts.map((cp, j) => {
          if (cp.startsWith("`") && cp.endsWith("`")) {
            return (
              <code key={`${i}-${j}`} className="px-1 py-0.5 rounded text-xs font-mono"
                style={{ background: "rgba(255,255,255,0.1)" }}>
                {cp.slice(1, -1)}
              </code>
            );
          }
          const boldParts = cp.split(/(\*\*[^*]+\*\*)/g);
          return boldParts.map((bp, k) => {
            if (bp.startsWith("**") && bp.endsWith("**")) {
              return <strong key={`${i}-${j}-${k}`}>{bp.slice(2, -2)}</strong>;
            }
            return <span key={`${i}-${j}-${k}`}>{bp}</span>;
          });
        });
      })}
    </>
  );
}
