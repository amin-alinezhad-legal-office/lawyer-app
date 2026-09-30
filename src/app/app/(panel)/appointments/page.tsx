import {
  createAppointmentAction,
  removeAppointmentAction,
  setAppointmentStatusAction,
  updateAppointmentMinutesAction,
} from "@/app/app/actions";
import { DateTimePicker } from "@/components/office/date-time-picker";
import { OfficeSelect } from "@/components/office/office-select";
import { EmptyState, OfficeField } from "@/components/office/ui";
import { listAppointments, listClients } from "@/db/queries";
import { getCurrentUser, requirePermission, userCan } from "@/lib/auth";
import { formatPersianDate } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "وقت‌ها" };

const statusLabel: Record<string, string> = {
  scheduled: "برنامه",
  done: "انجام‌شده",
  cancelled: "لغو",
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("office.appointments.read");
  const user = await getCurrentUser();
  const canWrite = Boolean(user && userCan(user, "office.appointments.write"));
  const { error } = await searchParams;

  let rows: Awaited<ReturnType<typeof listAppointments>> = [];
  let clientRows: Awaited<ReturnType<typeof listClients>> = [];
  try {
    rows = await listAppointments();
    clientRows = await listClients();
  } catch {
    return <EmptyState>خواندن وقت‌ها ممکن نشد. جداول موکلان و وقت‌ها را با `npm run db:push` بسازید.</EmptyState>;
  }

  const clientOptions = clientRows.map((client) => ({
    value: client.id,
    label: client.fullName,
    hint: client.phone,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">وقت‌های ملاقات</h1>
        <p className="mt-2 text-sm font-light text-secondary">
          هر جلسه باید به یک موکل وصل باشد و صورت‌جلسه‌اش جداگانه نوشته می‌شود.
        </p>
      </div>

      {error === "1" ? <p className="text-sm">عنوان، موکل و تاریخ وقت لازم است.</p> : null}

      {canWrite ? (
        <form action={createAppointmentAction} className="space-y-4 border border-line bg-white p-5">
          <h2 className="text-lg font-extrabold">جلسه تازه</h2>
          {clientRows.length === 0 ? (
            <p className="text-sm font-light leading-7 text-secondary">
              هنوز موکلی نیست. ابتدا از{" "}
              <Link href="/app/clients" className="font-bold text-navy">
                موکلان
              </Link>{" "}
              یک موکل بسازید، یا از درخواست‌ها وقت ثبت کنید تا موکل خودکار ساخته شود.
            </p>
          ) : (
            <>
              <OfficeField label="عنوان جلسه" name="title">
                <input id="title" name="title" required className="field" />
              </OfficeField>
              <div>
                <p className="mb-2 text-sm font-bold">موکل</p>
                <OfficeSelect
                  name="clientId"
                  required
                  options={clientOptions}
                  placeholder="انتخاب موکل"
                  aria-label="موکل"
                />
              </div>
              <OfficeField label="یادداشت جلسه" name="body">
                <textarea id="body" name="body" rows={3} className="field resize-y" />
              </OfficeField>
              <OfficeField label="صورت جلسه (اختیاری در ابتدا)" name="minutes">
                <textarea
                  id="minutes"
                  name="minutes"
                  rows={4}
                  className="field resize-y"
                  placeholder="بعد از جلسه تکمیل کنید…"
                />
              </OfficeField>
              <div>
                <p className="mb-2 text-sm font-bold">تاریخ و ساعت</p>
                <DateTimePicker name="startsAt" required aria-label="وقت ملاقات" />
              </div>
              <button type="submit" className="bg-navy px-4 py-3 text-sm font-bold text-white">
                ثبت جلسه
              </button>
            </>
          )}
        </form>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState>جلسه‌ای ثبت نشده است.</EmptyState>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <details key={row.id} className="panel-details group border border-line bg-white">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold">{row.title}</p>
                    <span className="rounded-[0.3rem] bg-mist px-2 py-0.5 text-[0.65rem] font-bold text-navy">
                      {statusLabel[row.status] ?? row.status}
                    </span>
                    {row.minutes ? (
                      <span className="rounded-[0.3rem] bg-mist px-2 py-0.5 text-[0.65rem] font-bold text-navy">
                        صورت جلسه دارد
                      </span>
                    ) : (
                      <span className="rounded-[0.3rem] bg-line/40 px-2 py-0.5 text-[0.65rem] font-bold text-secondary">
                        بدون صورت جلسه
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-light text-secondary">
                    {formatPersianDate(row.startsAt)}
                    <span className="mx-2 text-line">·</span>
                    موکل: {row.clientFullName || row.clientName}
                    {row.clientPhone ? (
                      <>
                        <span className="mx-2 text-line">·</span>
                        <span className="ltr-isolate" dir="ltr">
                          {row.clientPhone}
                        </span>
                      </>
                    ) : null}
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
                {row.body ? (
                  <p className="text-sm font-light leading-7">
                    <span className="font-bold">یادداشت: </span>
                    {row.body}
                  </p>
                ) : null}

                {canWrite ? (
                  <form action={updateAppointmentMinutesAction} className="space-y-4">
                    <input type="hidden" name="id" value={row.id} />
                    <OfficeField label="عنوان جلسه" name="title">
                      <input
                        id={`title-${row.id}`}
                        name="title"
                        required
                        className="field"
                        defaultValue={row.title}
                      />
                    </OfficeField>
                    <div>
                      <p className="mb-2 text-sm font-bold">موکل</p>
                      <OfficeSelect
                        name="clientId"
                        required
                        options={clientOptions}
                        defaultValue={row.clientId}
                        placeholder="انتخاب موکل"
                        aria-label="موکل"
                      />
                    </div>
                    <OfficeField label="یادداشت جلسه" name="body">
                      <textarea
                        id={`body-${row.id}`}
                        name="body"
                        rows={2}
                        className="field resize-y"
                        defaultValue={row.body}
                      />
                    </OfficeField>
                    <OfficeField label="صورت جلسه" name="minutes">
                      <textarea
                        id={`minutes-${row.id}`}
                        name="minutes"
                        rows={6}
                        className="field resize-y"
                        defaultValue={row.minutes}
                        placeholder="شرح مذاکرات، توافق‌ها و تصمیم‌های جلسه…"
                      />
                    </OfficeField>
                    <button type="submit" className="bg-navy px-4 py-2 text-sm font-bold text-white">
                      ذخیره صورت جلسه
                    </button>
                  </form>
                ) : row.minutes ? (
                  <div className="rounded-[0.4rem] bg-mist px-4 py-4 text-sm leading-7">
                    <p className="font-extrabold">صورت جلسه</p>
                    <p className="mt-2 whitespace-pre-wrap font-light">{row.minutes}</p>
                  </div>
                ) : (
                  <p className="text-sm font-light text-secondary">صورت جلسه‌ای ثبت نشده است.</p>
                )}

                {canWrite ? (
                  <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                    <form action={setAppointmentStatusAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="status" value="done" />
                      <button type="submit" className="border border-line px-3 py-2 text-xs font-bold">
                        انجام شد
                      </button>
                    </form>
                    <form action={setAppointmentStatusAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="status" value="cancelled" />
                      <button type="submit" className="border border-line px-3 py-2 text-xs font-bold">
                        لغو
                      </button>
                    </form>
                    <form action={setAppointmentStatusAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="status" value="scheduled" />
                      <button type="submit" className="border border-line px-3 py-2 text-xs font-bold">
                        بازگردانی به برنامه
                      </button>
                    </form>
                    <form action={removeAppointmentAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <button type="submit" className="px-3 py-2 text-xs font-bold text-secondary">
                        حذف
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
