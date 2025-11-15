"use client";

import React from "react";

export default function EmptyState({ message, loading }: { message: string; loading?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 text-gray-500 dark:text-gray-400">
      {loading ? <div className="animate-pulse">⏳ {message}</div> : <div>{message}</div>}
    </div>
  );
}
