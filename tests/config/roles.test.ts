import { rolePermissions, isRouteAllowed } from "@/config/roles";

describe("rolePermissions & isRouteAllowed", () => {
  describe("user role", () => {
    it("allows access to /user/dashboard and subroutes", () => {
      expect(isRouteAllowed("user", "/user/dashboard")).toBe(true);
      expect(isRouteAllowed("user", "/user/dashboard/uploads")).toBe(true);
      expect(isRouteAllowed("user", "/user/dashboard/reports/123")).toBe(true);
    });

    it("does not allow access to /admin or /support sections", () => {
      expect(isRouteAllowed("user", "/admin/dashboard")).toBe(false);
      expect(isRouteAllowed("user", "/support/dashboard")).toBe(false);
    });
  });

  describe("support role", () => {
    it("allows access to /support/dashboard and subroutes", () => {
      expect(isRouteAllowed("support", "/support/dashboard")).toBe(true);
      expect(isRouteAllowed("support", "/support/dashboard/support_reports")).toBe(true);
    });

    it("does not allow access to /admin sections", () => {
      expect(isRouteAllowed("support", "/admin/dashboard")).toBe(false);
      expect(isRouteAllowed("support", "/admin/dashboard/user-management")).toBe(false);
    });
  });

  describe("admin role", () => {
    it("allows access to /admin/dashboard and subroutes", () => {
      expect(isRouteAllowed("admin", "/admin/dashboard")).toBe(true);
      expect(isRouteAllowed("admin", "/admin/dashboard/system_settings")).toBe(true);
      expect(isRouteAllowed("admin", "/admin/dashboard/logs")).toBe(true);
    });

    it("treats nested admin route /admin/dashboard/users as allowed", () => {
      expect(isRouteAllowed("admin", "/admin/dashboard/users")).toBe(true);
    });
  });

  describe("rolePermissions structure", () => {
    it("has expected actions and routes for user", () => {
      const userPerms = rolePermissions.user;
      expect(userPerms.routes).toContain("/user/dashboard");
      expect(userPerms.actions).toContain("upload");
    });

    it("has expected actions and routes for support", () => {
      const supportPerms = rolePermissions.support;
      expect(supportPerms.routes).toContain("/support/dashboard");
      expect(supportPerms.actions).toContain("assist_users");
    });

    it("has expected actions and routes for admin", () => {
      const adminPerms = rolePermissions.admin;
      expect(adminPerms.routes).toContain("/admin/dashboard");
      expect(adminPerms.actions).toContain("manage_users");
    });
  });
});
