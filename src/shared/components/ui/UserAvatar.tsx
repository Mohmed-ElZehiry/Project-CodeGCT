"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;
  fallback?: string;
  className?: string;
}

export default function UserAvatar({
  src,
  alt = "User",
  size = 40,
  fallback = "U",
  className,
}: UserAvatarProps) {
  if (src) {
    return (
      <Image
        key={src} // 👈 يجبر React يعيد بناء الصورة عند تغيير src
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={cn(
          "rounded-full border border-slate-300 dark:border-slate-700 object-cover",
          className,
        )}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "rounded-full bg-gray-300 dark:bg-slate-700 flex items-center justify-center text-sm font-medium text-white",
        className,
      )}
    >
      {fallback}
    </div>
  );
}
