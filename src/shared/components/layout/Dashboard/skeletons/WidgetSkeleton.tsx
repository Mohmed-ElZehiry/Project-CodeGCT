"use client";

import React from "react";

type WidgetSkeletonProps = {
  lines?: number;
  showHeader?: boolean;
  className?: string;
};

export default function WidgetSkeleton({
  lines = 3,
  showHeader = true,
  className = "",
}: WidgetSkeletonProps) {
  return (
    <div
      className={`p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-pulse ${className}`}
    >
      {showHeader && (
        <div className="mb-3 space-y-2">
          <div className="h-5 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      )}
      <div className="space-y-2">
        {renderBlocks(lines, "h-4 w-full bg-gray-200 dark:bg-gray-700 rounded")}
      </div>
    </div>
  );
}

function renderBlocks(count: number, className: string) {
  return [...Array(count)].map((_, i) => (
    <div key={i} className={className} aria-hidden="true"></div>
  ));
}
