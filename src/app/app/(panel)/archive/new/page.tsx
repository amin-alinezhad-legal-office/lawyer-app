import { saveArchiveAction } from "@/app/app/actions";
import { OfficeField } from "@/components/office/ui";
import { listCases } from "@/db/queries";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "سند تازه" };

export default async function NewArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("office.archive.write");
  const { error } = await searchParams;
  const cases = await listCases().catch(() => []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-extrabold">سند تازه در بایگانی</h1>
      {error ? <p className="text-sm">عنوان لازم است.</p> : null}
      <form action={saveArchiveAction} className="space-y-5 border border-line bg-white p-6" encType="multipart/form-data">
        <OfficeField label="عنوان" name="title">
          <input id="title" name="title" required className="field" />
        </OfficeField>
        <OfficeField label="برچسب‌ها" name="tags">
          <input id="tags" name="tags" className="field" placeholder="قرارداد، ملکی، ۱۴۰۵" />
        </OfficeField>
        <OfficeField label="متن / توضیح" name="body">
          <textarea id="body" name="body" rows={6} className="field resize-y" />
        </OfficeField>
        <OfficeField label="پیوند به پرونده" name="caseId">
          <select id="caseId" name="caseId" className="select" defaultValue="">
            <option value="">بدون پرونده</option>
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </OfficeField>
        <OfficeField label="آپلود فایل" name="file">
          <input id="file" name="file" type="file" className="block w-full text-sm" />
        </OfficeField>
        <button type="submit" className="bg-navy px-5 py-3 text-sm font-bold text-white">
          ذخیره در بایگانی
        </button>
      </form>
    </div>
  );
}
