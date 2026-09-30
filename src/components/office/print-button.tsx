"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-navy px-4 py-3 text-sm font-bold text-white print:hidden"
    >
      چاپ
    </button>
  );
}
