"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function CallToAction() {
  const t = useTranslations("cta");
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const supabase = createClientComponentClient();

  // Supabase client exposes the current user via getUser on demand;
  // for CTA, we can decide link based on presence of access token cookie.
  // Simpler on client: try reading session state once on click.
  const startHref = `/${locale}/user`; // default target if authenticated
  const signInHref = `/${locale}/sign-in`;

  return (
    <section
      className="
        relative py-24 md:py-28 overflow-hidden
        bg-gradient-to-b
        from-white via-gray-50 to-gray-100
        dark:from-gray-950 dark:via-gray-900 dark:to-gray-800
      "
    >
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
            {t("title")}
          </h2>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={startHref}
              // On click, verify auth; if not logged in, browser will be redirected by server guard,
              // or we can proactively route to sign-in by checking user.
              onClick={async (e) => {
                const { data } = await supabase.auth.getUser();
                if (!data.user) {
                  e.preventDefault();
                  window.location.href = signInHref;
                }
              }}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold
                         rounded-lg shadow-lg hover:shadow-xl transition-all duration-200
                         bg-primary text-white hover:bg-primary-hover dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {t("startFree")}
              <svg
                className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7-7 7M21 12H3"
                />
              </svg>
            </Link>

            <Link
              href={`/${locale}/#features`}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold
                         rounded-lg border-2 transition-colors duration-200
                         border-gray-300 text-gray-700 hover:bg-gray-100
                         dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              {t("learnMore")}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
