"use client";

import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg-primary)" }}>
          <div className="max-w-md w-full text-center">
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: "var(--danger-bg)" }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--danger)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Something went wrong
            </h1>
            
            <p
              className="text-sm mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              An unexpected error occurred. Please try again.
            </p>
            
            {this.state.error && (
              <div
                className="rounded-xl p-4 mb-6 text-left overflow-auto max-h-32"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  className="text-xs font-mono break-all"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <button
              onClick={this.handleRetry}
              className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
