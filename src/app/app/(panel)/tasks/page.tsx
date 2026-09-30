import { createTaskAction, removeTaskAction, toggleTaskAction } from "@/app/app/actions";
import { DateTimePicker } from "@/components/office/date-time-picker";
import { EmptyState, OfficeField } from "@/components/office/ui";
import { listOfficeTasks } from "@/db/queries";
import { getCurrentUser, requirePermission, userCan } from "@/lib/auth";
import { formatPersianDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "کارها" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("office.tasks.read");
  const user = await getCurrentUser();
  const canWrite = Boolean(user && userCan(user, "office.tasks.write"));
  const { error } = await searchParams;

  let rows: Awaited<ReturnType<typeof listOfficeTasks>> = [];
  try {
    rows = await listOfficeTasks();
  } catch {
    return <EmptyState>خواندن کارها ممکن نشد.</EmptyState>;
  }

  const open = rows.filter((row) => row.status !== "done");
  const done = rows.filter((row) => row.status === "done");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">کارها</h1>
        <p className="mt-2 text-sm font-light text-secondary">
          پیگیری‌هایی که از درخواست‌ها یا مستقیم ساخته می‌شوند.
        </p>
      </div>

      {error ? <p className="text-sm">عنوان کار لازم است.</p> : null}

      {canWrite ? (
        <form action={createTaskAction} className="space-y-4 border border-line bg-white p-5">
          <h2 className="text-lg font-extrabold">کار تازه</h2>
          <OfficeField label="عنوان" name="title">
            <input id="title" name="title" required className="field" />
          </OfficeField>
          <OfficeField label="توضیح" name="body">
            <textarea id="body" name="body" rows={3} className="field resize-y" />
          </OfficeField>
          <div>
            <p className="mb-2 text-sm font-bold">موعد (اختیاری)</p>
            <DateTimePicker name="dueAt" aria-label="موعد کار" />
          </div>
          <button type="submit" className="bg-navy px-4 py-3 text-sm font-bold text-white">
            افزودن کار
          </button>
        </form>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">باز</h2>
        {open.length === 0 ? (
          <EmptyState>کار بازی نیست.</EmptyState>
        ) : (
          open.map((row) => (
            <article key={row.id} className="flex flex-wrap items-start justify-between gap-4 border border-line bg-white px-5 py-4">
              <div>
                <p className="font-extrabold">{row.title}</p>
                {row.body ? <p className="mt-2 text-sm font-light leading-7">{row.body}</p> : null}
                {row.dueAt ? (
                  <p className="mt-2 text-xs font-light text-secondary">موعد: {formatPersianDate(row.dueAt)}</p>
                ) : null}
              </div>
              {canWrite ? (
                <div className="flex gap-2">
                  <form action={toggleTaskAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="done" value="1" />
                    <button type="submit" className="border border-line px-3 py-2 text-xs font-bold">
                      انجام شد
                    </button>
                  </form>
                  <form action={removeTaskAction}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit" className="px-3 py-2 text-xs font-bold text-secondary">
                      حذف
                    </button>
                  </form>
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>

      {done.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold">انجام‌شده</h2>
          {done.map((row) => (
            <article key={row.id} className="border border-line bg-white px-5 py-4 opacity-70">
              <p className="font-bold">{row.title}</p>
              {canWrite ? (
                <form action={toggleTaskAction} className="mt-3">
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="done" value="0" />
                  <button type="submit" className="text-xs font-bold text-secondary">
                    باز کردن دوباره
                  </button>
                </form>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
