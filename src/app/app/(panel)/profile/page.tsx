import { updatePasswordAction, updateProfileAction } from "@/app/app/actions";
import { EmptyState, OfficeField } from "@/components/office/ui";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "پروفایل" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requirePermission("profile.self.view");
  const params = await searchParams;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">پروفایل</h1>
        <p className="mt-2 text-sm font-light text-secondary">
          نام و رمز عبور را می‌توانید تغییر دهید. شماره موبایل ثابت است.
        </p>
      </div>

      {params.saved === "1" ? <p className="text-sm font-bold">پروفایل ذخیره شد.</p> : null}
      {params.saved === "password" ? <p className="text-sm font-bold">رمز عبور عوض شد.</p> : null}
      {params.error === "name" ? <p className="text-sm">نام لازم است.</p> : null}
      {params.error === "password" ? <p className="text-sm">رمز تازه باید حداقل ۶ نویسه باشد.</p> : null}
      {params.error === "confirm" ? <p className="text-sm">تکرار رمز با رمز تازه یکی نیست.</p> : null}
      {params.error === "current" ? <p className="text-sm">رمز فعلی درست نیست.</p> : null}

      <form action={updateProfileAction} className="space-y-4 border border-line bg-white p-5">
        <h2 className="text-lg font-extrabold">اطلاعات حساب</h2>
        <OfficeField label="نقش" name="role">
          <input className="field" value={user.roleName} disabled readOnly />
        </OfficeField>
        <OfficeField label="موبایل (غیرقابل تغییر)" name="phone">
          <input
            className="field ltr-isolate"
            dir="ltr"
            value={user.phone}
            disabled
            readOnly
          />
        </OfficeField>
        <OfficeField label="نام" name="fullName">
          <input
            id="fullName"
            name="fullName"
            required
            className="field"
            defaultValue={user.fullName}
            disabled={!user.allAccess && !user.permissions.includes("profile.self.update")}
          />
        </OfficeField>
        {user.permissions.includes("profile.self.update") || user.allAccess ? (
          <button type="submit" className="bg-navy px-4 py-3 text-sm font-bold text-white">
            ذخیره نام
          </button>
        ) : (
          <EmptyState>اجازه ویرایش پروفایل ندارید.</EmptyState>
        )}
      </form>

      {user.permissions.includes("profile.password.update") || user.allAccess ? (
        <form action={updatePasswordAction} className="space-y-4 border border-line bg-white p-5">
          <h2 className="text-lg font-extrabold">تغییر رمز عبور</h2>
          <OfficeField label="رمز فعلی" name="currentPassword">
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              className="field"
            />
          </OfficeField>
          <OfficeField label="رمز تازه" name="newPassword">
            <input id="newPassword" name="newPassword" type="password" required className="field" />
          </OfficeField>
          <OfficeField label="تکرار رمز تازه" name="confirmPassword">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="field"
            />
          </OfficeField>
          <button type="submit" className="bg-navy px-4 py-3 text-sm font-bold text-white">
            ذخیره رمز
          </button>
        </form>
      ) : null}
    </div>
  );
}
