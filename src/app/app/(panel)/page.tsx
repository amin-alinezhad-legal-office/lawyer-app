import Link from "next/link";
import { dashboardCounts, listReminders } from "@/db/queries";
import { formatPersianDate } from "@/lib/format";
import { OfficeCard } from "@/components/office/ui";
import { getCurrentUser, requirePermission, userCan } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppHomePage({
  searchParams,
}: {
  searchParams: Promise<{ forbidden?: string }>;
}) {
  await requirePermission("office.dashboard.view");
  const user = await getCurrentUser();
  const { forbidden } = await searchParams;
  let counts = { inquiries: 0, cases: 0, reminders: 0, archive: 0, letters: 0 };
  let upcoming: Awaited<ReturnType<typeof listReminders>> = [];
  let dbReady = true;
  try {
    counts = await dashboardCounts();
    upcoming = (await listReminders()).filter((item) => !item.done).slice(0, 5);
  } catch {
    dbReady = false;
  }

  const tiles = [
    {
      href: "/app/requests",
      label: "درخواست‌های جدید",
      value: counts.inquiries,
      permission: "office.requests.read" as const,
    },
    {
      href: "/app/cases",
      label: "پرونده‌های باز",
      value: counts.cases,
      permission: "office.cases.read" as const,
    },
    {
      href: "/app/reminders",
      label: "یادآور باز",
      value: counts.reminders,
      permission: "office.reminders.read" as const,
    },
    {
      href: "/app/archive",
      label: "بایگانی",
      value: counts.archive,
      permission: "office.archive.read" as const,
    },
    {
      href: "/app/letters",
      label: "نامه‌ها",
      value: counts.letters,
      permission: "office.letters.read" as const,
    },
  ].filter((tile) => user && userCan(user, tile.permission));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">میز کار</h1>
        <p className="mt-2 text-sm font-light text-secondary">
          درخواست‌های آنلاین، پرونده‌ها، بایگانی، یادداشت و نامه‌ها در یک جا.
        </p>
      </div>

      {forbidden ? (
        <OfficeCard>
          <p className="text-sm font-light leading-7">برای این بخش دسترسی ندارید.</p>
        </OfficeCard>
      ) : null}

      {!dbReady || !process.env.DATABASE_URL ? (
        <OfficeCard>
          <p className="text-sm font-light leading-7">
            برای فعال شدن دفتر، `DATABASE_URL` را به Neon وصل کنید و جداول را با `npm run db:push` بسازید.
            برای آپلود فایل بایگانی هم `BLOB_READ_WRITE_TOKEN` لازم است.
          </p>
        </OfficeCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="border border-line bg-white p-5">
            <p className="text-3xl font-extrabold">{tile.value}</p>
            <p className="mt-2 text-sm font-bold">{tile.label}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">یادآورهای نزدیک</h2>
          {user && userCan(user, "office.reminders.read") ? (
            <Link href="/app/reminders" className="text-sm font-bold">
              همه
            </Link>
          ) : null}
        </div>
        {upcoming.length === 0 || !(user && userCan(user, "office.reminders.read")) ? (
          <p className="text-sm font-light text-secondary">یادآور بازی نیست.</p>
        ) : (
          <div className="divide-y divide-line border border-line bg-white">
            {upcoming.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-bold">{item.title}</p>
                  <p className="mt-1 text-xs font-light text-secondary">
                    {formatPersianDate(item.dueAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
