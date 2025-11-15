"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "./button";

interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
  loading?: boolean;
  label?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function RefreshButton({
  onRefresh,
  loading = false,
  label = "تحديث القائمة",
  className,
  size = "sm",
}: RefreshButtonProps) {
  return (
    <Button
      variant="secondary"
      size={size}
      onClick={onRefresh}
      disabled={loading}
      className={["flex items-center gap-2", className].filter(Boolean).join(" ")}
    >
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> {label}
    </Button>
  );
}
