"use client";

import React from "react";

type WidgetContainerProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode; // أزرار أو روابط في الهيدر
  children: React.ReactNode; // محتوى الـ widget
  className?: string;
};

export default function WidgetContainer({
  title,
  description,
  actions,
  children,
  className = "",
}: WidgetContainerProps) {
  return (
    <div
      className={`p-6 rounded-xl border border-border bg-card shadow-glass animate-fadeIn ${className}`}
    >
      {/* ✅ Header */}
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4 border-b border-muted pb-2">
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-bold text-foreground tracking-wide flex items-center gap-2">
                {title}
              </h3>
            )}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* ✅ Content */}
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}
