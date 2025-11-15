"use client";

import { motion, Variants } from "framer-motion";
import { FaQuoteRight } from "react-icons/fa";
import { useTranslations } from "next-intl";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function Testimonials() {
  const t = useTranslations("testimonials");

  const testimonials = t.raw("items") as {
    id: number;
    name: string;
    role: string;
    content: string;
    avatar: string;
  }[];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/5 to-transparent -z-10" />

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
          className="grid md:grid-cols-2 gap-8 relative"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={item}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-700 relative"
            >
              <FaQuoteRight className="text-primary/10 text-6xl absolute top-6 right-6" />

              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=4f46e5&color=fff`;
                    }}
                  />
                </div>
                <div className="text-right">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {testimonial.content}
              </p>

              <div className="flex gap-1 mt-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex justify-center mt-12">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((dot) => (
              <button
                key={dot}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  dot === 1 ? "bg-primary w-6" : "bg-gray-300 dark:bg-gray-600"
                }`}
                aria-label={`Go to testimonial ${dot}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
