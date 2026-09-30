import {
  createAboutSectionAction,
  deleteAboutSectionAction,
  updateAboutMetaAction,
  updateAboutSectionAction,
} from "@/app/app/actions";
import { EmptyState, OfficeField } from "@/components/office/ui";
import { getAboutForAdmin } from "@/db/queries";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "درباره" };

export default async function AboutAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermission("site.about.read");
  const { error } = await searchParams;
  let data: Awaited<ReturnType<typeof getAboutForAdmin>>;
  try {
    data = await getAboutForAdmin();
  } catch {
    return (
      <EmptyState>
        خواندن صفحه درباره ممکن نشد. ابتدا `DATABASE_URL` را وصل کنید و `npm run db:push` را بزنید.
      </EmptyState>
    );
  }

  const { page, sections } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">درباره</h1>
        <p className="mt-2 text-sm font-light text-secondary">
          مدیریت صفحه درباره در سایت. سربرگ بالا و بخش‌های متن جداگانه ویرایش می‌شوند. اگر عنوان بخش خالی
          باشد، فقط پاراگراف نمایش داده می‌شود.
        </p>
      </div>

      {error ? <p className="text-sm">عنوان و متن بخش لازم است.</p> : null}

      <details className="panel-details group border border-line bg-white">
        <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="font-extrabold">سربرگ صفحه</p>
            <p className="mt-1 truncate text-xs font-light text-secondary">{page.title}</p>
          </div>
          <span
            aria-hidden
            className="panel-details-chevron shrink-0 text-secondary transition-transform duration-200"
          >
            ▾
          </span>
        </summary>
        <form action={updateAboutMetaAction} className="space-y-4 border-t border-line p-5">
          <OfficeField label="بالانویس" name="kicker">
            <input id="kicker" name="kicker" className="field" defaultValue={page.kicker} />
          </OfficeField>
          <OfficeField label="عنوان" name="title">
            <input id="title" name="title" required className="field" defaultValue={page.title} />
          </OfficeField>
          <OfficeField label="خلاصه زیر عنوان" name="lede">
            <textarea id="lede" name="lede" rows={3} className="field resize-y" defaultValue={page.lede} />
          </OfficeField>
          <OfficeField label="متن لینک تماس" name="ctaLabel">
            <input id="ctaLabel" name="ctaLabel" className="field" defaultValue={page.ctaLabel} />
          </OfficeField>
          <OfficeField label="آدرس لینک تماس" name="ctaHref">
            <input
              id="ctaHref"
              name="ctaHref"
              className="field ltr-isolate"
              dir="ltr"
              defaultValue={page.ctaHref}
            />
          </OfficeField>
          <button type="submit" className="bg-navy px-4 py-3 text-sm font-bold text-white">
            ذخیره سربرگ
          </button>
        </form>
      </details>

      <form action={createAboutSectionAction} className="space-y-4 border border-line bg-white p-5">
        <h2 className="text-lg font-extrabold">بخش تازه</h2>
        <OfficeField label="عنوان بخش (اختیاری)" name="title">
          <input id="section-title" name="title" className="field" placeholder="مثلاً شیوه کار" />
        </OfficeField>
        <OfficeField label="متن" name="body">
          <textarea
            id="section-body"
            name="body"
            rows={5}
            required
            className="field resize-y"
            placeholder="پاراگراف‌ها را با خط خالی از هم جدا کنید."
          />
        </OfficeField>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="active" value="1" defaultChecked />
          نمایش در سایت
        </label>
        <button type="submit" className="bg-navy px-4 py-3 text-sm font-bold text-white">
          افزودن بخش
        </button>
      </form>

      {sections.length === 0 ? (
        <EmptyState>بخشی ثبت نشده است.</EmptyState>
      ) : (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold">بخش‌های موجود</h2>
          <p className="text-sm font-light text-secondary">برای ویرایش، هر بخش را باز کنید.</p>
          <div className="space-y-3">
            {sections.map((row) => (
              <details key={row.id} className="panel-details group border border-line bg-white">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold">{row.title || "بدون عنوان"}</p>
                      <span
                        className={`rounded-[0.3rem] px-2 py-0.5 text-[0.65rem] font-bold ${
                          row.active ? "bg-mist text-navy" : "bg-line/40 text-secondary"
                        }`}
                      >
                        {row.active ? "نمایش در سایت" : "مخفی"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs font-light text-secondary">
                      ترتیب {row.sortOrder}
                      <span className="mx-2 text-line">·</span>
                      {row.body.slice(0, 72)}
                      {row.body.length > 72 ? "…" : ""}
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
                  action={updateAboutSectionAction}
                  className="space-y-4 border-t border-line p-5"
                >
                  <input type="hidden" name="id" value={row.id} />
                  <div className="flex justify-end">
                    <button
                      formAction={deleteAboutSectionAction}
                      type="submit"
                      className="text-xs font-bold text-secondary"
                    >
                      حذف
                    </button>
                  </div>
                  <OfficeField label="عنوان بخش (اختیاری)" name="title">
                    <input
                      id={`title-${row.id}`}
                      name="title"
                      className="field"
                      defaultValue={row.title}
                    />
                  </OfficeField>
                  <OfficeField label="متن" name="body">
                    <textarea
                      id={`body-${row.id}`}
                      name="body"
                      rows={5}
                      required
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
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input type="checkbox" name="active" value="1" defaultChecked={row.active} />
                    نمایش در سایت
                  </label>
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
