import Link from "next/link";
import {
  removePersonalNoteAction,
  savePersonalNoteAction,
} from "@/app/app/actions";
import { EmptyState, OfficeField } from "@/components/office/ui";
import { listPersonalNotes } from "@/db/queries";
import { formatPersianDate } from "@/lib/format";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "یادداشت‌ها" };

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  await requirePermission("office.notes.read");
  const { q, error } = await searchParams;
  let rows: Awaited<ReturnType<typeof listPersonalNotes>> = [];
  try {
    rows = await listPersonalNotes(q);
  } catch {
    return <EmptyState>خواندن یادداشت‌ها ممکن نشد.</EmptyState>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">یادداشت‌های شخصی</h1>
        <p className="mt-2 text-sm font-light text-secondary">فقط برای خودتان؛ روی سایت عمومی دیده نمی‌شود.</p>
      </div>

      <form action={savePersonalNoteAction} className="space-y-4 border border-line bg-white p-5">
        {error ? <p className="text-sm">عنوان لازم است.</p> : null}
        <OfficeField label="عنوان" name="title">
          <input id="title" name="title" required className="field" />
        </OfficeField>
        <OfficeField label="متن" name="body">
          <textarea id="body" name="body" rows={4} className="field resize-y" />
        </OfficeField>
        <button type="submit" className="bg-navy px-4 py-3 text-sm font-bold text-white">
          افزودن یادداشت
        </button>
      </form>

      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="جستجو در یادداشت‌ها…" className="field" />
        <button type="submit" className="shrink-0 border border-line bg-white px-4 py-2 text-sm font-bold">
          بگرد
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState>یادداشتی نیست.</EmptyState>
      ) : (
        <div className="divide-y divide-line border border-line bg-white">
          {rows.map((row) => (
            <article key={row.id} className="px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/app/notes/${row.id}`} className="text-lg font-bold">
                    {row.title}
                  </Link>
                  <p className="mt-1 text-xs font-light text-secondary">{formatPersianDate(row.updatedAt)}</p>
                </div>
                <form action={removePersonalNoteAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <button type="submit" className="text-xs font-bold text-secondary">
                    حذف
                  </button>
                </form>
              </div>
              {row.body ? <p className="mt-3 whitespace-pre-wrap text-sm font-light leading-7">{row.body}</p> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
