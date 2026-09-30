import { createRoleAction, deleteRoleAction, updateRoleAction } from "@/app/app/actions";
import { EmptyState, OfficeField } from "@/components/office/ui";
import { getRolePermissionKeys, listPermissions, listRoles } from "@/db/rbac";
import { requirePermission } from "@/lib/auth";
import { PERMISSION_DIVISIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "نقش‌ها" };

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requirePermission("site.roles.read");
  const canWrite = user.allAccess || user.permissions.includes("site.roles.write");
  const { error } = await searchParams;

  let roleRows: Awaited<ReturnType<typeof listRoles>> = [];
  let permRows: Awaited<ReturnType<typeof listPermissions>> = [];
  const rolePerms = new Map<string, string[]>();

  try {
    roleRows = await listRoles();
    permRows = await listPermissions();
    for (const role of roleRows) {
      rolePerms.set(role.id, await getRolePermissionKeys(role.id));
    }
  } catch {
    return (
      <EmptyState>
        خواندن نقش‌ها ممکن نشد. `DATABASE_URL` را وصل کنید و `npm run db:push` را بزنید.
      </EmptyState>
    );
  }

  const systemRoles = roleRows.filter((role) => role.isSystem);
  const customRoles = roleRows.filter((role) => !role.isSystem);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">نقش‌ها و دسترسی‌ها</h1>
        <p className="mt-2 text-sm font-light text-secondary">
          دسترسی‌ها سه‌بخشی‌اند؛ مثلاً <span className="ltr-isolate" dir="ltr">profile.password.update</span>.
          سه حوزه: پروفایل، دفتر کار، سایت و مدیریت.
        </p>
      </div>

      {error === "1" ? <p className="text-sm">نام نقش لازم است.</p> : null}
      {error === "dup" ? <p className="text-sm">این نقش قبلاً هست.</p> : null}
      {error === "delete" ? (
        <p className="text-sm">نقش سیستمی یا نقش دارای کاربر را نمی‌توان حذف کرد.</p>
      ) : null}

      {canWrite ? (
        <form action={createRoleAction} className="space-y-4 border border-line bg-white p-5">
          <h2 className="text-lg font-extrabold">نقش تازه</h2>
          <OfficeField label="نام" name="name">
            <input id="name" name="name" required className="field" placeholder="مثلاً مشاور" />
          </OfficeField>
          <OfficeField label="شناسه لاتین (اختیاری)" name="slug">
            <input id="slug" name="slug" className="field ltr-isolate" dir="ltr" placeholder="advisor" />
          </OfficeField>
          <OfficeField label="توضیح" name="description">
            <textarea id="description" name="description" rows={2} className="field resize-y" />
          </OfficeField>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" name="allAccess" value="1" />
            دسترسی کامل (مثل ادمین و وکیل)
          </label>
          <PermissionPicker permissions={permRows} />
          <button type="submit" className="bg-navy px-4 py-3 text-sm font-bold text-white">
            افزودن نقش
          </button>
        </form>
      ) : null}

      {customRoles.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-extrabold">نقش‌های سفارشی</h2>
          {customRoles.map((role) => (
            <RoleEditor
              key={role.id}
              role={role}
              permissions={permRows}
              selected={new Set(rolePerms.get(role.id) ?? [])}
              canWrite={canWrite}
            />
          ))}
        </section>
      ) : null}

      {systemRoles.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold">نقش‌های از پیش تعریف‌شده</h2>
          <p className="text-sm font-light text-secondary">برای ویرایش، هر مورد را باز کنید.</p>
          <div className="space-y-3">
            {systemRoles.map((role) => (
              <details key={role.id} className="panel-details group border border-line bg-white">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-extrabold">{role.name}</p>
                    <p className="mt-1 truncate text-xs font-light text-secondary ltr-isolate" dir="ltr">
                      {role.slug} · سیستمی
                      {role.allAccess ? " · دسترسی کامل" : ""}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="panel-details-chevron shrink-0 text-secondary transition-transform duration-200"
                  >
                    ▾
                  </span>
                </summary>
                <div className="border-t border-line p-5">
                  <RoleEditor
                    role={role}
                    permissions={permRows}
                    selected={new Set(rolePerms.get(role.id) ?? [])}
                    canWrite={canWrite}
                    bare
                  />
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function RoleEditor({
  role,
  permissions,
  selected,
  canWrite,
  bare = false,
}: {
  role: {
    id: string;
    slug: string;
    name: string;
    description: string;
    allAccess: boolean;
    isSystem: boolean;
  };
  permissions: { id: string; key: string; label: string; division: string }[];
  selected: Set<string>;
  canWrite: boolean;
  bare?: boolean;
}) {
  return (
    <form
      action={updateRoleAction}
      className={bare ? "space-y-4" : "space-y-4 border border-line bg-white p-5"}
    >
      <input type="hidden" name="id" value={role.id} />
      {!bare ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-light text-secondary ltr-isolate" dir="ltr">
            {role.slug}
          </p>
          {canWrite && !role.isSystem ? (
            <button formAction={deleteRoleAction} type="submit" className="text-xs font-bold text-secondary">
              حذف
            </button>
          ) : null}
        </div>
      ) : canWrite && !role.isSystem ? (
        <div className="flex justify-end">
          <button formAction={deleteRoleAction} type="submit" className="text-xs font-bold text-secondary">
            حذف
          </button>
        </div>
      ) : null}
      <OfficeField label="نام" name="name">
        <input
          id={`name-${role.id}`}
          name="name"
          required
          className="field"
          defaultValue={role.name}
          disabled={!canWrite}
        />
      </OfficeField>
      <OfficeField label="توضیح" name="description">
        <textarea
          id={`desc-${role.id}`}
          name="description"
          rows={2}
          className="field resize-y"
          defaultValue={role.description}
          disabled={!canWrite}
        />
      </OfficeField>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          name="allAccess"
          value="1"
          defaultChecked={role.allAccess}
          disabled={!canWrite}
        />
        دسترسی کامل
      </label>
      {!role.allAccess ? (
        <PermissionPicker
          permissions={permissions}
          selected={selected}
          disabled={!canWrite}
          idPrefix={role.id}
        />
      ) : (
        <p className="text-sm font-light text-secondary">این نقش به همه دسترسی‌ها وصل است.</p>
      )}
      {canWrite ? (
        <button type="submit" className="border border-line px-4 py-2 text-sm font-bold">
          ذخیره نقش
        </button>
      ) : null}
    </form>
  );
}

function PermissionPicker({
  permissions,
  selected,
  disabled,
  idPrefix = "new",
}: {
  permissions: { id: string; key: string; label: string; division: string }[];
  selected?: Set<string>;
  disabled?: boolean;
  idPrefix?: string;
}) {
  return (
    <div className="space-y-5">
      {PERMISSION_DIVISIONS.map((division) => {
        const items = permissions.filter((item) => item.division === division.key);
        if (items.length === 0) return null;
        return (
          <fieldset key={division.key} className="space-y-2">
            <legend className="text-sm font-extrabold">{division.label}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((item) => (
                <label key={item.key} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="permissions"
                    value={item.key}
                    defaultChecked={selected?.has(item.key)}
                    disabled={disabled}
                    id={`${idPrefix}-${item.key}`}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-bold">{item.label}</span>
                    <span className="mt-0.5 block text-xs font-light text-secondary ltr-isolate" dir="ltr">
                      {item.key}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
