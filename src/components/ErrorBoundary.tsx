/**
 * GluMira™ V7 — ErrorBoundary.tsx
 * Global crash recovery. Catches any unhandled render error and shows a
 * recovery screen instead of a blank white page.
 * Educational platform, NOT a medical device — see Rule 27.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
}

type State = {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Forward to Sentry when initialized
    const w = window as unknown as { Sentry?: { captureException: (e: Error, ctx: object) => void } };
    if (typeof window !== "undefined" && w.Sentry) {
      w.Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8F9FA",
          padding: "24px",
          textAlign: "center",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#FFFFFF",
            borderRadius: 16,
            padding: "40px 32px",
            boxShadow: "0 4px 24px rgba(26,42,94,0.10)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🦉</div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#1A2A5E",
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: "#4A5568", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            GluMira™ ran into an unexpected error. Your data is safe — this is a
            display problem, not a data problem. Tap below to return to your dashboard.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              background: "#1A2A5E",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              padding: "14px 32px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
              minHeight: 48,
            }}
          >
            Return to Dashboard
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details style={{ marginTop: 24, textAlign: "left" }}>
              <summary style={{ color: "#718096", fontSize: 13, cursor: "pointer" }}>
                Error details (dev only)
              </summary>
              <pre
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: "#FEF2F2",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#C53030",
                  overflowX: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {this.state.error.message}
                {"\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
        <p style={{ marginTop: 16, color: "#A0AEC0", fontSize: 13 }}>
          GluMira™ — educational platform, not a medical device
        </p>
      </div>
    );
  }
}
