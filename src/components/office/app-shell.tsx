"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutApp } from "@/app/app/actions";
import { InstallAppButton } from "@/components/office/install-app-button";
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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="min-h-dvh bg-mist text-navy print:bg-white">
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
              className="border border-line px-3 py-2 text-xs font-bold"
              aria-expanded={open}
              aria-controls="office-sidebar"
              onClick={() => setOpen(true)}
            >
              فهرست
            </button>
            <form action={logoutApp} className="hidden md:block">
              <button type="submit" className="text-xs font-bold text-secondary">
                خروج
              </button>
            </form>
          </div>
        </div>
      </header>

      {open ? (
        <button
          type="button"
          aria-label="بستن فهرست"
          className="fixed inset-0 z-40 bg-navy/45 print:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="office-sidebar"
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(20rem,88vw)] flex-col bg-navy text-white shadow-[-18px_0_40px_rgba(15,33,66,0.35)] transition-transform duration-300 print:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/15 px-5 py-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{userName}</p>
            <p className="mt-1 text-xs font-light text-white/65">{roleName}</p>
          </div>
          <button
            type="button"
            className="shrink-0 border border-white/25 px-3 py-2 text-xs font-bold text-white"
            onClick={() => setOpen(false)}
          >
            بستن
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="منوی دفتر">
          <ul className="space-y-1">
            {nav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-[0.4rem] px-3 py-3 text-sm transition-colors ${
                      active
                        ? "bg-white font-bold text-navy"
                        : "font-normal text-white/85 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <form action={logoutApp} className="mt-4 border-t border-white/15 px-1 pt-4 md:hidden">
            <button type="submit" className="w-full px-3 py-3 text-start text-sm font-bold text-white/80">
              خروج
            </button>
          </form>
        </nav>

        <div className="border-t border-white/15 px-5 py-5">
          <InstallAppButton tipPlacement="above" />
        </div>
      </aside>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10 print:max-w-none print:px-0 print:py-0">
        {children}
      </div>
    </div>
  );
}
