import { useEffect } from "react";
import { render } from "@testing-library/react";
import { useAuthorize } from "@/shared/hooks/useAuthorize";

// Mock next/navigation hooks
const replaceMock = jest.fn();
let pathnameMock = "/";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => pathnameMock,
}));

// Mock useSupabase
jest.mock("@/lib/supabase/provider", () => ({
  useSupabase: () => ({
    role: mockRole,
    loading: mockLoading,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

// Mock isRouteAllowed to simply check based on pathname prefix for this test
jest.mock("@/config/roles", () => {
  const original = jest.requireActual("@/config/roles");
  return {
    ...original,
    isRouteAllowed: (role: string, pathname: string) => {
      if (role === "admin") return pathname.startsWith("/admin");
      if (role === "support") return pathname.startsWith("/support");
      if (role === "user") return pathname.startsWith("/user");
      return false;
    },
  };
});

let mockRole: "user" | "support" | "admin" = "user";
let mockLoading = false;
let mockIsAuthenticated = true;

function TestComponent(props: { allow: string[]; redirect?: string }) {
  useAuthorize({ allow: props.allow, redirect: props.redirect });
  // لا تحتاج إلى رندر فعلي؛ مجرد استدعاء الهوك داخل كومبوننت
  return null;
}

describe("useAuthorize", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    mockLoading = false;
    mockIsAuthenticated = true;
    mockRole = "user";
    pathnameMock = "/";
  });

  it("redirects user to /user/dashboard when accessing admin route without permission", () => {
    mockRole = "user";
    pathnameMock = "/admin/dashboard";

    render(<TestComponent allow={["admin"]} />);

    expect(replaceMock).toHaveBeenCalledWith("/user/dashboard");
  });

  it("redirects support user away from admin route", () => {
    mockRole = "support";
    pathnameMock = "/admin/dashboard/settings";

    render(<TestComponent allow={["admin"]} />);

    expect(replaceMock).toHaveBeenCalledWith("/user/dashboard");
  });

  it("does not redirect admin on allowed admin route", () => {
    mockRole = "admin";
    pathnameMock = "/admin/dashboard/users";

    render(<TestComponent allow={["admin"]} />);

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("does nothing while loading", () => {
    mockLoading = true;
    mockRole = "admin";
    pathnameMock = "/admin/dashboard";

    render(<TestComponent allow={["admin"]} />);

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated user to default redirect", () => {
    mockIsAuthenticated = false;
    pathnameMock = "/admin/dashboard";

    render(<TestComponent allow={["admin"]} redirect="/custom" />);

    expect(replaceMock).toHaveBeenCalledWith("/custom");
  });
});
