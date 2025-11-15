// ==================================================
// 📂 User Types (Backups, Reports, Activity, Profile, Settings, Uploads, Comparisons)
// ==================================================

// ===============================
// 📂 Backups Types
// ===============================

export type BackupFile = {
  path: string;
  size: number;
  encoding?: string;
  lastModified?: string;
};

export type FolderNode = {
  name: string;
  files: number;
  sizeMB: number;
  lastModified: string;
  children?: FolderNode[];
};

export type BackupSummary = {
  totalFiles: number;
  totalSizeMB: number;
  executionTimeSec: number;
  fileTypes: Record<string, number>;
  project: {
    totalFolders: number;
    totalFiles: number;
    totalSizeMB: number;
  };
};

export type BackupPayload = {
  filename: string;
  summary: BackupSummary;
  structure: FolderNode[];
  files: BackupFile[];
};

// ===============================
// 📂 Shared Project Types
// ===============================

export type ProjectSummary = {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
  createdAt?: string | null;
};

export type BackupMeta = {
  filename: string;
  createdAt: string;
  size: number;
};

export type CreateBackupResult = {
  filename: string;
  reportUrl: string;
  downloadUrl: string;
  githubUrl?: string;
};

export type AnalyzeRequest = {
  files: BackupFile[];
};

// ===============================
// 📂 Reports Types
// ===============================

export type ReportStatus = "pending" | "processing" | "completed" | "failed";
export type ReportFormat = "json" | "pdf" | "md";

export interface ReportOverview {
  language: string | null;
  frameworks: string[];
  libraries: string[];
}

export interface ReportStructure {
  // Use a normalized tree representation that can be rendered or filtered
  tree: string[]; // e.g., ["src/index.ts", "src/components/Button.tsx"]
  description?: string;
}

export interface ReportDependencyItem {
  name: string;
  version: string;
  type: "prod" | "dev" | "unused";
}
export interface ReportDependencies {
  list: ReportDependencyItem[];
}

export interface ReportSections {
  databaseSchema?: unknown;
  apis?: unknown;
  features?: unknown;
  sharedComponents?: unknown;
  securityAndAuth?: unknown;
  internationalization?: unknown;
  deploymentNotes?: unknown;
}

export interface ReportInsights {
  warnings: string[];
  recommendations: string[];
}

export interface AnalysisReport {
  id: string;
  name: string;
  userId: string;
  uploadId?: string;
  projectId?: string;
  backupId?: string;
  status: ReportStatus;
  format: ReportFormat;
  createdAt: string;
  updatedAt?: string;
  overview?: ReportOverview;
  structure?: ReportStructure;
  dependencies?: ReportDependencies;
  sections?: ReportSections;
  insights?: ReportInsights;
  content: unknown; // Full source JSON of the report
}

// Derived type for project-level lists (alias)
export type ProjectAnalysis = AnalysisReport;

// ===============================
// 📂 User Activity Types
// ===============================

export type AuditAction = "REPORT_CREATED" | "REPORT_VIEWED" | "REPORT_EXPORTED" | "REPORT_DELETED";

export type UserActivityDB = {
  id: string;
  user_id: string;
  action: AuditAction;
  metadata: any;
  created_at: string;
};

export type UserActivity = {
  id: string;
  userId: string;
  action: AuditAction;
  metadata: any;
  createdAt: Date;
};

// ===============================
// 📂 Profile & Settings Types
// ===============================

export type UserProfileDB = {
  id: string;
  full_name?: string | null;
  display_name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "user" | "admin" | "support";
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
};

export type UserProfile = {
  id: string;
  fullName?: string | null;
  displayName?: string | null;
  email?: string | null;
  image?: string | null;
  role: "user" | "admin" | "support";
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: Date | null;
};

export type UserSettingsDB = {
  id: string;
  user_id: string;
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type UserSettings = {
  id: string;
  userId: string;
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

// ===============================
// 📂 Uploads Types
// ===============================

// 🟢 حالات الملف
export type UploadStatus =
  | "pending"
  | "processing"
  | "ready"
  | "analyzing"
  | "compared"
  | "documented"
  | "failed";

// 🟢 مصدر الملف (متوافق مع الـ DB check constraint)
export type UploadSourceType = "archive" | "direct" | "api";

// 🟢 شكل البيانات كما هي في الـ DB
export type UploadDB = {
  id: string;
  user_id: string;
  project_id?: string | null;
  original_filename: string;
  file_size?: number | null;
  github_url?: string | null;
  checksum?: string | null;
  version: number;
  status: UploadStatus;
  source_type?: UploadSourceType;
  uploaded_at: string;
  processed_at?: string | null;
  analyzed_at?: string | null;
  compared_at?: string | null;
  documented_at?: string | null;
  error_message?: string | null;
  error_code?: string | null;
  metadata?: any | null;
};

// 🟢 شكل البيانات في الـ Frontend (camelCase)
export type Upload = {
  id: string;
  userId: string;
  projectId?: string | null;
  originalFilename: string;
  fileSize?: number | null;
  githubUrl?: string | null;
  checksum?: string | null;
  version: number;
  status: UploadStatus;
  sourceType?: UploadSourceType;
  uploadedAt: string;
  processedAt?: string | null;
  analyzedAt?: string | null;
  comparedAt?: string | null;
  documentedAt?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  metadata?: any | null;
};

// ===============================
// 📂 Upload Steps Types
// ===============================

// 🟢 أنواع الخطوات
export type UploadStepType =
  | "received"
  | "extracted"
  | "validated"
  | "analysis"
  | "analyzed"
  | "compared"
  | "documented";

// 🟢 شكل البيانات كما هي في الـ DB
export type UploadStepDB = {
  id: string;
  upload_id: string;
  step: UploadStepType;
  outcome: string;
  created_at: string;
  details?: any | null;
  actor?: string | null;
  link?: string | null;
  status_code?: number | null;
  duration_ms?: number | null;
  category?: string | null;
};

// 🟢 شكل البيانات في الـ Frontend (camelCase)
export type UploadStep = {
  id: string;
  uploadId: string;
  step: UploadStepType;
  outcome: string;
  createdAt: string;
  details?: any | null;
  actor?: string | null;
  link?: string | null;
  statusCode?: number | null;
  durationMs?: number | null;
  category?: string | null;
};

// ===============================
// 📂 Comparisons Types
// ===============================

export type ComparisonStatus = "pending" | "processing" | "completed" | "failed";

export type ComparisonDB = {
  id: string;
  user_id: string;
  upload1_id: string;
  upload2_id: string;
  backup1_id?: string | null;
  backup2_id?: string | null;
  package1_id?: string | null;
  package2_id?: string | null;
  project_id?: string | null;
  result?: any | null;
  status: ComparisonStatus;
  direction?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at?: string | null;
  metadata?: any | null;
};

export type ComparisonDoc = {
  id: string;
  userId?: string;
  upload1Id: string;
  upload2Id: string;
  backup1Id?: string | null;
  backup2Id?: string | null;
  package1Id?: string | null;
  package2Id?: string | null;
  projectId?: string | null;
  result?: any | null;
  status?: ComparisonStatus;
  direction?: string | null;
  errorMessage?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  metadata?: any | null;
};
