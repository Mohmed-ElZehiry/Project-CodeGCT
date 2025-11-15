"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export default function ThemeSwitcher() {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // ✅ نتأكد إن الكومبوننت اتعمله mount عشان نتجنب hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        aria-label="Loading theme switcher"
        className="rounded-full border border-gray-200 dark:border-gray-700 
                   bg-white dark:bg-gray-900"
      >
        <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
      </Button>
    );
  }

  // ✅ التبديل بين Light و Dark فقط
  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Current theme: ${theme}. Click to change`}
        onClick={toggleTheme}
        className="rounded-full border border-gray-200 dark:border-gray-700 
                   bg-white dark:bg-gray-900 shadow-sm hover:shadow-md 
                   transition-all duration-300 ease-in-out"
      >
        <span className="relative flex items-center justify-center">
          <Sun
            className={`h-5 w-5 text-yellow-500 transition-all duration-500 ${
              resolvedTheme === "light"
                ? "rotate-0 scale-100 opacity-100"
                : "rotate-90 scale-0 opacity-0"
            }`}
          />
          <Moon
            className={`absolute h-5 w-5 text-blue-400 transition-all duration-500 ${
              resolvedTheme === "dark"
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-0 opacity-0"
            }`}
          />
        </span>
      </Button>
    </div>
  );
}
