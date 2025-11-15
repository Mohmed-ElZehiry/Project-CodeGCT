"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import UploadInstructions from "./UploadInstructions";
import UploadDropzone from "./UploadDropzone";
import SuccessMessage from "../common/SuccessMessage";
import ErrorAlert from "../common/ErrorAlert";
import { useFileUpload } from "@/features/user/hooks/useFileUpload";
import type { Upload, ProjectSummary } from "@/features/user/types/user";

type FileUploadWidgetProps = {
  projectId?: string | null;
  onUploadSuccess?: (uploads: Upload[]) => void;
};

type ProjectMode = "existing" | "new";

function resolveLocale() {
  if (typeof window === "undefined") return "en";
  return window.location.pathname.split("/")[1] || "en";
}

export default function FileUploadWidget({
  projectId = null,
  onUploadSuccess,
}: FileUploadWidgetProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [mode, setMode] = useState<ProjectMode>("existing");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [newProjectDescription, setNewProjectDescription] = useState<string>("");
  const [creatingProject, setCreatingProject] = useState<boolean>(false);

  const locale = useMemo(resolveLocale, []);

  const { files, uploading, error, handleFiles, setProjectId } = useFileUpload(projectId);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    try {
      const response = await fetch(`/${locale}/api/user/projects`);
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "تعذر تحميل قائمة المشاريع");
      }
      const list: ProjectSummary[] = Array.isArray(json.data)
        ? json.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description ?? null,
            code: item.code ?? null,
            createdAt: item.created_at ?? null,
          }))
        : [];
      setProjects(list);
      if (list.length === 0) {
        setMode("new");
        setSelectedProjectId("");
        setProjectId(null);
      }
    } catch (err: any) {
      setProjects([]);
      setProjectsError(err?.message || "حدث خطأ أثناء تحميل المشاريع");
    } finally {
      setProjectsLoading(false);
    }
  }, [locale, setProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (projectId) {
      setMode("existing");
      setSelectedProjectId(projectId);
      setProjectId(projectId);
    }
  }, [projectId, setProjectId]);

  const existingProjectsOptions = useMemo(() => {
    return projects.map((project) => ({
      value: project.id,
      label: project.code ? `${project.name} · ${project.code}` : project.name,
    }));
  }, [projects]);

  const handleModeChange = (nextMode: ProjectMode) => {
    if (nextMode === "existing" && projects.length === 0) {
      setProjectError("لا توجد مشاريع حالياً. أنشئ مشروعًا جديدًا أولاً.");
      return;
    }
    setMode(nextMode);
    setProjectError(null);
    if (nextMode === "existing") {
      if (selectedProjectId) {
        setProjectId(selectedProjectId);
      }
    } else {
      setProjectId(null);
    }
  };

  const handleSelectProject = (value: string) => {
    setSelectedProjectId(value);
    setProjectId(value || null);
    setProjectError(null);
  };

  const createProject = useCallback(async (): Promise<string> => {
    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      throw new Error("يرجى إدخال اسم المشروع الجديد قبل الرفع");
    }

    setCreatingProject(true);
    try {
      const response = await fetch(`/${locale}/api/user/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: newProjectDescription.trim() || undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "تعذر إنشاء المشروع الجديد");
      }
      const created: ProjectSummary = {
        id: json.data.id,
        name: json.data.name,
        description: json.data.description,
        code: json.data.code,
        createdAt: json.data.created_at,
      };
      setProjects((prev) => [created, ...prev]);
      setMode("existing");
      setSelectedProjectId(created.id);
      setProjectId(created.id);
      setNewProjectName("");
      setNewProjectDescription("");
      setProjectError(null);
      return created.id;
    } finally {
      setCreatingProject(false);
    }
  }, [locale, newProjectName, newProjectDescription, setProjectId]);

  const ensureProjectId = useCallback(async (): Promise<string | null> => {
    setProjectError(null);
    if (mode === "existing") {
      if (!selectedProjectId) {
        setProjectError("اختر مشروعًا موجودًا قبل رفع الملفات");
        return null;
      }
      return selectedProjectId;
    }

    try {
      const newId = await createProject();
      return newId;
    } catch (err: any) {
      setProjectError(err?.message || "تعذر إنشاء المشروع الجديد");
      return null;
    }
  }, [createProject, mode, selectedProjectId]);

  const handleDropzoneSelect = async (fileList: FileList) => {
    const targetProjectId = await ensureProjectId();
    if (!targetProjectId) return;

    try {
      const uploads = await handleFiles(fileList, targetProjectId);
      onUploadSuccess?.(uploads);
    } catch (err: any) {
      setProjectError(err?.message || "تعذر رفع الملفات للمشروع المحدد");
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-glass p-6 space-y-4 animate-fadeIn">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">رفع الملفات</h2>

      <UploadInstructions />

      <div className="space-y-4">
        <div className="flex flex-col gap-2 text-sm">
          <label className="font-medium text-foreground">حدد نوع العملية</label>
          <div className="flex flex-wrap gap-4">
            <label
              className={`inline-flex items-center gap-2 text-xs sm:text-sm ${projects.length === 0 ? "text-muted-foreground" : "text-foreground"}`}
            >
              <input
                type="radio"
                name="project-mode"
                value="existing"
                checked={mode === "existing"}
                onChange={() => handleModeChange("existing")}
                disabled={projects.length === 0}
              />
              تحديث مشروع موجود
            </label>
            <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-foreground">
              <input
                type="radio"
                name="project-mode"
                value="new"
                checked={mode === "new"}
                onChange={() => handleModeChange("new")}
              />
              إنشاء مشروع جديد
            </label>
          </div>
        </div>

        {projectsError && <ErrorAlert title="تعذر تحميل المشاريع">{projectsError}</ErrorAlert>}

        {mode === "existing" ? (
          <div className="space-y-2">
            <label
              htmlFor="existing-project-select"
              className="text-xs font-medium text-muted-foreground"
            >
              اختر مشروعًا لتحديث إصداره
            </label>
            {projectsLoading ? (
              <p className="text-xs text-muted-foreground">⏳ جاري تحميل المشاريع...</p>
            ) : projects.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                لا توجد مشاريع حتى الآن. أنشئ مشروعًا جديدًا أولاً.
              </p>
            ) : (
              <select
                id="existing-project-select"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedProjectId}
                onChange={(event) => handleSelectProject(event.target.value)}
              >
                <option value="">-- اختر مشروعًا --</option>
                {existingProjectsOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              تفاصيل المشروع الجديد
            </label>
            <input
              type="text"
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="اسم المشروع"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <textarea
              value={newProjectDescription}
              onChange={(event) => setNewProjectDescription(event.target.value)}
              placeholder="وصف مختصر (اختياري)"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-[0.7rem] text-muted-foreground">
              سيتم إنشاء المشروع أولاً ثم رفع الإصدار الأول تلقائيًا.
            </p>
          </div>
        )}
      </div>

      <UploadDropzone
        uploading={uploading || creatingProject}
        onSelectFiles={handleDropzoneSelect}
      />

      {projectError && <ErrorAlert title="إعداد المشروع">{projectError}</ErrorAlert>}

      {error && <ErrorAlert title="حدث خطأ">{error}</ErrorAlert>}

      {!uploading && files.length > 0 && !error && <SuccessMessage files={files} />}
    </div>
  );
}
