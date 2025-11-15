// ==============================
// Support Reports
// ==============================
export interface SupportReport {
  id: string;
  userId: string | null;
  title: string;
  description?: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: Date;
  updatedAt: Date;
}

/** DB shape (snake_case) */
export interface SupportReportDB {
  id: string;
  user_id: string | null;
  title: string;
  description?: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  created_at: string;
  updated_at: string;
}

// ==============================
// Support Comments
// ==============================
export interface SupportComment {
  id: string;
  reportId: string;
  userId: string | null;
  comment: string;
  createdAt: Date;
}

/** DB shape (snake_case) */
export interface SupportCommentDB {
  id: string;
  report_id: string;
  user_id: string | null;
  comment: string;
  created_at: string;
}

// ==============================
// Support Attachments
// ==============================
export interface SupportAttachment {
  id: string;
  reportId?: string | null;
  commentId?: string | null;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  uploadedAt: Date;
  uploadedBy?: string | null;
}

/** DB shape (snake_case) */
export interface SupportAttachmentDB {
  id: string;
  report_id?: string | null;
  comment_id?: string | null;
  file_url: string;
  file_type?: string | null;
  file_size?: number | null;
  uploaded_at: string;
  uploaded_by?: string | null;
}
