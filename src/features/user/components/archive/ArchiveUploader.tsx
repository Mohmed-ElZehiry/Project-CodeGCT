"use client";

import { useState } from "react";
import BackupStatus from "./ArchiveStatus";
import { useTranslations } from "next-intl";
import { useArchiveUploader } from "../../hooks/useArchiveUploader";

export default function BackupUploader() {
  const t = useTranslations("homeClient");
  const { status, error, archiveInfo, uploadArchive } = useArchiveUploader();
  const [files, setFiles] = useState<FileList | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!files) return;
    await uploadArchive(files);
  }

  return (
    <div className="w-full bg-slate-900/70 border border-slate-700 rounded-2xl shadow-xl p-8 backdrop-blur-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-blue-400"> {t("title")}</h2>
        <p className="text-slate-400 mt-2 text-sm">{t("description")}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="files" className="block text-sm font-medium text-slate-300 mb-2">
            {t("fileLabel")}
          </label>
          <input
            type="file"
            name="files"
            id="files"
            multiple
            // @ts-ignore
            webkitdirectory=""
            onChange={(e) => setFiles(e.target.files)}
            className="block w-full text-sm text-slate-300 
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-600 file:text-white
                       hover:file:bg-blue-700
                       cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={status === "in-progress"}
          className="w-full flex justify-center items-center px-6 py-3 rounded-lg
                     bg-blue-600 text-white font-semibold shadow-md
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
        >
          {status === "in-progress" ? `⏳ ${t("processing")}` : t("createBackup")}
        </button>
      </form>

      {/* ✅ BackupStatus hook-based */}
      <BackupStatus />
    </div>
  );
}
