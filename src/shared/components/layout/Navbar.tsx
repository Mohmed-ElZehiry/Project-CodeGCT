"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import ThemeSwitcher from "./theme-switcher";
import LanguageSwitcher from "./LanguageSwitcher";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { navigation, publicLinks } from "@/config/navigation";
import { useAuth } from "@/shared/hooks/useAuth";

interface NavbarState {
  isScrolled: boolean;
  lastScrollY: number;
}

export default function Navbar() {
  const params = useParams();
  const pathname = usePathname();
  const { user, role, isAuthenticated } = useAuth();

  // ✅ fallback للـ locale
  let locale = params?.locale as string;
  if (!locale) {
    const firstSegment = pathname.split("/")[1];
    locale = ["en", "ar"].includes(firstSegment) ? firstSegment : "en";
  }

  const isRTL = locale === "ar";

  const navbarRef = useRef<HTMLElement>(null);
  const stateRef = useRef<NavbarState>({ isScrolled: false, lastScrollY: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ✅ Active Link helper
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // ✅ تأثير التمرير (إضافة ظل عند النزول)
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const { isScrolled } = stateRef.current;

    if (currentScrollY > 10 && !isScrolled) {
      stateRef.current.isScrolled = true;
      navbarRef.current?.classList.add("shadow-md");
    } else if (currentScrollY <= 10 && isScrolled) {
      stateRef.current.isScrolled = false;
      navbarRef.current?.classList.remove("shadow-md");
    }

    stateRef.current.lastScrollY = currentScrollY;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Force re-render when auth state changes
  const authKey = user?.id || "guest";

  return (
    <nav
      ref={navbarRef}
      key={`navbar-${authKey}`} // Force re-render on auth change
      aria-label="Main Navigation"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur transition-all duration-300",
        stateRef.current.isScrolled ? "py-0" : "py-2",
        isRTL ? "font-sans-ar" : "font-sans",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ✅ Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <Image
              src="/android-chrome-192x192.png"
              alt="Delta Icon"
              width={32}
              height={32}
              className="rounded-md"
              priority
            />
            <span className="font-bold text-lg">Delta</span>
          </Link>

          {/* ✅ Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {publicLinks.map((link) => {
              const href = link.href(locale);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "hover:text-primary transition-colors",
                    isActive(href) && "text-primary font-semibold",
                  )}
                >
                  {link.label(locale)}
                </Link>
              );
            })}
            {isAuthenticated &&
              role &&
              navigation[role]?.map((link) => {
                const href = link.href(locale);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "hover:text-primary transition-colors",
                      isActive(href) && "text-primary font-semibold",
                    )}
                  >
                    {link.label(locale)}
                  </Link>
                );
              })}
          </div>

          {/* ✅ Right Section */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageSwitcher />

            {/* ✅ User Menu or Sign In Button */}
            <div key={`auth-${authKey}`} className="flex items-center">
              {isAuthenticated ? (
                <UserMenu key={`user-menu-${authKey}`} showLabel={false} locale={locale} />
              ) : (
                <Link
                  href={`/${locale}/sign-in`}
                  className="hidden md:inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  {isRTL ? "تسجيل الدخول" : "Sign In"}
                </Link>
              )}
            </div>

            {/* ✅ Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-muted"
              onClick={() => setDrawerOpen(!drawerOpen)}
              aria-label={isRTL ? "تبديل القائمة" : "Toggle menu"}
            >
              {drawerOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Drawer (Mobile) */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className={cn(
              "absolute top-0 h-full w-64 bg-background shadow-lg p-6 flex flex-col gap-4 transition-transform",
              isRTL ? "right-0" : "left-0",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {publicLinks.map((link) => {
              const href = link.href(locale);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "block py-2 text-sm hover:text-primary",
                    isActive(href) && "text-primary font-semibold",
                  )}
                >
                  {link.label(locale)}
                </Link>
              );
            })}

            {isAuthenticated &&
              navigation[role]?.map((link) => {
                const href = link.href(locale);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "block py-2 text-sm hover:text-primary",
                      isActive(href) && "text-primary font-semibold",
                    )}
                  >
                    {link.label(locale)}
                  </Link>
                );
              })}

            {!isAuthenticated && (
              <Link
                href={`/${locale}/sign-in`}
                className="block py-2 text-sm font-medium text-primary hover:underline"
              >
                {isRTL ? "تسجيل الدخول" : "Sign In"}
              </Link>
            )}

            {isAuthenticated && (
              <div className="mt-4 border-t pt-4">
                <UserMenu
                  key={user?.id || "guest"} // ✅ نفس الفكرة في الموبايل
                  showLabel={true}
                  locale={locale}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
