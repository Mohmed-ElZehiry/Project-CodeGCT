// ✅ Utility لتنسيق خطوات الرفع حسب النتيجة outcome
export function getStepStyles(outcome: string) {
  switch (outcome) {
    case "success":
      return {
        icon: "✅",
        bg: "bg-green-100",
        text: "text-green-700",
      };
    case "failed":
      return {
        icon: "❌",
        bg: "bg-red-100",
        text: "text-red-700",
      };
    case "pending":
      return {
        icon: "⏳",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
      };
    default:
      return {
        icon: "ℹ️",
        bg: "bg-gray-100",
        text: "text-gray-700",
      };
  }
}
