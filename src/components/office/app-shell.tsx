"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutApp } from "@/app/app/actions";
import type { AppNavItem } from "@/lib/office";

export function AppShell({
  children,
  nav,
  userName,
  roleName,
}: {
  children: React.ReactNode;
  nav: AppNavItem[];
  userName: string;
  roleName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-mist text-navy">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{userName}</p>
            <p className="text-xs font-light text-secondary">{roleName}</p>
          </div>
          <div className="flex items-center gap-2">
            {nav.some((item) => item.href === "/app/search") ? (
              <Link href="/app/search" className="btn border border-line px-3 py-2 text-xs font-bold">
                جستجو
              </Link>
            ) : null}
            <Link href="/app/profile" className="btn border border-line px-3 py-2 text-xs font-bold">
              پروفایل
            </Link>
            <button
              type="button"
              className="border border-line px-3 py-2 text-xs font-bold md:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "بستن" : "فهرست"}
            </button>
            <form action={logoutApp} className="hidden md:block">
              <button type="submit" className="text-xs font-bold text-secondary">
                خروج
              </button>
            </form>
          </div>
        </div>
        <nav
          className={`border-t border-line ${open ? "block" : "hidden"} md:block`}
          aria-label="منوی دفتر"
        >
          <div className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 py-2 md:px-6">
            {nav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`shrink-0 rounded-[0.4rem] px-3 py-2 text-sm ${
                    active ? "bg-navy font-bold text-white" : "font-normal text-secondary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <form action={logoutApp} className="md:hidden">
              <button type="submit" className="px-3 py-2 text-sm font-bold text-secondary">
                خروج
              </button>
            </form>
          </div>
        </nav>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">{children}</div>
    </div>
  );
}
