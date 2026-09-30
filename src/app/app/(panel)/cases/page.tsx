import Link from "next/link";
import { EmptyState } from "@/components/office/ui";
import { listCases } from "@/db/queries";
import { caseStatuses } from "@/lib/office";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "پرونده‌ها" };

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("office.cases.read");
  const { q } = await searchParams;
  let rows: Awaited<ReturnType<typeof listCases>> = [];
  try {
    rows = await listCases(q);
  } catch {
    return <EmptyState>خواندن پرونده‌ها ممکن نشد.</EmptyState>;
  }

  const statusLabel = Object.fromEntries(caseStatuses.map((item) => [item.value, item.label]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">پرونده‌ها</h1>
          <p className="mt-2 text-sm font-light text-secondary">جستجو، پیگیری و یادداشت روی هر پرونده.</p>
        </div>
        <Link href="/app/cases/new" className="btn bg-navy px-4 py-3 text-sm font-bold text-white">
          پرونده تازه
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="جستجوی عنوان، موکل، شماره…"
          className="field"
        />
        <button type="submit" className="shrink-0 border border-line bg-white px-4 py-2 text-sm font-bold">
          بگرد
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState>پرونده‌ای نیست.</EmptyState>
      ) : (
        <div className="divide-y divide-line border border-line bg-white">
          {rows.map((row) => (
            <Link key={row.id} href={`/app/cases/${row.id}`} className="block px-5 py-5 hover:bg-mist">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold">{row.title}</h2>
                <span className="text-xs font-bold text-secondary">{statusLabel[row.status] ?? row.status}</span>
              </div>
              <p className="mt-2 text-sm font-light">
                {row.clientName}
                {row.caseNumber ? ` · ${row.caseNumber}` : ""}
              </p>
              {row.summary ? <p className="mt-2 line-clamp-2 text-sm font-light text-secondary">{row.summary}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
