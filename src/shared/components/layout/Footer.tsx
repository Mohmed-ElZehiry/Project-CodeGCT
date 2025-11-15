"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Facebook, Twitter, Github } from "lucide-react";

export default function Footer() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isRTL = locale === "ar";

  const links = [
    { href: `/${locale}/about`, label: isRTL ? "معلومات عنا" : "About" },
    { href: `/${locale}/privacy`, label: isRTL ? "سياسة الخصوصية" : "Privacy" },
    { href: `/${locale}/terms`, label: isRTL ? "الشروط والأحكام" : "Terms" },
  ];

  return (
    <footer className="w-full border-t bg-background mt-10">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between py-6 px-4 text-sm text-muted-foreground gap-4">
        {/* ✅ Left side */}
        <p className="text-center md:text-left">
          &copy; {new Date().getFullYear()} Delta.{" "}
          {isRTL ? "جميع الحقوق محفوظة." : "All rights reserved."}
        </p>

        {/* ✅ Center Links */}
        <div className="flex gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ✅ Right side (Socials) */}
        <div className="flex gap-4">
          <Link
            href="https://facebook.com"
            target="_blank"
            aria-label="Facebook"
            className="hover:text-foreground transition-colors"
          >
            <Facebook className="h-4 w-4" />
          </Link>
          <Link
            href="https://twitter.com"
            target="_blank"
            aria-label="Twitter"
            className="hover:text-foreground transition-colors"
          >
            <Twitter className="h-4 w-4" />
          </Link>
          <Link
            href="https://github.com"
            target="_blank"
            aria-label="GitHub"
            className="hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
