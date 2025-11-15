import {
  fetchReports,
  fetchReport,
  createReport,
  updateReport,
} from "@/features/support/services/supportReportsService";
import { fetchComments, addComment } from "@/features/support/services/supportCommentsService";
import {
  fetchAttachments,
  createAttachment,
  type FetchAttachmentsParams,
} from "@/features/support/services/supportAttachmentsService";
import { describe, it, expect, beforeEach, afterEach, afterAll, jest } from "@jest/globals";

type MockResponseConfig<T> = {
  ok?: boolean;
  status?: number;
  json: () => Promise<T>;
};

function createMockResponse<T>(config: MockResponseConfig<T>): Response {
  return {
    ok: config.ok ?? true,
    status: config.status ?? (config.ok === false ? 500 : 200),
    json: config.json,
  } as unknown as Response;
}

describe("support services", () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = jest.fn<typeof fetch>() as jest.MockedFunction<typeof fetch>;
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("supportReportsService", () => {
    const reportResponse = {
      id: "rep-1",
      userId: "user-42",
      title: "Login issue",
      description: "Cannot sign in",
      status: "open" as const,
      priority: "high" as const,
      createdAt: "2024-01-01T10:00:00.000Z",
      updatedAt: "2024-01-01T11:00:00.000Z",
    };

    it("fetchReports returns mapped reports", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          json: async () => ({ success: true, data: [reportResponse] }),
        }),
      );

      const reports = await fetchReports();

      expect(global.fetch).toHaveBeenCalledWith("/api/support/reports", { cache: "no-store" });
      expect(reports).toHaveLength(1);
      expect(reports[0]).toMatchObject({
        id: "rep-1",
        title: "Login issue",
        priority: "high",
        status: "open",
      });
      expect(reports[0].createdAt).toBeInstanceOf(Date);
      expect(reports[0].updatedAt).toBeInstanceOf(Date);
    });

    it("fetchReport throws on API error", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          ok: false,
          status: 500,
          json: async () => ({ success: false, error: "Server exploded" }),
        }),
      );

      await expect(fetchReport("rep-404")).rejects.toThrow("Server exploded");
    });

    it("createReport sends payload and returns mapped report", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          json: async () => ({ success: true, data: reportResponse }),
        }),
      );

      const created = await createReport({
        title: "Login issue",
        description: "Cannot sign in",
        priority: "high",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/support/reports",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(created.title).toBe("Login issue");
      expect(created.createdAt).toBeInstanceOf(Date);
    });

    it("updateReport sends PATCH request", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          json: async () => ({ success: true, data: reportResponse }),
        }),
      );

      await updateReport("rep-1", { status: "resolved" });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/support/reports/rep-1",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
  });

  describe("supportCommentsService", () => {
    const commentResponse = {
      id: "com-1",
      reportId: "rep-1",
      userId: "user-42",
      comment: "We are checking this",
      createdAt: "2024-01-02T09:00:00.000Z",
    };

    it("fetchComments returns mapped comments", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          json: async () => ({ success: true, data: [commentResponse] }),
        }),
      );

      const comments = await fetchComments("rep-1");

      expect(global.fetch).toHaveBeenCalledWith("/api/support/comments?reportId=rep-1", {
        cache: "no-store",
      });
      expect(comments).toHaveLength(1);
      expect(comments[0]).toMatchObject({
        id: "com-1",
        comment: "We are checking this",
      });
      expect(comments[0].createdAt).toBeInstanceOf(Date);
    });

    it("addComment posts body and returns mapped comment", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          json: async () => ({ success: true, data: commentResponse }),
        }),
      );

      const comment = await addComment("rep-1", "Thanks for your patience");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/support/comments",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(comment.comment).toBe("We are checking this");
      expect(comment.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("supportAttachmentsService", () => {
    const attachmentResponse = {
      id: "att-1",
      reportId: "rep-1",
      commentId: null,
      fileUrl: "https://example.com/log.txt",
      fileType: "text/plain",
      fileSize: 2048,
      uploadedAt: "2024-01-03T12:00:00.000Z",
      uploadedBy: "user-42",
    };

    it("fetchAttachments maps payload", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          json: async () => ({ success: true, data: [attachmentResponse] }),
        }),
      );

      const params: FetchAttachmentsParams = { reportId: "rep-1" };
      const attachments = await fetchAttachments(params);

      expect(global.fetch).toHaveBeenCalledWith("/api/support/attachments?reportId=rep-1", {
        cache: "no-store",
      });
      expect(attachments).toHaveLength(1);
      expect(attachments[0]).toMatchObject({
        id: "att-1",
        fileUrl: "https://example.com/log.txt",
      });
      expect(attachments[0].uploadedAt).toBeInstanceOf(Date);
    });

    it("createAttachment posts payload and maps result", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          json: async () => ({ success: true, data: attachmentResponse }),
        }),
      );

      const attachment = await createAttachment({
        reportId: "rep-1",
        fileUrl: "https://example.com/log.txt",
        fileType: "text/plain",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/support/attachments",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(attachment.fileUrl).toBe("https://example.com/log.txt");
      expect(attachment.uploadedAt).toBeInstanceOf(Date);
    });
  });
});
