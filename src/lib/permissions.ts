export const PERMISSION_DIVISIONS = [
  { key: "profile", label: "پروفایل" },
  { key: "office", label: "دفتر کار" },
  { key: "site", label: "سایت و مدیریت" },
] as const;

export type PermissionDivision = (typeof PERMISSION_DIVISIONS)[number]["key"];

/** Three-segment keys: division.resource.action — e.g. profile.password.update */
export const PERMISSION_CATALOG = [
  { key: "profile.self.view", label: "مشاهده پروفایل", division: "profile" },
  { key: "profile.self.update", label: "ویرایش پروفایل", division: "profile" },
  { key: "profile.password.update", label: "تغییر رمز عبور", division: "profile" },

  { key: "office.dashboard.view", label: "مشاهده میز کار", division: "office" },
  { key: "office.requests.read", label: "خواندن درخواست‌ها", division: "office" },
  { key: "office.requests.update", label: "به‌روزرسانی درخواست‌ها", division: "office" },
  { key: "office.requests.close", label: "بستن درخواست‌ها", division: "office" },
  { key: "office.requests.delete", label: "حذف درخواست‌ها", division: "office" },
  { key: "office.cases.read", label: "خواندن پرونده‌ها", division: "office" },
  { key: "office.cases.write", label: "نوشتن پرونده‌ها", division: "office" },
  { key: "office.archive.read", label: "خواندن بایگانی", division: "office" },
  { key: "office.archive.write", label: "نوشتن بایگانی", division: "office" },
  { key: "office.notes.read", label: "خواندن یادداشت‌ها", division: "office" },
  { key: "office.notes.write", label: "نوشتن یادداشت‌ها", division: "office" },
  { key: "office.reminders.read", label: "خواندن یادآورها", division: "office" },
  { key: "office.reminders.write", label: "نوشتن یادآورها", division: "office" },
  { key: "office.tasks.read", label: "خواندن کارها", division: "office" },
  { key: "office.tasks.write", label: "نوشتن کارها", division: "office" },
  { key: "office.appointments.read", label: "خواندن وقت‌ها", division: "office" },
  { key: "office.appointments.write", label: "نوشتن وقت‌ها", division: "office" },
  { key: "office.clients.read", label: "خواندن موکلان", division: "office" },
  { key: "office.clients.write", label: "نوشتن موکلان", division: "office" },
  { key: "office.letters.read", label: "خواندن نامه‌ها", division: "office" },
  { key: "office.letters.write", label: "نوشتن نامه‌ها", division: "office" },
  { key: "office.search.use", label: "جستجو در دفتر", division: "office" },

  { key: "site.about.read", label: "خواندن درباره", division: "site" },
  { key: "site.about.write", label: "ویرایش درباره", division: "site" },
  { key: "site.topics.read", label: "خواندن حوزه‌های کاری", division: "site" },
  { key: "site.topics.write", label: "ویرایش حوزه‌های کاری", division: "site" },
  { key: "site.users.read", label: "مشاهده کاربران", division: "site" },
  { key: "site.users.write", label: "مدیریت کاربران", division: "site" },
  { key: "site.roles.read", label: "مشاهده نقش‌ها", division: "site" },
  { key: "site.roles.write", label: "مدیریت نقش‌ها و دسترسی‌ها", division: "site" },
] as const;

export type PermissionKey = (typeof PERMISSION_CATALOG)[number]["key"];

export const ALL_PERMISSION_KEYS = PERMISSION_CATALOG.map((item) => item.key);

export const ROLE_PRESETS = [
  {
    slug: "lawyer",
    name: "وکیل (مالک)",
    description: "صاحب دفتر با دسترسی کامل به همه بخش‌ها.",
    allAccess: true,
    permissions: [] as PermissionKey[],
  },
  {
    slug: "admin",
    name: "ادمین",
    description: "دسترسی کامل به پنل، کاربران، نقش‌ها و همه بخش‌ها.",
    allAccess: true,
    permissions: [] as PermissionKey[],
  },
  {
    slug: "secretary",
    name: "منشی",
    description: "درخواست‌ها، پرونده‌ها، بایگانی، یادآور و نامه‌ها.",
    allAccess: false,
    permissions: [
      "profile.self.view",
      "profile.self.update",
      "profile.password.update",
      "office.dashboard.view",
      "office.requests.read",
      "office.requests.update",
      "office.requests.close",
      "office.requests.delete",
      "office.cases.read",
      "office.cases.write",
      "office.archive.read",
      "office.archive.write",
      "office.notes.read",
      "office.notes.write",
      "office.reminders.read",
      "office.reminders.write",
      "office.tasks.read",
      "office.tasks.write",
      "office.appointments.read",
      "office.appointments.write",
      "office.clients.read",
      "office.clients.write",
      "office.letters.read",
      "office.letters.write",
      "office.search.use",
      "site.about.read",
      "site.topics.read",
    ] as PermissionKey[],
  },
  {
    slug: "trainee",
    name: "کارآموز",
    description: "مشاهده محدود برای دوره کارآموزی دفتر.",
    allAccess: false,
    permissions: [
      "profile.self.view",
      "profile.self.update",
      "profile.password.update",
      "office.dashboard.view",
      "office.requests.read",
      "office.cases.read",
      "office.archive.read",
      "office.notes.read",
      "office.reminders.read",
      "office.tasks.read",
      "office.appointments.read",
      "office.clients.read",
      "office.letters.read",
      "office.search.use",
      "site.about.read",
      "site.topics.read",
    ] as PermissionKey[],
  },
] as const;

export function canAccess(
  granted: Iterable<string>,
  needed: PermissionKey | PermissionKey[],
  allAccess = false,
) {
  if (allAccess) return true;
  const set = granted instanceof Set ? granted : new Set(granted);
  const list = Array.isArray(needed) ? needed : [needed];
  return list.every((key) => set.has(key));
}

export function isPermissionKey(value: string): value is PermissionKey {
  return ALL_PERMISSION_KEYS.includes(value as PermissionKey);
}
