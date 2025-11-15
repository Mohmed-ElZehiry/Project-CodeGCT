"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

type Props = {
  title: string;
  message?: string;
  children?: React.ReactNode;
};

export default function ErrorAlert({ title, message, children }: Props) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-600 dark:text-red-400 animate-fadeIn">
      <div className="flex items-center gap-2 font-medium mb-1">
        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <span>{title}</span>
      </div>
      {message && <p className="pl-6">{message}</p>}
      {children && <div className="pl-6">{children}</div>}
    </div>
  );
}
