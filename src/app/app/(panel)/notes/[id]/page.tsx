import Link from "next/link";
import { notFound } from "next/navigation";
import { savePersonalNoteAction } from "@/app/app/actions";
import { OfficeField } from "@/components/office/ui";
import { getPersonalNote } from "@/db/queries";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("office.notes.read");
  const { id } = await params;
  const row = await getPersonalNote(id).catch(() => null);
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/app/notes" className="text-sm font-light text-secondary">
        یادداشت‌ها
      </Link>
      <h1 className="text-3xl font-extrabold">ویرایش یادداشت</h1>
      <form action={savePersonalNoteAction} className="space-y-5 border border-line bg-white p-6">
        <input type="hidden" name="id" value={row.id} />
        <OfficeField label="عنوان" name="title">
          <input id="title" name="title" required className="field" defaultValue={row.title} />
        </OfficeField>
        <OfficeField label="متن" name="body">
          <textarea id="body" name="body" rows={10} className="field resize-y" defaultValue={row.body} />
        </OfficeField>
        <button type="submit" className="bg-navy px-5 py-3 text-sm font-bold text-white">
          ذخیره
        </button>
      </form>
    </div>
  );
}
