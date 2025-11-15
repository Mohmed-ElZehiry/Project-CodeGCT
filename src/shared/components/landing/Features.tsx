"use client";

import { motion, Variants } from "framer-motion";
import { FiShield, FiBarChart2, FiZap, FiGlobe, FiGithub, FiCode } from "react-icons/fi";
import { useTranslations } from "next-intl";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function Features() {
  const t = useTranslations("features");

  const features = [
    {
      icon: <FiShield className="w-8 h-8" />,
      title: t("security.title"),
      description: t("security.description"),
      color: "text-blue-500",
    },
    {
      icon: <FiBarChart2 className="w-8 h-8" />,
      title: t("reports.title"),
      description: t("reports.description"),
      color: "text-purple-500",
    },
    {
      icon: <FiZap className="w-8 h-8" />,
      title: t("performance.title"),
      description: t("performance.description"),
      color: "text-yellow-500",
    },
    {
      icon: <FiGlobe className="w-8 h-8" />,
      title: t("multilang.title"),
      description: t("multilang.description"),
      color: "text-green-500",
    },
    {
      icon: <FiGithub className="w-8 h-8" />,
      title: t("github.title"),
      description: t("github.description"),
      color: "text-gray-700",
    },
    {
      icon: <FiCode className="w-8 h-8" />,
      title: t("scalability.title"),
      description: t("scalability.description"),
      color: "text-pink-500",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-full mb-4">
            {t("badge")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t("headline")}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">{t("description")}</p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              className="group relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div
                  className={`w-12 h-12 rounded-lg ${feature.color} bg-opacity-10 flex items-center justify-center mb-4`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
