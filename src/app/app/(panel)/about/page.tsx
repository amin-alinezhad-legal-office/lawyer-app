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

      <form action={updateAboutMetaAction} className="space-y-4 border border-line bg-white p-5">
        <h2 className="text-lg font-extrabold">سربرگ صفحه</h2>
        {error ? <p className="text-sm">عنوان و متن بخش لازم است.</p> : null}
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
        <div className="space-y-4">
          {sections.map((row) => (
            <form
              key={row.id}
              action={updateAboutSectionAction}
              className="space-y-4 border border-line bg-white p-5"
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
          ))}
        </div>
      )}
    </div>
  );
}
