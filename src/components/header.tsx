"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { nav, site } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-6 px-6 md:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/brand/emblem-navy.png"
            alt=""
            width={475}
            height={448}
            className="h-11 w-auto shrink-0"
          />
          <span className="truncate text-sm font-extrabold leading-6 md:text-base">{site.name}</span>
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="فهرست اصلی">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm ${active ? "font-bold" : "font-normal text-secondary"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/app/login"
            className="hidden text-sm font-bold text-secondary transition-colors hover:text-navy sm:inline-block"
          >
            ورود
          </Link>
          <Link
            href="/contact"
            className="btn hidden bg-navy px-4 py-2 text-sm font-bold text-white sm:inline-block"
          >
            درخواست مشاوره
          </Link>
          <button
            type="button"
            className="border border-line px-3 py-2 text-sm lg:hidden"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "بستن" : "فهرست"}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-line px-6 py-4 lg:hidden" aria-label="فهرست موبایل">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block py-3 text-base font-bold"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/app/login"
            className="block py-3 text-base font-bold text-secondary"
            onClick={() => setOpen(false)}
          >
            ورود به دفتر
          </Link>
          <Link
            href="/contact"
            className="mt-2 block py-3 text-base font-bold"
            onClick={() => setOpen(false)}
          >
            درخواست مشاوره
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
