export const BRAND = {
  name: "Delta",
  short: "DL",
  colors: {
    user: "blue",
    support: "green",
    admin: "red",
  },
} as const;

// ✅ دالة مساعدة لإرجاع اللون حسب الدور
export type RoleKey = keyof typeof BRAND.colors;

export const getRoleColor = (role: RoleKey): string => {
  return BRAND.colors[role] || "blue";
};
