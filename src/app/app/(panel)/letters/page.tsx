import Link from "next/link";
import { removeLetterAction } from "@/app/app/actions";
import { EmptyState } from "@/components/office/ui";
import { listLetters } from "@/db/queries";
import { formatPersianDate } from "@/lib/format";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "نامه‌ها" };

export default async function LettersPage() {
  await requirePermission("office.letters.read");
  let rows: Awaited<ReturnType<typeof listLetters>> = [];
  try {
    rows = await listLetters();
  } catch {
    return <EmptyState>خواندن نامه‌ها ممکن نشد.</EmptyState>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">نامه‌ها</h1>
          <p className="mt-2 text-sm font-light text-secondary">
            نوشتن، ذخیره و چاپ روی A4 یا A5 با سربرگ دیجیتال یا کاغذ از پیش چاپ‌شده.
          </p>
        </div>
        <Link href="/app/letters/new" className="btn bg-navy px-4 py-3 text-sm font-bold text-white">
          نامه تازه
        </Link>
      </div>
      {rows.length === 0 ? (
        <EmptyState>نامه‌ای نیست.</EmptyState>
      ) : (
        <div className="divide-y divide-line border border-line bg-white">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
              <div>
                <Link href={`/app/letters/${row.id}`} className="text-lg font-bold">
                  {row.title}
                </Link>
                <p className="mt-1 text-xs font-light text-secondary">
                  {formatPersianDate(row.updatedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/app/letters/${row.id}/print`} className="btn border border-line px-3 py-2 text-xs font-bold">
                  چاپ
                </Link>
                <form action={removeLetterAction}>
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
