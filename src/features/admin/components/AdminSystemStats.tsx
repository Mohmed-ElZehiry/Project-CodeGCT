"use client";

type AdminSystemStatsProps = {
  stats: {
    totalUsers: number;
    activeUsers: number;
    supportAgents: number;
    pendingInvites: number;
    auditLogCount24h: number;
    totalSettings: number;
  };
  loading?: {
    users?: boolean;
    logs?: boolean;
    settings?: boolean;
  };
};

export default function AdminSystemStats({ stats, loading }: AdminSystemStatsProps) {
  const cards: Array<{
    key: keyof AdminSystemStatsProps["stats"];
    label: string;
    accent: string;
  }> = [
    { key: "totalUsers", label: "إجمالي المستخدمين", accent: "text-blue-300" },
    { key: "activeUsers", label: "المستخدمون النشطون", accent: "text-emerald-300" },
    { key: "supportAgents", label: "فريق الدعم", accent: "text-purple-300" },
    { key: "pendingInvites", label: "دعوات قيد الانتظار", accent: "text-amber-300" },
    { key: "auditLogCount24h", label: "سجلات التدقيق (24 ساعة)", accent: "text-rose-300" },
    { key: "totalSettings", label: "إجمالي الإعدادات", accent: "text-slate-300" },
  ];

  const isLoading = Boolean(loading?.users || loading?.logs || loading?.settings);

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          value={isLoading ? undefined : stats[card.key]}
          accent={card.accent}
        />
      ))}
    </section>
  );
}

function StatCard({ label, value, accent }: { label: string; value?: number; accent: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 shadow-sm shadow-slate-900/10">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>
        {typeof value === "number" ? value : "…"}
      </p>
    </div>
  );
}
