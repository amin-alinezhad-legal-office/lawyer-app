import {
  removeReminderAction,
  saveReminderAction,
  toggleReminderAction,
} from "@/app/app/actions";
import { EmptyState, OfficeField } from "@/components/office/ui";
import { listCases, listReminders } from "@/db/queries";
import { formatPersianDate } from "@/lib/format";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "یادآورها" };

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("office.reminders.read");
  const { error } = await searchParams;
  let rows: Awaited<ReturnType<typeof listReminders>> = [];
  let cases: Awaited<ReturnType<typeof listCases>> = [];
  try {
    rows = await listReminders();
    cases = await listCases();
  } catch {
    return <EmptyState>خواندن یادآورها ممکن نشد.</EmptyState>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">یادآورها</h1>
        <p className="mt-2 text-sm font-light text-secondary">مهلت‌ها و کارهای شخصی دفتر.</p>
      </div>

      <form action={saveReminderAction} className="space-y-4 border border-line bg-white p-5">
        {error ? <p className="text-sm">عنوان و زمان لازم است.</p> : null}
        <OfficeField label="عنوان" name="title">
          <input id="title" name="title" required className="field" />
        </OfficeField>
        <OfficeField label="توضیح" name="body">
          <textarea id="body" name="body" rows={3} className="field resize-y" />
        </OfficeField>
        <OfficeField label="موعد" name="dueAt">
          <input id="dueAt" name="dueAt" type="datetime-local" required className="field ltr-isolate" dir="ltr" />
        </OfficeField>
        <OfficeField label="پرونده مرتبط" name="caseId">
          <select id="caseId" name="caseId" className="field bg-white" defaultValue="">
            <option value="">بدون پرونده</option>
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </OfficeField>
        <button type="submit" className="bg-navy px-4 py-3 text-sm font-bold text-white">
          افزودن یادآور
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState>یادآوری نیست.</EmptyState>
      ) : (
        <div className="divide-y divide-line border border-line bg-white">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-start justify-between gap-4 px-5 py-5">
              <div className={row.done ? "opacity-50" : ""}>
                <p className="font-bold">{row.title}</p>
                <p className="mt-1 text-xs font-light text-secondary">{formatPersianDate(row.dueAt)}</p>
                {row.body ? <p className="mt-2 text-sm font-light leading-7">{row.body}</p> : null}
              </div>
              <div className="flex gap-2">
                <form action={toggleReminderAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="done" value={row.done ? "0" : "1"} />
                  <button type="submit" className="border border-line px-3 py-2 text-xs font-bold">
                    {row.done ? "باز کردن" : "انجام شد"}
                  </button>
                </form>
                <form action={removeReminderAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <button type="submit" className="px-3 py-2 text-xs font-bold text-secondary">
                    حذف
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
