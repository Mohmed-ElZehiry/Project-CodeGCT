"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useTranslations } from "next-intl";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Hero() {
  const t = useTranslations("hero");

  return (
    <section
      className={`
        relative overflow-hidden py-24 md:py-32 px-4
        bg-gradient-to-b
        from-white via-gray-50 to-gray-100
        dark:from-gray-950 dark:via-gray-900 dark:to-gray-800
      `}
    >
      {/* Decorative gradient circles */}
      <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
      <div className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full bg-secondary/10 blur-3xl dark:bg-secondary/20" />

      <div className="container mx-auto relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Badge */}
          <motion.div variants={item} className="mb-6">
            <span
              className={`
                inline-block px-5 py-2 text-sm font-medium rounded-full mb-4
                bg-primary/10 text-primary
                dark:bg-white/10 dark:text-white
              `}
            >
              🚀 {t("badge")}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight
                       text-gray-900 dark:text-white tracking-tight"
          >
            {t("headline")}
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={item}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto"
          >
            {t("description")}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              {t("startFree")}
            </Link>

            <Link
              href="#features"
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold
                         rounded-lg border-2 transition-all duration-200
                         border-gray-300 text-gray-700 hover:bg-gray-100
                         dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              {t("exploreFeatures")}
            </Link>
          </motion.div>

          {/* Users Trust */}
          <motion.div
            variants={item}
            className="mt-12 flex items-center justify-center gap-3 text-sm
                       text-gray-600 dark:text-gray-400"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium
                             bg-gray-200 text-gray-700
                             dark:bg-white/20 dark:text-white"
                >
                  {i}+K
                </div>
              ))}
            </div>
            <span>{t("usersTrust")}</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
