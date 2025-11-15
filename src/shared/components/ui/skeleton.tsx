import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const skeletonVariants = cva("animate-pulse rounded-md bg-muted", {
  variants: {
    variant: {
      default: "h-4 w-full",
      circle: "rounded-full",
      rectangle: "h-24 w-full",
      text: "h-4 w-full",
      title: "h-6 w-3/4",
      paragraph: "h-4 w-full",
      button: "h-9 w-24",
      badge: "h-6 w-12",
      input: "h-10 w-full",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return <div className={cn(skeletonVariants({ variant }), className)} {...props} />;
}

export { Skeleton, skeletonVariants };
