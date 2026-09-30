"use client";

import { useEffect, useId, useRef, useState } from "react";

export type OfficeSelectOption = {
  value: string;
  label: string;
  hint?: string;
};

export function OfficeSelect({
  id,
  name,
  options,
  placeholder = "انتخاب کنید",
  defaultValue = "",
  required,
  "aria-label": ariaLabel,
}: {
  id?: string;
  name: string;
  options: OfficeSelectOption[];
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  "aria-label"?: string;
}) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const selected = options.find((option) => option.value === value);

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

  function choose(next: string) {
    setValue(next);
    setOpen(false);
  }

  return (
    <div ref={root} className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      <button
        id={id ?? name}
        type="button"
        className="field flex w-full items-center justify-between gap-4 bg-transparent text-start"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? "text-navy" : "text-secondary"}>
          {selected?.label ?? placeholder}
        </span>
        <span
          aria-hidden
          className={`shrink-0 text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 max-h-64 overflow-y-auto border border-line bg-white shadow-[0_18px_40px_rgba(26,53,113,0.12)]"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!value}
              className={`flex w-full px-4 py-3 text-start text-sm transition-colors hover:bg-mist ${
                !value ? "bg-mist font-bold text-navy" : "font-light text-secondary"
              }`}
              onClick={() => choose("")}
            >
              {placeholder}
            </button>
          </li>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-start transition-colors hover:bg-mist ${
                    active ? "bg-mist" : ""
                  }`}
                  onClick={() => choose(option.value)}
                >
                  <span className="text-sm font-bold text-navy">{option.label}</span>
                  {option.hint ? (
                    <span className="text-xs font-light leading-6 text-secondary">{option.hint}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
