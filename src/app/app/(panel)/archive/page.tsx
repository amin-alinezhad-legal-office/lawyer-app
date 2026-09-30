import Link from "next/link";
import { EmptyState } from "@/components/office/ui";
import { listArchive } from "@/db/queries";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "بایگانی" };

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("office.archive.read");
  const { q } = await searchParams;
  let rows: Awaited<ReturnType<typeof listArchive>> = [];
  try {
    rows = await listArchive(q);
  } catch {
    return <EmptyState>خواندن بایگانی ممکن نشد.</EmptyState>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">بایگانی</h1>
          <p className="mt-2 text-sm font-light text-secondary">سند، متن و برچسب برای بایگانی شخصی.</p>
        </div>
        <Link href="/app/archive/new" className="btn bg-navy px-4 py-3 text-sm font-bold text-white">
          سند تازه
        </Link>
      </div>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="عنوان، متن یا برچسب…" className="field" />
        <button type="submit" className="shrink-0 border border-line bg-white px-4 py-2 text-sm font-bold">
          بگرد
        </button>
      </form>
      {rows.length === 0 ? (
        <EmptyState>بایگانی خالی است.</EmptyState>
      ) : (
        <div className="divide-y divide-line border border-line bg-white">
          {rows.map((row) => (
            <Link key={row.id} href={`/app/archive/${row.id}`} className="block px-5 py-5 hover:bg-mist">
              <h2 className="text-lg font-bold">{row.title}</h2>
              {row.tags ? <p className="mt-2 text-xs font-light text-secondary">{row.tags}</p> : null}
              {row.body ? <p className="mt-2 line-clamp-2 text-sm font-light">{row.body}</p> : null}
              {row.fileName ? <p className="mt-2 text-xs font-bold">پیوست: {row.fileName}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
