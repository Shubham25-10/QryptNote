import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class WebGLBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebGL component error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full h-full flex items-center justify-center bg-panel/30 border border-hairline rounded-2xl relative overflow-hidden">
           <div className="absolute inset-0 bg-violet/5 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet/20 via-ink to-ink" />
           <div className="w-24 h-24 border border-violet/30 rounded-lg rotate-45 animate-pulse bg-violet/5" />
        </div>
      );
    }
    return this.props.children;
  }
}
