"use client";

import React, { useState } from "react";
import EmptyState from "../widgets/EmptyState";
import { useAuth } from "@/shared/hooks/useAuth";

type DiffPreviewEntry = {
  line: number;
  a: string;
  b: string;
};

function buildComparisonSummary(fileA: File, contentA: string, fileB: File, contentB: string) {
  const linesA = contentA.split(/\r?\n/);
  const linesB = contentB.split(/\r?\n/);
  const diffPreview: DiffPreviewEntry[] = [];
  const maxPreview = 10;
  const longestLength = Math.max(linesA.length, linesB.length);

  for (let index = 0; index < longestLength && diffPreview.length < maxPreview; index++) {
    const aLine = linesA[index] ?? "";
    const bLine = linesB[index] ?? "";
    if (aLine !== bLine) {
      diffPreview.push({ line: index + 1, a: aLine, b: bLine });
    }
  }

  return {
    identical: contentA === contentB,
    files: {
      a: {
        name: fileA.name,
        sizeBytes: fileA.size,
        lineCount: linesA.length,
      },
      b: {
        name: fileB.name,
        sizeBytes: fileB.size,
        lineCount: linesB.length,
      },
    },
    diffPreview,
    stats: {
      differingLines: diffPreview.length,
      totalLines: longestLength,
    },
  };
}

export default function ComparisonForm() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileA || !fileB || !user?.id) return;

    setLoading(true);
    setResult(null);

    try {
      const contentA = await fileA.text();
      const contentB = await fileB.text();

      const summary = buildComparisonSummary(fileA, contentA, fileB, contentB);

      setResult({ success: true, data: summary });
    } catch (err: any) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border border-slate-700 rounded-lg bg-slate-900/40">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          onChange={(e) => setFileA(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
        <input
          type="file"
          onChange={(e) => setFileB(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />

        <button
          type="submit"
          disabled={loading || !fileA || !fileB}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
        >
          {loading ? "⏳ جاري المقارنة..." : "🚀 ابدأ المقارنة"}
        </button>
      </form>

      {/* ✅ عرض النتيجة */}
      <div className="mt-6">
        {result && !result.success && <EmptyState message={result.error || "❌ فشلت المقارنة"} />}

        {result && result.success && (
          <div className="p-4 border border-green-700 rounded bg-green-900/30 mt-4">
            <p className="text-green-400 font-semibold mb-2">✅ تمت المقارنة بنجاح</p>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
