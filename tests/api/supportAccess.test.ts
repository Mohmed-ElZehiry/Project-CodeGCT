import {
  ensureReportAccess,
  type SupportRole,
  type SupportReportRow,
} from "@/app/api/support/_shared";

function makeReport(overrides: Partial<SupportReportRow> = {}): SupportReportRow {
  return {
    id: "report-1",
    user_id: "user-1",
    title: "Test report",
    description: "desc",
    status: "open" as any,
    priority: "normal" as any,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as SupportReportRow;
}

describe("ensureReportAccess", () => {
  const userId = "user-1";
  const otherUserId = "user-2";

  it("returns false when report is null", () => {
    const role: SupportRole = "user";
    expect(ensureReportAccess(null, role, userId)).toBe(false);
  });

  it("returns false when role is null", () => {
    const report = makeReport();
    expect(ensureReportAccess(report, null, userId)).toBe(false);
  });

  describe("role = user", () => {
    const role: SupportRole = "user";

    it("returns true when report.user_id === userId", () => {
      const report = makeReport({ user_id: userId });
      expect(ensureReportAccess(report, role, userId)).toBe(true);
    });

    it("returns false when report.user_id !== userId", () => {
      const report = makeReport({ user_id: otherUserId });
      expect(ensureReportAccess(report, role, userId)).toBe(false);
    });
  });

  describe("role = support", () => {
    const role: SupportRole = "support";

    it("always returns true for any report when role is support", () => {
      const ownReport = makeReport({ user_id: userId });
      const otherReport = makeReport({ user_id: otherUserId });

      expect(ensureReportAccess(ownReport, role, userId)).toBe(true);
      expect(ensureReportAccess(otherReport, role, userId)).toBe(true);
    });
  });

  describe("role = admin", () => {
    const role: SupportRole = "admin";

    it("always returns true for any report when role is admin", () => {
      const ownReport = makeReport({ user_id: userId });
      const otherReport = makeReport({ user_id: otherUserId });

      expect(ensureReportAccess(ownReport, role, userId)).toBe(true);
      expect(ensureReportAccess(otherReport, role, userId)).toBe(true);
    });
  });
});
