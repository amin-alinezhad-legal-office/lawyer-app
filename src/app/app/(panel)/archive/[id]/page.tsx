import Link from "next/link";
import { notFound } from "next/navigation";
import { saveArchiveAction } from "@/app/app/actions";
import { OfficeField } from "@/components/office/ui";
import { getArchiveItem, listCases } from "@/db/queries";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getArchiveItem(id).catch(() => null);
  return { title: row?.title ?? "بایگانی" };
}

export default async function ArchiveDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("office.archive.read");
  const { id } = await params;
  const { error } = await searchParams;
  const row = await getArchiveItem(id).catch(() => null);
  if (!row) notFound();
  const cases = await listCases().catch(() => []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/app/archive" className="text-sm font-light text-secondary">
        بایگانی
      </Link>
      <h1 className="text-3xl font-extrabold">{row.title}</h1>
      {error ? <p className="text-sm">عنوان لازم است.</p> : null}
      {row.fileUrl ? (
        <a href={row.fileUrl} target="_blank" rel="noreferrer" className="inline-block text-sm font-bold">
          دانلود پیوست{row.fileName ? `: ${row.fileName}` : ""}
        </a>
      ) : null}
      <form action={saveArchiveAction} className="space-y-5 border border-line bg-white p-6" encType="multipart/form-data">
        <input type="hidden" name="id" value={row.id} />
        <OfficeField label="عنوان" name="title">
          <input id="title" name="title" required className="field" defaultValue={row.title} />
        </OfficeField>
        <OfficeField label="برچسب‌ها" name="tags">
          <input id="tags" name="tags" className="field" defaultValue={row.tags} />
        </OfficeField>
        <OfficeField label="متن / توضیح" name="body">
          <textarea id="body" name="body" rows={8} className="field resize-y" defaultValue={row.body} />
        </OfficeField>
        <OfficeField label="پیوند به پرونده" name="caseId">
          <select id="caseId" name="caseId" className="select" defaultValue={row.caseId ?? ""}>
            <option value="">بدون پرونده</option>
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </OfficeField>
        <OfficeField label="جایگزینی فایل" name="file">
          <input id="file" name="file" type="file" className="block w-full text-sm" />
        </OfficeField>
        <button type="submit" className="bg-navy px-5 py-3 text-sm font-bold text-white">
          به‌روزرسانی
        </button>
      </form>
    </div>
  );
}
