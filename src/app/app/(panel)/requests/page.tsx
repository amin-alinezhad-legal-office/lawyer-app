import { markInquiry } from "@/app/app/actions";
import { EmptyState } from "@/components/office/ui";
import { listInquiries, listFormTopicsForContact } from "@/db/queries";
import { formatPersianDate } from "@/lib/format";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "درخواست‌ها" };

export default async function RequestsPage() {
  await requirePermission("office.requests.read");
  let rows: Awaited<ReturnType<typeof listInquiries>> = [];
  let matterLabel: Record<string, string> = {};
  try {
    rows = await listInquiries();
    const topics = await listFormTopicsForContact();
    matterLabel = Object.fromEntries(topics.map((matter) => [matter.slug, matter.title]));
  } catch {
    return <EmptyState>خواندن درخواست‌ها ممکن نشد. اتصال پایگاه داده را بررسی کنید.</EmptyState>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">درخواست‌های آنلاین</h1>
        <p className="mt-2 text-sm font-light text-secondary">فرم‌هایی که از وب‌سایت ارسال شده‌اند.</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState>هنوز درخواستی ثبت نشده است.</EmptyState>
      ) : (
        <div className="divide-y divide-line border border-line bg-white">
          {rows.map((row) => (
            <article key={row.id} className="grid gap-4 px-5 py-6 md:grid-cols-[11rem_1fr_auto]">
              <div className="text-sm font-light text-secondary">
                <p>{formatPersianDate(row.createdAt)}</p>
                <p className="mt-2 text-navy">{matterLabel[row.matter] ?? row.matter}</p>
                <p className="mt-2 text-xs">{row.status === "new" ? "جدید" : row.status === "read" ? "خوانده‌شده" : "بایگانی"}</p>
              </div>
              <div>
                <h2 className="text-xl font-bold">{row.fullName}</h2>
                <p className="ltr-isolate mt-2 text-sm" dir="ltr">
                  {row.phone}
                  {row.email ? ` · ${row.email}` : ""}
                </p>
                <p className="mt-4 font-light leading-8">{row.message}</p>
              </div>
              <div className="flex flex-col gap-2">
                <form action={markInquiry}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="status" value="read" />
                  <button type="submit" className="w-full border border-line px-3 py-2 text-xs font-bold">
                    خوانده شد
                  </button>
                </form>
                <form action={markInquiry}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="status" value="archived" />
                  <button type="submit" className="w-full border border-line px-3 py-2 text-xs font-bold">
                    بایگانی
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
