"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  type CalendarMode,
  type CalendarParts,
  WEEKDAYS_FA,
  dateFromParts,
  daysInMonth,
  formatMonthTitle,
  formatPartsLabel,
  getPartsForMode,
  parseDateTimeLocal,
  sameDay,
  shiftMonth,
  toDateTimeLocalValue,
  toPersianDigits,
  weekStartOffset,
} from "@/lib/calendar";

type Props = {
  id?: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  "aria-label"?: string;
};

export function DateTimePicker({
  id,
  name,
  required,
  defaultValue = "",
  placeholder = "انتخاب تاریخ و ساعت",
  "aria-label": ariaLabel = "انتخاب تاریخ و ساعت",
}: Props) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const initial = parseDateTimeLocal(defaultValue);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CalendarMode>("shamsi");
  const [selected, setSelected] = useState<Date | null>(initial);
  const [hours, setHours] = useState(initial?.getHours() ?? 9);
  const [minutes, setMinutes] = useState(initial?.getMinutes() ?? 0);

  const viewSeed = selected ?? new Date();
  const seedParts = getPartsForMode(mode, viewSeed);
  const [viewYear, setViewYear] = useState(seedParts.year);
  const [viewMonth, setViewMonth] = useState(seedParts.month);

  useEffect(() => {
    const parts = getPartsForMode(mode, selected ?? new Date());
    setViewYear(parts.year);
    setViewMonth(parts.month);
  }, [mode, selected]);

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

  const value = selected ? toDateTimeLocalValue(selected) : "";

  const selectedParts = selected ? getPartsForMode(mode, selected) : null;
  const todayParts = getPartsForMode(mode, new Date());

  const cells = useMemo(() => {
    const total = daysInMonth(mode, viewYear, viewMonth);
    const offset = weekStartOffset(mode, viewYear, viewMonth);
    const items: Array<CalendarParts | null> = [];
    for (let i = 0; i < offset; i += 1) items.push(null);
    for (let day = 1; day <= total; day += 1) {
      items.push({ year: viewYear, month: viewMonth, day });
    }
    while (items.length % 7 !== 0) items.push(null);
    return items;
  }, [mode, viewYear, viewMonth]);

  function goMonth(delta: number) {
    const next = shiftMonth(mode, viewYear, viewMonth, delta);
    setViewYear(next.year);
    setViewMonth(next.month);
  }

  function pickDay(parts: CalendarParts) {
    const next = dateFromParts(mode, parts, hours, minutes);
    setSelected(next);
  }

  function applyTime(nextHours: number, nextMinutes: number) {
    setHours(nextHours);
    setMinutes(nextMinutes);
    if (!selected) return;
    const parts = getPartsForMode(mode, selected);
    setSelected(dateFromParts(mode, parts, nextHours, nextMinutes));
  }

  function setToday() {
    const now = new Date();
    now.setSeconds(0, 0);
    setSelected(now);
    setHours(now.getHours());
    setMinutes(now.getMinutes());
    const parts = getPartsForMode(mode, now);
    setViewYear(parts.year);
    setViewMonth(parts.month);
  }

  function clear() {
    setSelected(null);
  }

  const display = selected
    ? `${formatPartsLabel(mode, getPartsForMode(mode, selected))} · ${
        mode === "shamsi"
          ? toPersianDigits(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`)
          : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
      }`
    : placeholder;

  const digit = (n: number) => (mode === "shamsi" ? toPersianDigits(n) : String(n));

  return (
    <div ref={root} className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      <button
        id={id ?? name}
        type="button"
        className="field flex w-full items-center justify-between gap-4 bg-transparent text-start"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={selected ? "text-navy" : "text-secondary"}>{display}</span>
        <span
          aria-hidden
          className={`shrink-0 text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={listId}
          role="dialog"
          aria-label={ariaLabel}
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-40 border border-line bg-white p-4 shadow-[0_18px_40px_rgba(26,53,113,0.12)] sm:inset-x-auto sm:min-w-[20rem] sm:max-w-[22rem]"
        >
          <div className="flex items-center gap-1 border border-line bg-mist p-1">
            {(
              [
                ["shamsi", "شمسی"],
                ["miladi", "میلادی"],
              ] as const
            ).map(([key, label]) => {
              const active = mode === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
                    active ? "bg-navy text-white" : "text-secondary hover:text-navy"
                  }`}
                  aria-pressed={active}
                  onClick={() => setMode(key)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              className="border border-line px-3 py-2 text-sm text-navy transition-colors hover:bg-mist"
              aria-label="ماه قبل"
              onClick={() => goMonth(-1)}
            >
              ‹
            </button>
            <p className="text-sm font-bold text-navy">{formatMonthTitle(mode, viewYear, viewMonth)}</p>
            <button
              type="button"
              className="border border-line px-3 py-2 text-sm text-navy transition-colors hover:bg-mist"
              aria-label="ماه بعد"
              onClick={() => goMonth(1)}
            >
              ›
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.7rem] font-bold text-secondary">
            {WEEKDAYS_FA.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((parts, index) => {
              if (!parts) {
                return <span key={`empty-${index}`} className="aspect-square" />;
              }
              const isSelected = selectedParts ? sameDay(parts, selectedParts) : false;
              const isToday = sameDay(parts, todayParts);
              return (
                <button
                  key={`${parts.year}-${parts.month}-${parts.day}`}
                  type="button"
                  className={`aspect-square text-sm transition-colors ${
                    isSelected
                      ? "bg-navy font-bold text-white"
                      : isToday
                        ? "border border-navy font-bold text-navy hover:bg-mist"
                        : "text-navy hover:bg-mist"
                  }`}
                  onClick={() => pickDay(parts)}
                >
                  {digit(parts.day)}
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2 text-xs font-bold text-secondary">ساعت</p>
            <div className="flex items-center gap-2" dir="ltr">
              <label className="flex flex-1 flex-col gap-1 text-[0.65rem] font-bold text-secondary">
                ساعت
                <select
                  className="select py-2 text-sm font-bold"
                  value={hours}
                  onChange={(event) => applyTime(Number(event.target.value), minutes)}
                >
                  {Array.from({ length: 24 }, (_, hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </label>
              <span className="pt-5 text-lg font-bold text-navy">:</span>
              <label className="flex flex-1 flex-col gap-1 text-[0.65rem] font-bold text-secondary">
                دقیقه
                <select
                  className="select py-2 text-sm font-bold"
                  value={minutes}
                  onChange={(event) => applyTime(hours, Number(event.target.value))}
                >
                  {Array.from({ length: 12 }, (_, index) => index * 5)
                    .concat(minutes % 5 === 0 ? [] : [minutes])
                    .sort((a, b) => a - b)
                    .map((minute) => (
                      <option key={minute} value={minute}>
                        {String(minute).padStart(2, "0")}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              className="px-3 py-2 text-xs font-bold text-secondary transition-colors hover:text-navy"
              onClick={clear}
            >
              پاک کردن
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className="border border-line px-3 py-2 text-xs font-bold text-navy transition-colors hover:bg-mist"
                onClick={setToday}
              >
                امروز
              </button>
              <button
                type="button"
                className="bg-navy px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                onClick={() => setOpen(false)}
              >
                تأیید
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
