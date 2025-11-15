import type { SupportComment } from "../types/support";

const BASE_URL = "/api/support/comments";

interface CommentResponse {
  id: string;
  reportId: string;
  userId: string | null;
  comment: string;
  createdAt: string;
}

interface ApiPayload<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function mapComment(comment: CommentResponse): SupportComment {
  return {
    id: comment.id,
    reportId: comment.reportId,
    userId: comment.userId,
    comment: comment.comment,
    createdAt: new Date(comment.createdAt),
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

export async function fetchComments(reportId: string): Promise<SupportComment[]> {
  const res = await fetch(`${BASE_URL}?reportId=${encodeURIComponent(reportId)}`, {
    cache: "no-store",
  });
  const data = await parseResponse<CommentResponse[]>(res);
  return (data ?? []).map(mapComment);
}

export async function addComment(reportId: string, comment: string): Promise<SupportComment> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportId, comment }),
  });
  const data = await parseResponse<CommentResponse>(res);
  return mapComment(data);
}
