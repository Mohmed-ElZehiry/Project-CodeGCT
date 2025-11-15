"use client";

import { useTranslations } from "next-intl";

export default function AdminUserDetailsPage(props: any) {
  const t = useTranslations("adminUsers");
  const id = props?.params?.id as string;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        {t("detailsTitle", { defaultValue: "User details" })} #{id}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t("detailsDescription", {
          defaultValue: "Admin user management detail page placeholder.",
        })}
      </p>
    </div>
  );
}
