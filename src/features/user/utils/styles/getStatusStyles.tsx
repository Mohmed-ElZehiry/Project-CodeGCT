// src/features/user/utils/styles/getStatusStyles.ts
import { Clock as ClockIcon, Loader, CheckCircle, XCircle } from "lucide-react";

export function getStatusStyles(status: string) {
  switch (status) {
    case "pending":
      return {
        icon: <ClockIcon className="w-4 h-4 text-gray-500" />,
        bg: "bg-gray-100",
        text: "text-gray-700",
      };
    case "running":
      return {
        icon: <Loader className="w-4 h-4 text-blue-500 animate-spin" />,
        bg: "bg-blue-100",
        text: "text-blue-700",
      };
    case "analyzed":
    case "done":
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        bg: "bg-green-100",
        text: "text-green-700",
      };
    case "error":
      return {
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        bg: "bg-red-100",
        text: "text-red-700",
      };
    default:
      return {
        icon: <ClockIcon className="w-4 h-4 text-muted-foreground" />,
        bg: "bg-muted",
        text: "text-muted-foreground",
      };
  }
}
