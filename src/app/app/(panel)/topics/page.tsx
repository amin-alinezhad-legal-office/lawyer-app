import {
  createTopicAction,
  deleteTopicAction,
  updateTopicAction,
} from "@/app/app/actions";
import { EmptyState, OfficeField } from "@/components/office/ui";
import { listAllFormTopics } from "@/db/queries";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "حوزه‌های کاری" };

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("site.topics.read");
  const { error } = await searchParams;
  let rows: Awaited<ReturnType<typeof listAllFormTopics>> = [];
  try {
    rows = await listAllFormTopics();
  } catch {
    return (
      <EmptyState>
        خواندن حوزه‌های کاری ممکن نشد. ابتدا `DATABASE_URL` را وصل کنید و `npm run db:push` را بزنید.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">حوزه‌های کاری</h1>
        <p className="mt-2 text-sm font-light text-secondary">
          مدیریت حوزه‌های کاری سایت و گزینه‌های موضوع در فرم تماس. هر موردی که «فعال در فرم تماس» باشد در
          صفحه تماس دیده می‌شود؛ «نمایش در سایت» آن را در صفحه حوزه‌های کاری هم نشان می‌دهد.
        </p>
      </div>

      <form action={createTopicAction} className="space-y-4 border border-line bg-white p-5">
        <h2 className="text-lg font-extrabold">حوزه تازه</h2>
        {error ? <p className="text-sm">عنوان لازم است.</p> : null}
        <OfficeField label="عنوان" name="title">
          <input id="title" name="title" required className="field" placeholder="مثلاً خانواده" />
        </OfficeField>
        <OfficeField label="توضیح کوتاه (در فرم تماس)" name="summary">
          <input id="summary" name="summary" className="field" />
        </OfficeField>
        <OfficeField label="شرح کامل (صفحه حوزه‌های کاری)" name="body">
          <textarea id="body" name="body" rows={4} className="field resize-y" />
        </OfficeField>
        <div className="flex flex-wrap gap-5 text-sm font-bold">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="active" value="1" defaultChecked />
            فعال در فرم تماس
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="showOnSite" value="1" defaultChecked />
            نمایش در سایت
          </label>
        </div>
        <button type="submit" className="bg-navy px-4 py-3 text-sm font-bold text-white">
          افزودن حوزه
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState>حوزه‌ای ثبت نشده است.</EmptyState>
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold">حوزه‌های موجود</h2>
          <p className="text-sm font-light text-secondary">برای ویرایش، هر حوزه را باز کنید.</p>
          <div className="space-y-3">
            {rows.map((row) => (
              <details key={row.id} className="panel-details group border border-line bg-white">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold">{row.title}</p>
                      {row.active ? (
                        <span className="rounded-[0.3rem] bg-mist px-2 py-0.5 text-[0.65rem] font-bold text-navy">
                          فرم تماس
                        </span>
                      ) : null}
                      {row.showOnSite ? (
                        <span className="rounded-[0.3rem] bg-mist px-2 py-0.5 text-[0.65rem] font-bold text-navy">
                          سایت
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs font-light text-secondary">
                      ترتیب {row.sortOrder}
                      <span className="mx-2 text-line">·</span>
                      <span className="ltr-isolate" dir="ltr">
                        {row.slug}
                      </span>
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="panel-details-chevron shrink-0 text-secondary transition-transform duration-200"
                  >
                    ▾
                  </span>
                </summary>
                <form
                  action={updateTopicAction}
                  className="space-y-4 border-t border-line p-5"
                >
                  <input type="hidden" name="id" value={row.id} />
                  <div className="flex justify-end">
                    <button
                      formAction={deleteTopicAction}
                      type="submit"
                      className="text-xs font-bold text-secondary"
                    >
                      حذف
                    </button>
                  </div>
                  <OfficeField label="عنوان" name="title">
                    <input
                      id={`title-${row.id}`}
                      name="title"
                      required
                      className="field"
                      defaultValue={row.title}
                    />
                  </OfficeField>
                  <OfficeField label="توضیح کوتاه" name="summary">
                    <input
                      id={`summary-${row.id}`}
                      name="summary"
                      className="field"
                      defaultValue={row.summary}
                    />
                  </OfficeField>
                  <OfficeField label="شرح کامل" name="body">
                    <textarea
                      id={`body-${row.id}`}
                      name="body"
                      rows={4}
                      className="field resize-y"
                      defaultValue={row.body}
                    />
                  </OfficeField>
                  <OfficeField label="ترتیب" name="sortOrder">
                    <input
                      id={`sort-${row.id}`}
                      name="sortOrder"
                      type="number"
                      className="field ltr-isolate"
                      dir="ltr"
                      defaultValue={row.sortOrder}
                    />
                  </OfficeField>
                  <div className="flex flex-wrap gap-5 text-sm font-bold">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="active" value="1" defaultChecked={row.active} />
                      فعال در فرم تماس
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="showOnSite"
                        value="1"
                        defaultChecked={row.showOnSite}
                      />
                      نمایش در سایت
                    </label>
                  </div>
                  <button type="submit" className="border border-line px-4 py-2 text-sm font-bold">
                    ذخیره تغییرات
                  </button>
                </form>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
