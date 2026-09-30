import { createUserAction, updateUserAction } from "@/app/app/actions";
import { EmptyState, OfficeField } from "@/components/office/ui";
import { listRoles, listUsersWithRoles } from "@/db/rbac";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "کاربران" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requirePermission("site.users.read");
  const canWrite = user.allAccess || user.permissions.includes("site.users.write");
  const { error } = await searchParams;

  let rows: Awaited<ReturnType<typeof listUsersWithRoles>> = [];
  let roleRows: Awaited<ReturnType<typeof listRoles>> = [];
  try {
    rows = await listUsersWithRoles();
    roleRows = await listRoles();
  } catch {
    return (
      <EmptyState>
        خواندن کاربران ممکن نشد. `DATABASE_URL` را وصل کنید و `npm run db:push` را بزنید.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">کاربران</h1>
        <p className="mt-2 text-sm font-light text-secondary">
          ساخت حساب برای وکیل، منشی، کارآموز یا ادمین. شماره موبایل شناسه ورود است و بعداً عوض نمی‌شود.
        </p>
      </div>

      {error === "1" ? <p className="text-sm">همه فیلدها لازم است.</p> : null}
      {error === "dup" ? <p className="text-sm">این شماره قبلاً ثبت شده است.</p> : null}

      {canWrite ? (
        <form action={createUserAction} className="space-y-4 border border-line bg-white p-5">
          <h2 className="text-lg font-extrabold">کاربر تازه</h2>
          <OfficeField label="نام" name="fullName">
            <input id="fullName" name="fullName" required className="field" />
          </OfficeField>
          <OfficeField label="موبایل" name="phone">
            <input id="phone" name="phone" required className="field ltr-isolate" dir="ltr" />
          </OfficeField>
          <OfficeField label="رمز اولیه" name="password">
            <input id="password" name="password" type="password" required className="field" />
          </OfficeField>
          <OfficeField label="نقش" name="roleId">
            <select id="roleId" name="roleId" required className="field">
              {roleRows.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </OfficeField>
          <button type="submit" className="bg-navy px-4 py-3 text-sm font-bold text-white">
            افزودن کاربر
          </button>
        </form>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState>کاربری نیست.</EmptyState>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <form
              key={row.id}
              action={updateUserAction}
              className="space-y-4 border border-line bg-white p-5"
            >
              <input type="hidden" name="id" value={row.id} />
              <p className="text-xs font-light text-secondary ltr-isolate" dir="ltr">
                {row.phone}
              </p>
              <OfficeField label="نام" name="fullName">
                <input
                  id={`name-${row.id}`}
                  name="fullName"
                  required
                  className="field"
                  defaultValue={row.fullName}
                  disabled={!canWrite}
                />
              </OfficeField>
              <OfficeField label="نقش" name="roleId">
                <select
                  id={`role-${row.id}`}
                  name="roleId"
                  required
                  className="field"
                  defaultValue={row.roleId}
                  disabled={!canWrite}
                >
                  {roleRows.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </OfficeField>
              {canWrite ? (
                <OfficeField label="رمز تازه (اختیاری)" name="password">
                  <input
                    id={`pass-${row.id}`}
                    name="password"
                    type="password"
                    className="field"
                    placeholder="خالی بگذارید اگر عوض نمی‌شود"
                  />
                </OfficeField>
              ) : null}
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  name="active"
                  value="1"
                  defaultChecked={row.active}
                  disabled={!canWrite}
                />
                فعال
              </label>
              {canWrite ? (
                <button type="submit" className="border border-line px-4 py-2 text-sm font-bold">
                  ذخیره
                </button>
              ) : null}
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
