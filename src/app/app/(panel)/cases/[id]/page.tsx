import Link from "next/link";
import { notFound } from "next/navigation";
import { addCaseNoteAction, saveCaseAction } from "@/app/app/actions";
import { EmptyState, OfficeField } from "@/components/office/ui";
import { getCase, listCaseNotes } from "@/db/queries";
import { formatPersianDate } from "@/lib/format";
import { caseStatuses } from "@/lib/office";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getCase(id).catch(() => null);
  return { title: row?.title ?? "پرونده" };
}

export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("office.cases.read");
  const { id } = await params;
  const { error } = await searchParams;
  const row = await getCase(id).catch(() => null);
  if (!row) notFound();
  const notes = await listCaseNotes(id).catch(() => []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/app/cases" className="text-sm font-light text-secondary">
            پرونده‌ها
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold">{row.title}</h1>
        </div>
      </div>
      {error ? <p className="text-sm">عنوان و نام موکل لازم است.</p> : null}

      <form action={saveCaseAction} className="space-y-5 border border-line bg-white p-6">
        <input type="hidden" name="id" value={row.id} />
        <OfficeField label="عنوان پرونده" name="title">
          <input id="title" name="title" required className="field" defaultValue={row.title} />
        </OfficeField>
        <OfficeField label="شماره پرونده" name="caseNumber">
          <input id="caseNumber" name="caseNumber" className="field" defaultValue={row.caseNumber ?? ""} />
        </OfficeField>
        <OfficeField label="نام موکل" name="clientName">
          <input id="clientName" name="clientName" required className="field" defaultValue={row.clientName} />
        </OfficeField>
        <OfficeField label="موبایل موکل" name="clientPhone">
          <input
            id="clientPhone"
            name="clientPhone"
            className="field ltr-isolate"
            dir="ltr"
            defaultValue={row.clientPhone ?? ""}
          />
        </OfficeField>
        <OfficeField label="وضعیت" name="status">
          <select id="status" name="status" className="select" defaultValue={row.status}>
            {caseStatuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </OfficeField>
        <OfficeField label="خلاصه" name="summary">
          <textarea id="summary" name="summary" rows={5} className="field resize-y" defaultValue={row.summary} />
        </OfficeField>
        <button type="submit" className="bg-navy px-5 py-3 text-sm font-bold text-white">
          به‌روزرسانی پرونده
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold">یادداشت‌های پرونده</h2>
        <form action={addCaseNoteAction} className="space-y-3 border border-line bg-white p-5">
          <input type="hidden" name="caseId" value={row.id} />
          <textarea name="body" required rows={4} className="field resize-y" placeholder="یادداشت تازه…" />
          <button type="submit" className="border border-line px-4 py-2 text-sm font-bold">
            افزودن یادداشت
          </button>
        </form>
        {notes.length === 0 ? (
          <EmptyState>هنوز یادداشتی نیست.</EmptyState>
        ) : (
          <div className="divide-y divide-line border border-line bg-white">
            {notes.map((note) => (
              <div key={note.id} className="px-5 py-4">
                <p className="text-xs font-light text-secondary">{formatPersianDate(note.createdAt)}</p>
                <p className="mt-2 whitespace-pre-wrap font-light leading-8">{note.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
