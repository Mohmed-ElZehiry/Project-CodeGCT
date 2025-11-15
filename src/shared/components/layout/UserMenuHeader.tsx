import type { RoleAccent } from "./Dashboard/constants";

type UserMenuHeaderProps = {
  displayName?: string;
  email?: string;
  roleLabel?: string;
  className?: string;
  accent?: RoleAccent;
};

export default function UserMenuHeader({
  displayName = "Guest",
  email = "—",
  roleLabel = "USER",
  className = "",
  accent,
}: UserMenuHeaderProps) {
  // ✅ تحديد لون الـ role badge حسب الدور
  const badgeClasses = accent
    ? `${accent.badgeBg ?? "bg-primary"} ${accent.badgeText ?? "text-primary-foreground"}`
    : roleLabel?.toUpperCase() === "ADMIN"
      ? "bg-red-600 text-white"
      : roleLabel?.toUpperCase() === "SUPPORT"
        ? "bg-blue-600 text-white"
        : "bg-primary text-primary-foreground";

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        <p
          className="text-sm font-medium text-gray-900 dark:text-white truncate"
          title={displayName}
        >
          {displayName}
        </p>
        <span className={`px-2 py-0.5 text-xs rounded ${badgeClasses}`}>{roleLabel}</span>
      </div>
      <p
        className="text-xs text-gray-500 truncate"
        title={email} // ✅ يظهر كامل البريد عند الـ hover
      >
        {email}
      </p>
    </div>
  );
}
