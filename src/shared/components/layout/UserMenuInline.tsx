import { navigation } from "@/config/navigation";
import type { Role } from "@/config/navigation";
import { Shield } from "lucide-react"; // ✅ fallback icon
import { ACCENT } from "./Dashboard/constants";

type UserMenuInlineProps = {
  userData: {
    displayName?: string;
    email?: string;
    roleLabel?: string;
  };
  role: Role;
  locale: string;
};

export default function UserMenuInline({ userData, role, locale }: UserMenuInlineProps) {
  // ✅ اجلب أول أيقونة من روابط الدور أو استخدم أيقونة افتراضية
  const roleIcon = navigation[role]?.[0]?.icon || Shield;

  // ✅ خزّن الأيقونة في متغير يبدأ بحرف كبير علشان React يتعرف عليها كمكون
  const RoleIcon = roleIcon;
  const roleAccent = ACCENT[role] ?? ACCENT.user;

  return (
    <div className="flex flex-col text-sm text-gray-700 dark:text-gray-300">
      <div className="flex items-center gap-2">
        <span
          className="font-medium truncate"
          title={userData.displayName || (locale === "ar" ? "مستخدم" : "User")}
        >
          {userData.displayName || (locale === "ar" ? "مستخدم" : "User")}
        </span>
        <span
          className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded ${roleAccent?.badgeBg ?? "bg-primary"} ${roleAccent?.badgeText ?? "text-primary-foreground"}`}
        >
          <RoleIcon className="h-3 w-3" /> {/* ✅ استخدام PascalCase */}
          {userData.roleLabel || (locale === "ar" ? "مستخدم" : "USER")}
        </span>
      </div>
      <span
        className="text-xs text-gray-500 dark:text-gray-400 truncate"
        title={userData.email || (locale === "ar" ? "غير مسجل" : "Not signed in")}
      >
        {userData.email || (locale === "ar" ? "غير مسجل" : "Not signed in")}
      </span>
    </div>
  );
}
