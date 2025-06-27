"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1e1e2e] text-[#cdd6f4] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#f38ba8] mb-4">
              Something went wrong
            </h1>
            <p className="text-[#6c7086] mb-4">
              We encountered an error while processing your request.
            </p>
            <button
              className="bg-[#cba6f7] text-[#1e1e2e] px-4 py-2 rounded hover:bg-[#cba6f7]/90"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
