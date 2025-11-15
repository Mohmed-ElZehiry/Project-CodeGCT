import type { SupportAttachment } from "../types/support";

const BASE_URL = "/api/support/attachments";

interface AttachmentResponse {
  id: string;
  reportId?: string | null;
  commentId?: string | null;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  uploadedAt: string;
  uploadedBy?: string | null;
}

interface ApiPayload<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function mapAttachment(attachment: AttachmentResponse): SupportAttachment {
  return {
    id: attachment.id,
    reportId: attachment.reportId ?? undefined,
    commentId: attachment.commentId ?? undefined,
    fileUrl: attachment.fileUrl,
    fileType: attachment.fileType ?? undefined,
    fileSize: attachment.fileSize ?? undefined,
    uploadedAt: new Date(attachment.uploadedAt),
    uploadedBy: attachment.uploadedBy ?? undefined,
  };
}

async function parseResponse<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => null)) as ApiPayload<T> | null;

  if (!res.ok || !payload?.success) {
    const errorMessage = payload?.error || `Request failed with status ${res.status}`;
    throw new Error(errorMessage);
  }

  return payload.data as T;
}

export interface FetchAttachmentsParams {
  reportId?: string;
  commentId?: string;
}

function toQuery(params?: FetchAttachmentsParams) {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  if (params.reportId) searchParams.set("reportId", params.reportId);
  if (params.commentId) searchParams.set("commentId", params.commentId);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function fetchAttachments(
  params: FetchAttachmentsParams,
): Promise<SupportAttachment[]> {
  const res = await fetch(`${BASE_URL}${toQuery(params)}`, { cache: "no-store" });
  const data = await parseResponse<AttachmentResponse[]>(res);
  return (data ?? []).map(mapAttachment);
}

export interface CreateAttachmentPayload {
  reportId?: string;
  commentId?: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}

export async function createAttachment(
  payload: CreateAttachmentPayload,
): Promise<SupportAttachment> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<AttachmentResponse>(res);
  return mapAttachment(data);
}
