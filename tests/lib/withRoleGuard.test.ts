import { withRoleGuard } from "@/lib/auth/withRoleGuard";
import type { Database } from "@/lib/supabase/database.types";

// Types from DB
type Role = Database["public"]["Enums"]["user_role"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Mocks
const redirectMock = jest.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

const headersGetMock = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

jest.mock("next/headers", () => ({
  headers: async () => ({
    get: headersGetMock,
  }),
}));

const getOrCreateProfileMock = jest.fn<Promise<Profile | null>, []>();
jest.mock("@/lib/supabase/server", () => ({
  getOrCreateProfile: () => getOrCreateProfileMock(),
}));

const logWarnMock = jest.fn();
const logInfoMock = jest.fn();

jest.mock("@/lib/utils/logger", () => ({
  __esModule: true,
  default: {
    logWarn: (...args: unknown[]) => logWarnMock(...args),
    logInfo: (...args: unknown[]) => logInfoMock(...args),
  },
}));

describe("withRoleGuard", () => {
  const locale = "en";

  beforeEach(() => {
    redirectMock.mockClear();
    headersGetMock.mockReset();
    getOrCreateProfileMock.mockReset();
    logWarnMock.mockClear();
    logInfoMock.mockClear();
  });

  it("redirects to sign-in when no profile is found", async () => {
    getOrCreateProfileMock.mockResolvedValueOnce(null);
    headersGetMock.mockImplementation((key: string) => {
      if (key === "x-invoke-path") return "/en/admin/dashboard";
      return null;
    });

    await expect(withRoleGuard("admin" as Role, locale)).rejects.toThrow(
      "REDIRECT:/en/sign-in?redirectTo=%2Fen%2Fadmin%2Fdashboard",
    );

    expect(logWarnMock).toHaveBeenCalled();
  });

  it("redirects to /unauthorized when role is not allowed", async () => {
    const profile: Profile = {
      id: "user-1",
      role: "user" as Role,
      // بقية الحقول غير مهمة لهذا الاختبار
    } as Profile;

    getOrCreateProfileMock.mockResolvedValueOnce(profile);
    headersGetMock.mockImplementation((key: string) => {
      if (key === "x-invoke-path") return "/en/admin/dashboard";
      return null;
    });

    await expect(withRoleGuard("admin" as Role, locale)).rejects.toThrow(
      "REDIRECT:/en/unauthorized",
    );

    expect(logWarnMock).toHaveBeenCalled();
  });

  it("returns profile when role is allowed (single role)", async () => {
    const profile: Profile = {
      id: "admin-1",
      role: "admin" as Role,
    } as Profile;

    getOrCreateProfileMock.mockResolvedValueOnce(profile);
    headersGetMock.mockImplementation((key: string) => {
      if (key === "x-invoke-path") return "/en/admin/dashboard";
      return null;
    });

    const result = await withRoleGuard("admin" as Role, locale);

    expect(result).toBe(profile);
    expect(redirectMock).not.toHaveBeenCalled();
    expect(logInfoMock).toHaveBeenCalled();
  });

  it("returns profile when role is in allowedRoles array", async () => {
    const profile: Profile = {
      id: "support-1",
      role: "support" as Role,
    } as Profile;

    getOrCreateProfileMock.mockResolvedValueOnce(profile);
    headersGetMock.mockImplementation((key: string) => {
      if (key === "x-invoke-path") return "/en/support/dashboard";
      return null;
    });

    const result = await withRoleGuard(["admin", "support"] as Role[], locale);

    expect(result).toBe(profile);
    expect(redirectMock).not.toHaveBeenCalled();
    expect(logInfoMock).toHaveBeenCalled();
  });
});
