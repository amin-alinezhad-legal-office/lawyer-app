"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MatterTopic } from "@/lib/site";

export function MatterSelect({
  topics,
  name = "matter",
  error,
  defaultValue = "",
}: {
  topics: MatterTopic[];
  name?: string;
  error?: string;
  defaultValue?: string;
}) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const selected = topics.find((matter) => matter.slug === value);

  useEffect(() => {
    if (!open) return;

    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(slug: string) {
    setValue(slug);
    setOpen(false);
  }

  return (
    <div ref={root} className="relative" aria-labelledby="matter-label">
      <input type="hidden" name={name} value={value} />
      <button
        id={name}
        type="button"
        className="field flex w-full items-center justify-between gap-4 bg-transparent text-start"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={Boolean(error) || undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? "text-navy" : "text-secondary"}>
          {selected?.title ?? "انتخاب کنید"}
        </span>
        <span aria-hidden className={`text-secondary transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="موضوع"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 border border-line bg-white shadow-[0_18px_40px_rgba(26,53,113,0.12)]"
        >
          {topics.map((matter) => {
            const active = matter.slug === value;
            return (
              <li key={matter.slug}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-start transition-colors hover:bg-mist ${
                    active ? "bg-mist" : ""
                  }`}
                  onClick={() => choose(matter.slug)}
                >
                  <span className="text-sm font-bold">{matter.title}</span>
                  {matter.summary ? (
                    <span className="text-xs font-light leading-6 text-secondary">{matter.summary}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {error ? <span className="mt-2 block text-sm font-light">{error}</span> : null}
    </div>
  );
}
