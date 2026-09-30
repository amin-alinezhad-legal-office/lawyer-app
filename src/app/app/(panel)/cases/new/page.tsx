import { saveCaseAction } from "@/app/app/actions";
import { OfficeField } from "@/components/office/ui";
import { caseStatuses } from "@/lib/office";
import { requirePermission } from "@/lib/auth";

export const metadata = { title: "پرونده تازه" };

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("office.cases.write");
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-extrabold">پرونده تازه</h1>
      {error ? <p className="text-sm">عنوان و نام موکل لازم است.</p> : null}
      <form action={saveCaseAction} className="space-y-5 border border-line bg-white p-6">
        <OfficeField label="عنوان پرونده" name="title">
          <input id="title" name="title" required className="field" />
        </OfficeField>
        <OfficeField label="شماره پرونده" name="caseNumber">
          <input id="caseNumber" name="caseNumber" className="field" />
        </OfficeField>
        <OfficeField label="نام موکل" name="clientName">
          <input id="clientName" name="clientName" required className="field" />
        </OfficeField>
        <OfficeField label="موبایل موکل" name="clientPhone">
          <input id="clientPhone" name="clientPhone" className="field ltr-isolate" dir="ltr" />
        </OfficeField>
        <OfficeField label="وضعیت" name="status">
          <select id="status" name="status" className="select" defaultValue="open">
            {caseStatuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </OfficeField>
        <OfficeField label="خلاصه" name="summary">
          <textarea id="summary" name="summary" rows={5} className="field resize-y" />
        </OfficeField>
        <button type="submit" className="bg-navy px-5 py-3 text-sm font-bold text-white">
          ذخیره
        </button>
      </form>
    </div>
  );
}
