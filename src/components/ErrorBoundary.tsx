import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  message?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Also push to window for global handler to pick up
    if (typeof window !== 'undefined' && (window as any)._pushLog) {
      (window as any)._pushLog('error_boundary', [error.message, error.stack]);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-4">
          <div className="bg-panel border border-hairline rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-400/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-display font-bold text-text-primary mb-2">Something went wrong</h2>
            <p className="text-text-muted font-sans text-sm mb-6">
              {this.props.message || "We encountered an unexpected error. Please refresh the page to try again."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-violet hover:bg-violet/90 text-white px-6 py-2.5 rounded-lg font-sans font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
