"use client";

import React, { useState } from "react";
import { useReports } from "../../hooks/reports/useReports";
import type { AnalysisReport } from "../../types/user";

export const ReportViewer: React.FC = () => {
  const { readReport } = useReports();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [reportId, setReportId] = useState<string>("");

  const handleLoad = async () => {
    try {
      const res = await readReport(reportId);
      if (!res) throw new Error("Failed to load report");
      setReport(res);
    } catch (err) {
      console.error("❌ Failed to load report:", err);
    }
  };

  return (
    <div className="border p-4 rounded-md">
      <h2 className="text-xl font-semibold mb-2">Report Viewer</h2>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Enter report ID"
          value={reportId}
          onChange={(e) => setReportId(e.target.value)}
          className="border p-1 rounded"
        />
        <button onClick={handleLoad} className="btn btn-sm">
          Load Report
        </button>
      </div>
      {report ? (
        <pre className="bg-gray-100 p-2 rounded overflow-x-auto text-sm">
          {JSON.stringify(report, null, 2)}
        </pre>
      ) : (
        <p>No report loaded.</p>
      )}
    </div>
  );
};
