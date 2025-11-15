import type { UploadStatus } from "@/features/user/types/user";

type StatusStyles = {
  bg: string;
  text: string;
  icon: string;
};

export const getStatusStyles = (status: UploadStatus): StatusStyles => {
  switch (status) {
    case "ready":
      return {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-400",
        icon: "✅",
      };
    case "processing":
    case "analyzing":
    case "compared":
    case "documented":
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        icon: "⏳",
      };
    case "failed":
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        icon: "❌",
      };
    case "pending":
    default:
      return {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-400",
        icon: "🔄",
      };
  }
};
