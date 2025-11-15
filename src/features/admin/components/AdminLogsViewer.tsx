"use client";

import { useEffect, useState } from "react";

type LogEntry = {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  context?: Record<string, any>;
  createdAt: string;
};

type LogsViewerProps = {
  fetchLogs: () => Promise<LogEntry[]>; // دالة تجيب السجلات من API أو Service
  title?: string;
};

export default function LogsViewer({ fetchLogs, title = "📜 Logs Viewer" }: LogsViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const data = await fetchLogs();
        setLogs(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(
    (log) =>
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      log.level.toLowerCase().includes(filter.toLowerCase()),
  );

  if (loading) return <p className="text-blue-400">⏳ جاري تحميل السجلات...</p>;
  if (error) return <p className="text-red-500">❌ {error}</p>;
  if (!logs.length) return <p className="text-slate-400">⚠️ لا توجد سجلات</p>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-blue-400">{title}</h2>
        <input
          type="text"
          placeholder="🔍 بحث..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1 rounded bg-slate-800 border border-slate-600 text-slate-200 text-sm"
        />
      </header>

      <div className="overflow-x-auto border border-slate-700 rounded-lg">
        <table className="min-w-full text-sm text-slate-300">
          <thead className="bg-slate-800 text-slate-200">
            <tr>
              <th className="px-4 py-2 text-left">🆔 ID</th>
              <th className="px-4 py-2 text-left">⚡ Level</th>
              <th className="px-4 py-2 text-left">💬 Message</th>
              <th className="px-4 py-2 text-left">📦 Context</th>
              <th className="px-4 py-2 text-left">⏰ Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                <td className="px-4 py-2 font-mono text-slate-400">{log.id}</td>
                <td
                  className={`px-4 py-2 font-semibold ${
                    log.level === "error"
                      ? "text-red-400"
                      : log.level === "warn"
                        ? "text-yellow-400"
                        : log.level === "info"
                          ? "text-blue-400"
                          : "text-slate-400"
                  }`}
                >
                  {log.level.toUpperCase()}
                </td>
                <td className="px-4 py-2">{log.message}</td>
                <td className="px-4 py-2 text-slate-400">
                  {log.context ? JSON.stringify(log.context) : "-"}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
