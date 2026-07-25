import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Unhandled application error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 640, margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#14224e" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#475569", marginTop: "0.5rem" }}>
            The application hit an unexpected error instead of loading. Details below:
          </p>
          <pre
            style={{
              background: "#f1f5f9",
              padding: "0.75rem",
              borderRadius: 6,
              marginTop: "0.75rem",
              whiteSpace: "pre-wrap",
              fontSize: "0.8rem",
              color: "#b91c1c",
            }}
          >
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
