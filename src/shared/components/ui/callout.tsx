"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "warning" | "danger";
}

export function Callout({ className, variant = "default", children, ...props }: CalloutProps) {
  const variantClasses = React.useMemo(() => {
    switch (variant) {
      case "warning":
        return "border-amber-400/60 bg-amber-500/10 text-amber-200";
      case "danger":
        return "border-red-500/60 bg-red-500/10 text-red-200";
      default:
        return "border-blue-400/50 bg-blue-500/10 text-blue-100";
    }
  }, [variant]);

  return (
    <div
      role="note"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed",
        variantClasses,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
