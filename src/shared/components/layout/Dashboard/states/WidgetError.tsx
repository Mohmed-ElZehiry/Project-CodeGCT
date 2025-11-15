"use client";

import React from "react";

type WidgetErrorProps = {
  message: string;
  className?: string;
};

export default function WidgetError({ message, className = "" }: WidgetErrorProps) {
  return (
    <div
      className={`p-3 rounded-md bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm ${className}`}
    >
      ❌ {message}
    </div>
  );
}
