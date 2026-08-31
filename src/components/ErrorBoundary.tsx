import React, { Component, ErrorInfo, ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  /** Custom fallback UI. Receives error + reset fn. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Called when an error is caught — use for Sentry/logging. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Compact inline variant for non-critical widgets */
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateErrorId(): string {
  return `err-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: '' };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // Send to Sentry if available globally
    if (typeof window !== 'undefined') {
      type SentryWindow = { Sentry?: { captureException: (e: Error, ctx: object) => void } };
      const w = window as unknown as SentryWindow;
      if (w.Sentry) {
        w.Sentry.captureException(error, {
          extra: { componentStack: errorInfo.componentStack, errorId: this.state.errorId },
        });
      }
    }
  }

  reset(): void {
    this.setState({ hasError: false, error: null, errorId: '' });
  }

  render(): ReactNode {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    // Custom fallback
    if (this.props.fallback) {
      return this.props.fallback(this.state.error, this.reset);
    }

    // Inline variant (for small widgets)
    if (this.props.inline) {
      return (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <span>⚠</span>
          <span>Something went wrong.</span>
          <button
            onClick={this.reset}
            className="ml-auto underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      );
    }

    // Full-page fallback
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8 text-center">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
          <svg
            className="h-10 w-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="max-w-sm space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            An unexpected error occurred. The error has been logged and we'll look into it.
          </p>
        </div>

        {/* Error detail (collapsed in prod) */}
        {(typeof process === "undefined" || process.env.NODE_ENV !== "production") && (
          <details className="w-full max-w-lg rounded-lg border border-red-200 bg-red-50 p-4 text-left dark:border-red-800 dark:bg-red-950">
            <summary className="cursor-pointer text-sm font-medium text-red-700 dark:text-red-300">
              Error details (dev only)
            </summary>
            <pre className="mt-2 overflow-auto text-xs text-red-600 dark:text-red-400">
              {this.state.error.stack ?? this.state.error.message}
            </pre>
            <p className="mt-2 text-xs text-gray-400">ID: {this.state.errorId}</p>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={this.reset}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience wrapper (for non-critical sections)
// ─────────────────────────────────────────────────────────────────────────────

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  boundaryProps?: Omit<Props, 'children'>
): React.FC<P> {
  const displayName = WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component';

  const ComponentWithBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...boundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithBoundary.displayName = `withErrorBoundary(${displayName})`;
  return ComponentWithBoundary;
}

export default ErrorBoundary;
