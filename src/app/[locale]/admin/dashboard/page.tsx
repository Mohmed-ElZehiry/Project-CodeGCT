"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  useAdminUsersQuery,
  useAdminSystemSettingsQuery,
  useAdminAuditLogsQuery,
} from "@/features/admin";
import { useAuthorize } from "@/shared/hooks/useAuthorize";
import { RefreshButton } from "@/shared/components/ui/refresh-button";

export default function AdminDashboardPage() {
  useAuthorize({ allow: ["admin"], redirect: "/user/dashboard" });
  const t = useTranslations("adminDashboard");

  const {
    data: users,
    isLoading: usersLoading,
    refetch: refetchUsers,
    isFetching: usersFetching,
  } = useAdminUsersQuery();
  const {
    data: settings,
    isLoading: settingsLoading,
    refetch: refetchSettings,
    isFetching: settingsFetching,
  } = useAdminSystemSettingsQuery();
  const {
    data: auditLogs,
    isLoading: logsLoading,
    refetch: refetchLogs,
    isFetching: logsFetching,
  } = useAdminAuditLogsQuery({ limit: 10 });

  const handleRefresh = useCallback(async () => {
    await Promise.allSettled([refetchUsers(), refetchSettings(), refetchLogs()]);
  }, [refetchLogs, refetchSettings, refetchUsers]);

  const isRefreshing = usersFetching || settingsFetching || logsFetching;

  const stats = useMemo(() => {
    const totalUsers = users?.length ?? 0;
    const activeUsers = users?.filter((user) => user.status === "active").length ?? 0;
    const supportAgents = users?.filter((user) => user.role === "support").length ?? 0;
    const pendingInvites = users?.filter((user) => user.status === "pending").length ?? 0;
    const auditLogCount24h = auditLogs?.length ?? 0;

    return {
      totalUsers,
      activeUsers,
      supportAgents,
      pendingInvites,
      auditLogCount24h,
    };
  }, [users, auditLogs]);

  const recentUsers = useMemo(() => {
    return (users ?? [])
      .slice()
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
      .slice(0, 5);
  }, [users]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">{t("title")}</h1>
          <p className="text-sm text-slate-400">{t("description")}</p>
        </div>
        <RefreshButton
          onRefresh={handleRefresh}
          loading={isRefreshing}
          className="self-start sm:self-auto"
        />
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label={t("stats.totalUsers")}
          value={usersLoading ? undefined : stats.totalUsers}
          accent="text-blue-300"
        />
        <StatCard
          label={t("stats.activeUsers")}
          value={usersLoading ? undefined : stats.activeUsers}
          accent="text-emerald-300"
        />
        <StatCard
          label={t("stats.supportAgents")}
          value={usersLoading ? undefined : stats.supportAgents}
          accent="text-purple-300"
        />
        <StatCard
          label={t("stats.pendingInvites")}
          value={usersLoading ? undefined : stats.pendingInvites}
          accent="text-amber-300"
        />
        <StatCard
          label={t("stats.audit24h")}
          value={logsLoading ? undefined : stats.auditLogCount24h}
          accent="text-rose-300"
        />
        <StatCard
          label={t("stats.totalSettings")}
          value={settingsLoading ? undefined : (settings?.length ?? 0)}
          accent="text-slate-300"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">{t("recentUsers.title")}</h2>
            <Link
              href="./user-management"
              className="text-sm text-blue-300 underline-offset-2 hover:underline"
            >
              {t("recentUsers.viewAll")}
            </Link>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            {usersLoading && <p className="text-sm text-slate-400">{t("recentUsers.loading")}</p>}
            {!usersLoading && !recentUsers.length && (
              <p className="text-sm text-slate-400">{t("recentUsers.empty")}</p>
            )}
            {!usersLoading && recentUsers.length > 0 && (
              <ul className="space-y-3">
                {recentUsers.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-100">
                        {user.fullName ?? user.email}
                      </p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs capitalize text-blue-200">
                      {user.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">{t("quickLinks.title")}</h2>
          <div className="grid grid-cols-1 gap-3">
            <QuickLinkCard
              href="./user-management"
              title={t("quickLinks.users.title")}
              description={t("quickLinks.users.description")}
            />
            <QuickLinkCard
              href="./system_settings"
              title={t("quickLinks.settings.title")}
              description={t("quickLinks.settings.description")}
            />
            <QuickLinkCard
              href="./logs"
              title={t("quickLinks.logs.title")}
              description={t("quickLinks.logs.description")}
            />
          </div>
        </div>
      </section>
    </div>
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

function QuickLinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-blue-500/40 hover:bg-slate-900/60"
    >
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <span className="mt-3 inline-flex items-center text-sm text-blue-300">
        {"الانتقال الآن →"}
      </span>
    </Link>
  );
}
