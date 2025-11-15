import { describe, it, expect, beforeEach, afterEach, afterAll, jest } from "@jest/globals";
import { fetchAdminUsers, updateAdminUser } from "@/features/admin/services/adminUsersService";
import {
  fetchAdminSystemSettings,
  updateAdminSystemSetting,
} from "@/features/admin/services/adminSettingsService";
import {
  fetchAdminRoles,
  updateAdminRolePermissions,
} from "@/features/admin/services/adminRolesService";
import { fetchAuditLogs } from "@/features/admin/services/adminAuditService";

function createJsonResponse(body: unknown, init?: ResponseInit): Response {
  const status = init?.status ?? 200;

  return {
    ok: status >= 200 && status < 400,
    status,
    json: async () => body,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } as any,
  } as unknown as Response;
}

describe("admin services", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("adminUsersService", () => {
    const userResponse = {
      id: "user-1",
      email: "admin@example.com",
      full_name: "Admin User",
      role: "admin" as const,
      status: "active" as const,
      created_at: "2024-02-01T10:00:00.000Z",
      last_sign_in_at: "2024-02-01T12:00:00.000Z",
    };

    it("fetchAdminUsers maps response payload", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue(createJsonResponse({ success: true, data: [userResponse] }));

      const users = await fetchAdminUsers();

      expect(global.fetch).toHaveBeenCalledWith("/api/admin/users", { cache: "no-store" });
      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({
        id: "user-1",
        email: "admin@example.com",
        role: "admin",
        status: "active",
      });
      expect(users[0].createdAt).toBeInstanceOf(Date);
      expect(users[0].lastSignInAt).toBeInstanceOf(Date);
    });

    it("fetchAdminUsers throws on API error", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue(
        createJsonResponse({ success: false, error: "Server error" }, { status: 500 }),
      );

      await expect(fetchAdminUsers()).rejects.toThrow("Server error");
    });

    it("updateAdminUser sends PATCH payload and returns mapped user", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue(createJsonResponse({ success: true, data: userResponse }));

      const updated = await updateAdminUser("user-1", { role: "support" });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/users/user-1",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(updated.role).toBe("admin");
      expect(updated.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("adminSettingsService", () => {
    const settingResponse = {
      key: "maintenance_mode",
      value: false,
      category: "system",
      editable: true,
      updatedAt: "2024-02-02T09:00:00.000Z",
    };

    it("fetchAdminSystemSettings returns mapped settings", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue(createJsonResponse({ success: true, data: [settingResponse] }));

      const settings = await fetchAdminSystemSettings();

      expect(global.fetch).toHaveBeenCalledWith("/api/admin/system_settings", {
        cache: "no-store",
      });
      expect(settings).toHaveLength(1);
      expect(settings[0]).toMatchObject({ key: "maintenance_mode", editable: true });
      expect(settings[0].updatedAt).toBeInstanceOf(Date);
    });

    it("updateAdminSystemSetting sends PATCH request and returns mapped setting", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue(createJsonResponse({ success: true, data: settingResponse }));

      const setting = await updateAdminSystemSetting("maintenance_mode", true);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/system_settings/maintenance_mode",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(setting.key).toBe("maintenance_mode");
      expect(setting.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("adminRolesService", () => {
    const rolesResponse = [
      {
        role: "admin" as const,
        description: "Full access",
        permissions: ["manage_users", "configure_system"],
      },
    ];

    it("fetchAdminRoles returns raw payload", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue(createJsonResponse({ success: true, data: rolesResponse }));

      const roles = await fetchAdminRoles();

      expect(global.fetch).toHaveBeenCalledWith("/api/admin/roles", { cache: "no-store" });
      expect(roles).toEqual(rolesResponse);
    });

    it("updateAdminRolePermissions sends PATCH request", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue(createJsonResponse({ success: true, data: rolesResponse[0] }));

      const role = await updateAdminRolePermissions("admin", ["manage_users"], "desc");

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/roles/admin",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(role.permissions).toContain("manage_users");
    });
  });

  describe("adminAuditService", () => {
    const auditResponse = [
      {
        id: "log-1",
        userId: "user-1",
        action: "login",
        metadata: { ip: "1.1.1.1" },
        createdAt: "2024-02-03T08:00:00.000Z",
        ipAddress: "1.1.1.1",
        userAgent: "Mozilla/5.0",
      },
    ];

    it("fetchAuditLogs hits API without filters", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue(createJsonResponse({ success: true, data: auditResponse }));

      const logs = await fetchAuditLogs();

      expect(global.fetch).toHaveBeenCalledWith("/api/admin/audit-logs", { cache: "no-store" });
      expect(logs).toHaveLength(1);
      expect(logs[0].createdAt).toBeInstanceOf(Date);
    });

    it("fetchAuditLogs applies filters to query string", async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValue(createJsonResponse({ success: true, data: auditResponse }));

      await fetchAuditLogs({ userId: "user-1", limit: 10 });

      expect(global.fetch).toHaveBeenCalledWith("/api/admin/audit-logs?userId=user-1&limit=10", {
        cache: "no-store",
      });
    });
  });
});
