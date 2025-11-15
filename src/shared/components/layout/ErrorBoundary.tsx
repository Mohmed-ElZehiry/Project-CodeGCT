"use client";

import * as React from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import Link from "next/link";

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function FallbackComponent({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 p-4">
      <h2 className="text-xl font-bold text-red-600">⚠️ Something went wrong</h2>
      <p className="text-muted-foreground">{error?.message || "Unexpected error occurred"}</p>
      <div className="flex gap-3">
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
        >
          Refresh
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-muted transition"
          onClick={resetErrorBoundary}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const handleError = React.useCallback((error: Error, info: React.ErrorInfo) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("❌ ErrorBoundary caught:", error, info.componentStack);
    }
  }, []);

  return (
    <ReactErrorBoundary FallbackComponent={FallbackComponent} onError={handleError}>
      {children}
    </ReactErrorBoundary>
  );
}
