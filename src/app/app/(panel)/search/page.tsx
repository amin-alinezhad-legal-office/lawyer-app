import Link from "next/link";
import { EmptyState } from "@/components/office/ui";
import { searchOffice } from "@/db/queries";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "جستجو" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("office.search.use");
  const { q = "" } = await searchParams;
  let result: Awaited<ReturnType<typeof searchOffice>> | null = null;
  try {
    result = q.trim() ? await searchOffice(q) : null;
  } catch {
    return <EmptyState>جستجو ممکن نشد.</EmptyState>;
  }

  const total = result
    ? result.cases.length +
      result.archive.length +
      result.notes.length +
      result.letters.length +
      result.inquiries.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">جستجو</h1>
        <p className="mt-2 text-sm font-light text-secondary">
          در پرونده‌ها، بایگانی، یادداشت‌ها، نامه‌ها و درخواست‌ها.
        </p>
      </div>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="عبارت جستجو…" className="field" autoFocus />
        <button type="submit" className="shrink-0 bg-navy px-4 py-2 text-sm font-bold text-white">
          بگرد
        </button>
      </form>

      {!q.trim() ? (
        <EmptyState>عبارتی بنویسید و جستجو کنید.</EmptyState>
      ) : total === 0 ? (
        <EmptyState>نتیجه‌ای پیدا نشد.</EmptyState>
      ) : (
        <div className="space-y-8">
          <ResultGroup title="پرونده‌ها" items={result!.cases.map((row) => ({ href: `/app/cases/${row.id}`, title: row.title, meta: row.clientName }))} />
          <ResultGroup title="بایگانی" items={result!.archive.map((row) => ({ href: `/app/archive/${row.id}`, title: row.title, meta: row.tags }))} />
          <ResultGroup title="یادداشت‌ها" items={result!.notes.map((row) => ({ href: `/app/notes/${row.id}`, title: row.title, meta: "" }))} />
          <ResultGroup title="نامه‌ها" items={result!.letters.map((row) => ({ href: `/app/letters/${row.id}`, title: row.title, meta: "" }))} />
          <ResultGroup title="درخواست‌ها" items={result!.inquiries.map((row) => ({ href: "/app/requests", title: row.fullName, meta: row.message.slice(0, 80) }))} />
        </div>
      )}
    </div>
  );
}

function ResultGroup({
  title,
  items,
}: {
  title: string;
  items: { href: string; title: string; meta: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-extrabold">{title}</h2>
      <div className="divide-y divide-line border border-line bg-white">
        {items.map((item) => (
          <Link key={`${item.href}-${item.title}`} href={item.href} className="block px-5 py-4 hover:bg-mist">
            <p className="font-bold">{item.title}</p>
            {item.meta ? <p className="mt-1 text-sm font-light text-secondary">{item.meta}</p> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
