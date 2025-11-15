// src/features/user/services/backupClient.ts

export type BackupResponse = {
  success: boolean;
  data: any;
  error: string | null;
};

// ✅ رفع نسخة احتياطية
export async function uploadBackup(formData: FormData): Promise<BackupResponse> {
  const res = await fetch("/api/user/archive", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    return {
      success: false,
      data: null,
      error: `Upload failed with status ${res.status}`,
    };
  }

  return res.json();
}

// ✅ جلب قائمة النسخ
export async function fetchBackups(): Promise<BackupResponse> {
  const res = await fetch("/api/user/archive");

  if (!res.ok) {
    return {
      success: false,
      data: null,
      error: `Fetch failed with status ${res.status}`,
    };
  }

  return res.json();
}
