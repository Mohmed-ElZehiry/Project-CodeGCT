// src/features/user/utils/styles/getStepStyles.ts
import { createElement } from "react";
import { Clock, Loader, CheckCircle, XCircle } from "lucide-react";

type StepOutcome = "pending" | "running" | "done" | "error" | (string & {});

interface StepStyles {
  icon: React.ReactNode;
  bg: string;
  text: string;
}

export function getStepStyles(outcome: StepOutcome): StepStyles {
  switch (outcome) {
    case "pending":
      return {
        icon: createElement(Clock, { className: "w-4 h-4 text-gray-500" }),
        bg: "bg-gray-100",
        text: "text-gray-700",
      };
    case "running":
      return {
        icon: createElement(Loader, {
          className: "w-4 h-4 text-blue-500 animate-spin",
        }),
        bg: "bg-blue-100",
        text: "text-blue-700",
      };
    case "done":
      return {
        icon: createElement(CheckCircle, {
          className: "w-4 h-4 text-green-600",
        }),
        bg: "bg-green-100",
        text: "text-green-700",
      };
    case "error":
      return {
        icon: createElement(XCircle, { className: "w-4 h-4 text-red-600" }),
        bg: "bg-red-100",
        text: "text-red-700",
      };
    default:
      return {
        icon: createElement(Clock, {
          className: "w-4 h-4 text-muted-foreground",
        }),
        bg: "bg-muted",
        text: "text-muted-foreground",
      };
  }
}
