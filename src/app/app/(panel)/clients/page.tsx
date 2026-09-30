import {
  createClientAction,
  deleteClientAction,
  updateClientAction,
} from "@/app/app/actions";
import { EmptyState, OfficeField } from "@/components/office/ui";
import { listAppointmentsForClient, listClients } from "@/db/queries";
import { getCurrentUser, requirePermission, userCan } from "@/lib/auth";
import { formatPersianDate } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "موکلان" };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("office.clients.read");
  const user = await getCurrentUser();
  const canWrite = Boolean(user && userCan(user, "office.clients.write"));
  const { error } = await searchParams;

  let rows: Awaited<ReturnType<typeof listClients>> = [];
  const appointmentCounts = new Map<string, number>();

  try {
    rows = await listClients();
    for (const client of rows) {
      const sessions = await listAppointmentsForClient(client.id);
      appointmentCounts.set(client.id, sessions.length);
    }
  } catch {
    return (
      <EmptyState>
        خواندن موکلان ممکن نشد. `DATABASE_URL` را وصل کنید و `npm run db:push` را بزنید.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">موکلان</h1>
        <p className="mt-2 text-sm font-light text-secondary">
          هر جلسه ملاقات باید به یکی از موکلان وصل شود. صورت جلسه روی همان جلسه ثبت می‌شود.
        </p>
      </div>

      {error === "1" ? <p className="text-sm">نام و موبایل لازم است.</p> : null}
      {error === "dup" ? <p className="text-sm">این شماره قبلاً برای موکل دیگری ثبت شده است.</p> : null}
      {error === "linked" ? (
        <p className="text-sm">موکلی که جلسه دارد را نمی‌توان حذف کرد.</p>
      ) : null}

      {canWrite ? (
        <form action={createClientAction} className="space-y-4 border border-line bg-white p-5">
          <h2 className="text-lg font-extrabold">موکل تازه</h2>
          <OfficeField label="نام" name="fullName">
            <input id="fullName" name="fullName" required className="field" />
          </OfficeField>
          <OfficeField label="موبایل" name="phone">
            <input id="phone" name="phone" required className="field ltr-isolate" dir="ltr" />
          </OfficeField>
          <OfficeField label="ایمیل" name="email">
            <input id="email" name="email" type="email" className="field ltr-isolate" dir="ltr" />
          </OfficeField>
          <OfficeField label="یادداشت" name="notes">
            <textarea id="notes" name="notes" rows={3} className="field resize-y" />
          </OfficeField>
          <button type="submit" className="bg-navy px-4 py-3 text-sm font-bold text-white">
            افزودن موکل
          </button>
        </form>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState>موکلی ثبت نشده است.</EmptyState>
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold">فهرست موکلان</h2>
          <div className="space-y-3">
            {rows.map((row) => {
              const sessionCount = appointmentCounts.get(row.id) ?? 0;
              return (
                <details key={row.id} className="panel-details group border border-line bg-white">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-extrabold">{row.fullName}</p>
                      <p className="mt-1 text-xs font-light text-secondary">
                        <span className="ltr-isolate" dir="ltr">
                          {row.phone}
                        </span>
                        <span className="mx-2 text-line">·</span>
                        {sessionCount} جلسه
                      </p>
                    </div>
                    <span
                      aria-hidden
                      className="panel-details-chevron shrink-0 text-secondary transition-transform duration-200"
                    >
                      ▾
                    </span>
                  </summary>
                  <div className="space-y-4 border-t border-line p-5">
                    {row.notes ? (
                      <p className="text-sm font-light leading-7">{row.notes}</p>
                    ) : null}
                    <p className="text-xs font-light text-secondary">
                      ثبت از {formatPersianDate(row.createdAt)}
                      {sessionCount > 0 ? (
                        <>
                          <span className="mx-2 text-line">·</span>
                          <Link href="/app/appointments" className="font-bold text-navy">
                            مشاهده وقت‌ها
                          </Link>
                        </>
                      ) : null}
                    </p>
                    {canWrite ? (
                      <form action={updateClientAction} className="space-y-4">
                        <input type="hidden" name="id" value={row.id} />
                        <OfficeField label="نام" name="fullName">
                          <input
                            id={`name-${row.id}`}
                            name="fullName"
                            required
                            className="field"
                            defaultValue={row.fullName}
                          />
                        </OfficeField>
                        <OfficeField label="موبایل (ثابت)" name="phone">
                          <input
                            className="field ltr-isolate"
                            dir="ltr"
                            value={row.phone}
                            disabled
                            readOnly
                          />
                        </OfficeField>
                        <OfficeField label="ایمیل" name="email">
                          <input
                            id={`email-${row.id}`}
                            name="email"
                            type="email"
                            className="field ltr-isolate"
                            dir="ltr"
                            defaultValue={row.email ?? ""}
                          />
                        </OfficeField>
                        <OfficeField label="یادداشت" name="notes">
                          <textarea
                            id={`notes-${row.id}`}
                            name="notes"
                            rows={3}
                            className="field resize-y"
                            defaultValue={row.notes}
                          />
                        </OfficeField>
                        <div className="flex flex-wrap gap-2">
                          <button type="submit" className="border border-line px-4 py-2 text-sm font-bold">
                            ذخیره
                          </button>
                          <button
                            formAction={deleteClientAction}
                            type="submit"
                            className="px-4 py-2 text-sm font-bold text-secondary"
                          >
                            حذف
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
