import {
  deleteInquiryAction,
  inquiryAppointmentAction,
  inquiryCallbackAction,
  inquiryCloseAction,
  inquiryJunkAction,
  inquiryNoAnswerAction,
  saveInquiryNoteAction,
} from "@/app/app/actions";
import { DateTimePicker } from "@/components/office/date-time-picker";
import { EmptyState, OfficeField } from "@/components/office/ui";
import { listFormTopicsForContact, listInquiries, listInquiryNotesByIds, listJunkPhonesSet } from "@/db/queries";
import { getCurrentUser, requirePermission, userCan } from "@/lib/auth";
import { formatPersianDate } from "@/lib/format";
import { inquiryStatusLabel } from "@/lib/inquiries";

export const dynamic = "force-dynamic";
export const metadata = { title: "درخواست‌ها" };

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("office.requests.read");
  const user = await getCurrentUser();
  const { error } = await searchParams;
  const canUpdate = Boolean(user && userCan(user, "office.requests.update"));
  const canClose = Boolean(user && userCan(user, "office.requests.close"));
  const canDelete = Boolean(user && userCan(user, "office.requests.delete"));
  const canReminders = Boolean(user && userCan(user, "office.reminders.write"));
  const canTasks = Boolean(user && userCan(user, "office.tasks.write"));
  const canAppointments = Boolean(user && userCan(user, "office.appointments.write"));

  let rows: Awaited<ReturnType<typeof listInquiries>> = [];
  let matterLabel: Record<string, string> = {};
  let junkSet = new Set<string>();
  const notesByInquiry = new Map<string, { id: string; body: string; createdAt: Date }[]>();

  try {
    rows = await listInquiries();
    const topics = await listFormTopicsForContact();
    matterLabel = Object.fromEntries(topics.map((matter) => [matter.slug, matter.title]));
    junkSet = await listJunkPhonesSet(rows.map((row) => row.phone));
    const notes = await listInquiryNotesByIds(rows.map((row) => row.id));
    for (const note of notes) {
      const list = notesByInquiry.get(note.inquiryId) ?? [];
      list.push(note);
      notesByInquiry.set(note.inquiryId, list);
    }
  } catch {
    return <EmptyState>خواندن درخواست‌ها ممکن نشد. اتصال پایگاه داده را بررسی کنید.</EmptyState>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">درخواست‌های آنلاین</h1>
        <p className="mt-2 text-sm font-light text-secondary">
          تماس، یادداشت، نتیجه، یادآور، کار پیگیری و وقت ملاقات از همین‌جا.
        </p>
      </div>

      {error === "due" ? <p className="text-sm">برای عدم پاسخ، موعد یادآور لازم است.</p> : null}
      {error === "appointment" ? <p className="text-sm">تاریخ وقت ملاقات لازم است.</p> : null}

      {rows.length === 0 ? (
        <EmptyState>هنوز درخواستی ثبت نشده است.</EmptyState>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const isJunk = junkSet.has(row.phone);
            const notes = notesByInquiry.get(row.id) ?? [];
            return (
              <details key={row.id} className="panel-details group border border-line bg-white">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold">{row.fullName}</p>
                      <span className="rounded-[0.3rem] bg-mist px-2 py-0.5 text-[0.65rem] font-bold text-navy">
                        {inquiryStatusLabel(row.status)}
                      </span>
                      {isJunk ? (
                        <span className="rounded-[0.3rem] bg-rose-100 px-2 py-0.5 text-[0.65rem] font-bold text-rose-800">
                          کاربر هرز
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs font-light text-secondary">
                      {formatPersianDate(row.createdAt)}
                      <span className="mx-2 text-line">·</span>
                      {matterLabel[row.matter] ?? row.matter}
                      <span className="mx-2 text-line">·</span>
                      <span className="ltr-isolate" dir="ltr">
                        {row.phone}
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

                <div className="space-y-5 border-t border-line p-5">
                  {isJunk ? (
                    <p className="rounded-[0.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-900">
                      هشدار: این شماره قبلاً به‌عنوان تماس هرز ثبت شده است. در درخواست‌های بعدی همین علامت دیده می‌شود.
                    </p>
                  ) : null}

                  <div>
                    <p className="text-sm font-light leading-8">{row.message}</p>
                    {row.email ? (
                      <p className="ltr-isolate mt-2 text-xs font-light text-secondary" dir="ltr">
                        {row.email}
                      </p>
                    ) : null}
                    {row.conclusion ? (
                      <p className="mt-4 rounded-[0.4rem] bg-mist px-4 py-3 text-sm leading-7">
                        <span className="font-bold">نتیجه تماس: </span>
                        {row.conclusion}
                      </p>
                    ) : null}
                  </div>

                  {notes.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-extrabold">یادداشت‌ها</p>
                      <ul className="divide-y divide-line border border-line">
                        {notes.map((note) => (
                          <li key={note.id} className="px-4 py-3 text-sm font-light leading-7">
                            <p className="text-xs text-secondary">{formatPersianDate(note.createdAt)}</p>
                            <p className="mt-1">{note.body}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {canUpdate ? (
                    <form action={saveInquiryNoteAction} className="space-y-3 border border-line p-4">
                      <input type="hidden" name="id" value={row.id} />
                      <p className="text-sm font-extrabold">یادداشت و نتیجه تماس</p>
                      <OfficeField label="یادداشت" name="body">
                        <textarea id={`note-${row.id}`} name="body" rows={3} className="field resize-y" />
                      </OfficeField>
                      <OfficeField label="نتیجه تماس" name="conclusion">
                        <textarea
                          id={`conclusion-${row.id}`}
                          name="conclusion"
                          rows={2}
                          className="field resize-y"
                          defaultValue={row.conclusion}
                        />
                      </OfficeField>
                      <button type="submit" className="border border-line px-4 py-2 text-sm font-bold">
                        ذخیره یادداشت
                      </button>
                    </form>
                  ) : null}

                  <div className="grid gap-3 lg:grid-cols-2">
                    {canUpdate && canReminders ? (
                      <form action={inquiryNoAnswerAction} className="space-y-3 border border-line p-4">
                        <input type="hidden" name="id" value={row.id} />
                        <p className="text-sm font-extrabold">عدم پاسخ → یادآور</p>
                        <OfficeField label="یادداشت کوتاه" name="note">
                          <input id={`na-note-${row.id}`} name="note" className="field" />
                        </OfficeField>
                        <div>
                          <p className="mb-2 text-sm font-bold">موعد تماس مجدد</p>
                          <DateTimePicker name="dueAt" required aria-label="موعد تماس مجدد" />
                        </div>
                        <button type="submit" className="bg-navy px-4 py-2 text-sm font-bold text-white">
                          ثبت عدم پاسخ
                        </button>
                      </form>
                    ) : null}

                    {canUpdate ? (
                      <form action={inquiryJunkAction} className="space-y-3 border border-line p-4">
                        <input type="hidden" name="id" value={row.id} />
                        <p className="text-sm font-extrabold">تماس هرز</p>
                        <p className="text-xs font-light text-secondary">
                          شماره علامت می‌خورد؛ درخواست‌های بعدی همین کاربر هشدار می‌گیرند.
                        </p>
                        <OfficeField label="توضیح" name="note">
                          <input id={`junk-note-${row.id}`} name="note" className="field" />
                        </OfficeField>
                        <button type="submit" className="border border-line px-4 py-2 text-sm font-bold">
                          ثبت هرز
                        </button>
                      </form>
                    ) : null}

                    {canClose ? (
                      <form action={inquiryCloseAction} className="space-y-3 border border-line p-4">
                        <input type="hidden" name="id" value={row.id} />
                        <p className="text-sm font-extrabold">پاسخ داد → بستن</p>
                        <OfficeField label="یادداشت / نتیجه" name="note">
                          <textarea id={`close-note-${row.id}`} name="note" rows={2} className="field resize-y" />
                        </OfficeField>
                        <button type="submit" className="bg-navy px-4 py-2 text-sm font-bold text-white">
                          بستن درخواست
                        </button>
                      </form>
                    ) : null}

                    {canUpdate && canTasks ? (
                      <form action={inquiryCallbackAction} className="space-y-3 border border-line p-4">
                        <input type="hidden" name="id" value={row.id} />
                        <p className="text-sm font-extrabold">پیگیری لازم → کارها</p>
                        <OfficeField label="یادداشت" name="note">
                          <textarea id={`cb-note-${row.id}`} name="note" rows={2} className="field resize-y" />
                        </OfficeField>
                        <div>
                          <p className="mb-2 text-sm font-bold">موعد کار (اختیاری)</p>
                          <DateTimePicker name="dueAt" aria-label="موعد کار پیگیری" />
                        </div>
                        <button type="submit" className="bg-navy px-4 py-2 text-sm font-bold text-white">
                          ارسال به کارها
                        </button>
                      </form>
                    ) : null}

                    {canUpdate && canAppointments ? (
                      <form action={inquiryAppointmentAction} className="space-y-3 border border-line p-4">
                        <input type="hidden" name="id" value={row.id} />
                        <p className="text-sm font-extrabold">تعیین وقت → وقت‌ها</p>
                        <OfficeField label="یادداشت" name="note">
                          <input id={`ap-note-${row.id}`} name="note" className="field" />
                        </OfficeField>
                        <div>
                          <p className="mb-2 text-sm font-bold">تاریخ و ساعت ملاقات</p>
                          <DateTimePicker name="startsAt" required aria-label="وقت ملاقات" />
                        </div>
                        <button type="submit" className="bg-navy px-4 py-2 text-sm font-bold text-white">
                          ثبت وقت
                        </button>
                      </form>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                    {canClose && row.status !== "closed" ? (
                      <form action={inquiryCloseAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="note" value="بسته شد." />
                        <button type="submit" className="border border-line px-3 py-2 text-xs font-bold">
                          بستن سریع
                        </button>
                      </form>
                    ) : null}
                    {canDelete ? (
                      <form action={deleteInquiryAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <button type="submit" className="px-3 py-2 text-xs font-bold text-secondary">
                          حذف درخواست
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
