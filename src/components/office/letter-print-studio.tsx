"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toPersianDigits } from "@/lib/calendar";

export type PaperSize = "a4" | "a5";

type MarginsMm = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const PAPER_MM = {
  a4: { width: 210, height: 297 },
  a5: { width: 148, height: 210 },
} as const;

const DEFAULT_MARGINS_LETTERHEAD: MarginsMm = {
  top: 48,
  right: 20,
  bottom: 32,
  left: 20,
};

const DEFAULT_MARGINS_BLANK: MarginsMm = {
  top: 20,
  right: 18,
  bottom: 20,
  left: 18,
};

function mmToPx(mm: number) {
  return (mm * 96) / 25.4;
}

function clampMargin(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(80, Math.max(0, value));
}

export function LetterPrintStudio({
  letterId,
  title,
  bodyHtml,
}: {
  letterId: string;
  title: string;
  bodyHtml: string;
}) {
  const [paper, setPaper] = useState<PaperSize>("a4");
  const [letterhead, setLetterhead] = useState(true);
  const [margins, setMargins] = useState<MarginsMm>(DEFAULT_MARGINS_LETTERHEAD);
  const [pages, setPages] = useState<string[]>([""]);
  const measureRef = useRef<HTMLDivElement>(null);

  const paperMm = PAPER_MM[paper];
  const contentWidthMm = Math.max(40, paperMm.width - margins.left - margins.right);
  const contentHeightMm = Math.max(40, paperMm.height - margins.top - margins.bottom);
  const contentWidthPx = mmToPx(contentWidthMm);
  const contentHeightPx = mmToPx(contentHeightMm);

  const sourceHtml = useMemo(() => {
    const safeTitle = title.trim();
    const titleBlock = safeTitle
      ? `<h1 class="letter-print-title">${escapeHtml(safeTitle)}</h1>`
      : "";
    return `${titleBlock}${bodyHtml || "<p></p>"}`;
  }, [title, bodyHtml]);

  const paginate = useCallback(() => {
    const host = measureRef.current;
    if (!host) return;

    host.style.width = `${contentWidthPx}px`;
    host.innerHTML = sourceHtml;

    const nodes = Array.from(host.children) as HTMLElement[];
    if (nodes.length === 0) {
      setPages([""]);
      return;
    }

    const nextPages: string[] = [];
    let bucket: HTMLElement[] = [];
    let bucketHeight = 0;

    const flush = () => {
      if (bucket.length === 0) return;
      nextPages.push(bucket.map((node) => node.outerHTML).join(""));
      bucket = [];
      bucketHeight = 0;
    };

    for (const node of nodes) {
      const style = window.getComputedStyle(node);
      const blockHeight =
        node.offsetHeight +
        Number.parseFloat(style.marginTop || "0") +
        Number.parseFloat(style.marginBottom || "0");

      if (bucket.length > 0 && bucketHeight + blockHeight > contentHeightPx) {
        flush();
      }

      bucket.push(node);
      bucketHeight += blockHeight;

      // Oversized single block still gets its own page
      if (bucket.length === 1 && blockHeight > contentHeightPx) {
        flush();
      }
    }

    flush();
    setPages(nextPages.length > 0 ? nextPages : [""]);
  }, [contentHeightPx, contentWidthPx, sourceHtml]);

  useLayoutEffect(() => {
    paginate();
  }, [paginate]);

  useEffect(() => {
    const onResize = () => paginate();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [paginate]);

  useEffect(() => {
    document.documentElement.dataset.letterPaper = paper;
    return () => {
      delete document.documentElement.dataset.letterPaper;
    };
  }, [paper]);

  function setMargin(key: keyof MarginsMm, raw: string) {
    const next = clampMargin(Number(raw));
    setMargins((current) => ({ ...current, [key]: next }));
  }

  function applyLetterheadPreset(enabled: boolean) {
    setLetterhead(enabled);
    setMargins(enabled ? DEFAULT_MARGINS_LETTERHEAD : DEFAULT_MARGINS_BLANK);
  }

  return (
    <div className="letter-print-studio">
      <div className="mb-6 flex flex-col gap-4 border border-line bg-white p-4 print:hidden md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-navy px-4 py-3 text-sm font-bold text-white"
            >
              چاپ
            </button>
            <Link
              href={`/app/letters/${letterId}`}
              className="btn border border-line px-4 py-3 text-sm font-bold"
            >
              بازگشت به ویرایش
            </Link>
          </div>
          <p className="text-xs font-light text-secondary">
            {toPersianDigits(pages.length)} صفحه · {paper.toUpperCase()}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-bold">اندازه کاغذ</legend>
            <div className="flex gap-1 border border-line bg-mist p-1">
              {(
                [
                  ["a4", "A4"],
                  ["a5", "A5"],
                ] as const
              ).map(([value, label]) => {
                const active = paper === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
                      active ? "bg-navy text-white" : "text-secondary hover:text-navy"
                    }`}
                    aria-pressed={active}
                    onClick={() => setPaper(value)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold">سربرگ دیجیتال</legend>
            <div className="flex gap-1 border border-line bg-mist p-1">
              <button
                type="button"
                className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
                  letterhead ? "bg-navy text-white" : "text-secondary hover:text-navy"
                }`}
                aria-pressed={letterhead}
                onClick={() => applyLetterheadPreset(true)}
              >
                با سربرگ
              </button>
              <button
                type="button"
                className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
                  !letterhead ? "bg-navy text-white" : "text-secondary hover:text-navy"
                }`}
                aria-pressed={!letterhead}
                onClick={() => applyLetterheadPreset(false)}
              >
                بدون سربرگ
              </button>
            </div>
            <p className="text-[0.7rem] font-light leading-5 text-secondary">
              بدون سربرگ برای کاغذ از پیش چاپ‌شده؛ فقط متن با حاشیه تنظیم می‌شود.
            </p>
          </fieldset>

          <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-sm font-bold">حاشیه‌ها (میلی‌متر)</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["top", "بالا"],
                  ["bottom", "پایین"],
                  ["right", "راست"],
                  ["left", "چپ"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-xs font-bold text-secondary">
                  {label}
                  <input
                    type="number"
                    min={0}
                    max={80}
                    step={1}
                    value={margins[key]}
                    onChange={(event) => setMargin(key, event.target.value)}
                    className="field mt-1 ltr-isolate"
                    dir="ltr"
                  />
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <div
        ref={measureRef}
        aria-hidden
        className="letter-print-measure pointer-events-none absolute -left-[9999px] top-0 opacity-0"
      />

      <div className="letter-print-pages flex flex-col items-center gap-6 print:gap-0">
        {pages.map((pageHtml, index) => (
          <div key={`page-${index}`} className="letter-print-page-wrap">
            <p className="mb-2 text-center text-xs font-light text-secondary print:hidden">
              صفحه {toPersianDigits(index + 1)}
            </p>
            <article
              className={`letter-page letter-page-${paper} bg-white text-navy shadow-[0_18px_40px_rgba(26,53,113,0.12)] print:shadow-none ${
                letterhead ? "letter-page-letterhead" : ""
              }`}
              style={{
                width: `${paperMm.width}mm`,
                height: `${paperMm.height}mm`,
                paddingTop: `${margins.top}mm`,
                paddingRight: `${margins.right}mm`,
                paddingBottom: `${margins.bottom}mm`,
                paddingLeft: `${margins.left}mm`,
                backgroundImage: letterhead ? "url(/brand/letterhead-a4.jpg)" : undefined,
                backgroundSize: letterhead ? "100% 100%" : undefined,
                backgroundRepeat: letterhead ? "no-repeat" : undefined,
                backgroundPosition: letterhead ? "center" : undefined,
              }}
            >
              <div
                className="letter-print-body h-full overflow-hidden text-base font-light leading-9 [&_.letter-print-title]:mb-6 [&_.letter-print-title]:text-2xl [&_.letter-print-title]:font-extrabold [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pr-6 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pr-6"
                dangerouslySetInnerHTML={{ __html: pageHtml }}
              />
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
