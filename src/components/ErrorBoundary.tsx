import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center w-full h-full p-8 text-slate-500 bg-slate-50 dark:bg-slate-900/50 min-h-[400px]">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Something went wrong</h2>
          <p className="text-sm text-center mb-6 max-w-md opacity-80">
            {this.state.error?.message || "The application encountered an unexpected error while rendering this component."}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-md transition"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
