"use client";

import React from "react";

type DashboardContentProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
};

export default function DashboardContent({
  children,
  title,
  description,
  className = "",
}: DashboardContentProps) {
  return (
    <section className={`w-full space-y-6 animate-fadeIn ${className}`}>
      {/* ✅ العنوان والوصف */}
      {(title || description) && (
        <header className="mb-4">
          {title && <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </header>
      )}

      {/* ✅ المحتوى */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
    </section>
  );
}
