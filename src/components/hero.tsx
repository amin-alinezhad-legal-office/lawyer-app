"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { EmailLink, PhoneLink } from "@/components/contact-links";
import { site } from "@/lib/site";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const motion = gsap.matchMedia();
      motion.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        timeline
          .from("[data-hero='mark']", { autoAlpha: 0, y: 18, duration: 1.05 })
          .from("[data-hero='rule']", { scaleY: 0, duration: 0.85 }, 0.15)
          .from("[data-hero='copy'] > *", { autoAlpha: 0, y: 18, duration: 0.85, stagger: 0.08 }, 0.28);
      });
      return () => motion.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="bg-navy text-white">
      <div className="mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-6xl items-center gap-12 px-6 py-16 md:px-10 lg:grid-cols-[minmax(0,1.15fr)_1px_minmax(0,0.85fr)] lg:py-20">
        <div data-hero="copy">
          <p className="text-sm font-light text-white/75">
            {site.role}
            <span className="mx-2 text-white/40">/</span>
            {site.bar}
          </p>
          <h1 className="mt-8 max-w-2xl text-4xl font-extrabold leading-[1.35] tracking-tight md:text-6xl">
            {site.name}
          </h1>
          <p className="mt-8 max-w-xl text-lg font-light leading-9 text-white/88">{site.summary}</p>
          <p className="mt-6 text-sm font-light text-white/70">شماره پروانه {site.license}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="btn bg-white px-5 py-3 text-sm font-bold text-navy transition-opacity hover:opacity-90"
            >
              درخواست مشاوره
            </Link>
            <PhoneLink className="btn border border-white/40 px-5 py-3 text-sm font-bold transition-colors hover:bg-white/10" />
          </div>
        </div>
        <div
          data-hero="rule"
          className="hidden h-64 origin-top justify-self-center bg-white/35 lg:block"
        />
        <div data-hero="mark" className="flex justify-center lg:justify-start">
          <Image
            src="/brand/mark-white.png"
            alt="نشان کانون وکلای دادگستری مرکز"
            width={475}
            height={634}
            priority
            className="h-auto w-44 md:w-56"
          />
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-5 text-sm font-light text-white/75 md:flex-row md:items-center md:justify-between md:px-10">
          <p>{site.address}</p>
          <EmailLink className="hover:text-white" />
        </div>
      </div>
    </section>
  );
}
