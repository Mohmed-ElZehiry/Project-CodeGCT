// src/lib/utils/storage.ts
// ✅ abstraction للـ localStorage مع error handling موحد

export const storage = {
  get: (key: string): unknown | null => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;

        try {
          return JSON.parse(raw);
        } catch (parseError) {
          return raw;
        }
      }
      return null;
    } catch (error) {
      console.error("❌ Storage get error:", error);
      return null;
    }
  },

  set: (key: string, value: unknown): void => {
    try {
      if (typeof window !== "undefined") {
        if (typeof value === "string") {
          localStorage.setItem(key, value);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }
    } catch (error) {
      console.error("❌ Storage set error:", error);
    }
  },

  remove: (key: string): void => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error("❌ Storage remove error:", error);
    }
  },
};
