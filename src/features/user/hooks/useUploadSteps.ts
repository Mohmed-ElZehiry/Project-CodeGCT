"use client";

import { useEffect, useState } from "react";
import { UploadStep, UploadStepType } from "@/features/user/types/user";
import {
  getStepsClient,
  addStepClient,
} from "@/features/user/services/uploads/uploadStepsClientService";

export function useUploadSteps(uploadId: string) {
  const [steps, setSteps] = useState<UploadStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uploadId) return;
    refreshSteps(uploadId);
  }, [uploadId]);

  async function refreshSteps(uid: string) {
    setLoading(true);
    try {
      const res = await getStepsClient(uid);
      if (!res.success) throw new Error(res.error || "Failed to fetch steps");
      setSteps(res.data ?? []);
      setError(null);
    } catch (err: any) {
      console.error("❌ [DEBUG] useUploadSteps error:", err.message || err);
      setError(err.message || "Unknown error while fetching steps");
    } finally {
      setLoading(false);
    }
  }

  async function addUploadStep(
    step: UploadStepType,
    details?: any,
    actor?: string,
    link?: string,
    outcome: "pending" | "running" | "done" | "error" = "pending",
    statusCode?: number,
    durationMs?: number,
    category?: string,
  ) {
    try {
      const res = await addStepClient(
        uploadId,
        step,
        details,
        actor,
        link,
        outcome,
        statusCode,
        durationMs,
        category,
      );
      if (!res.success) throw new Error(res.error || "Failed to add step");
      const newStep: UploadStep = res.data!;
      setSteps((prev) => [...prev, newStep]);
      return newStep;
    } catch (err: any) {
      console.error("❌ [DEBUG] addUploadStep error:", err.message || err);
      setError(err.message || "Unknown error while adding step");
      throw err;
    }
  }

  return { steps, loading, error, addUploadStep, refreshSteps, setSteps };
}
