import type { PermissionKey } from "@/lib/permissions";

export type AppNavItem = {
  href: string;
  label: string;
  permission?: PermissionKey;
  exact?: boolean;
};

export const appNav: AppNavItem[] = [
  { href: "/app", label: "میز کار", exact: true, permission: "office.dashboard.view" },
  { href: "/app/requests", label: "درخواست‌ها", permission: "office.requests.read" },
  { href: "/app/tasks", label: "کارها", permission: "office.tasks.read" },
  { href: "/app/appointments", label: "وقت‌ها", permission: "office.appointments.read" },
  { href: "/app/clients", label: "موکلان", permission: "office.clients.read" },
  { href: "/app/about", label: "درباره", permission: "site.about.read" },
  { href: "/app/topics", label: "حوزه‌های کاری", permission: "site.topics.read" },
  { href: "/app/cases", label: "پرونده‌ها", permission: "office.cases.read" },
  { href: "/app/archive", label: "بایگانی", permission: "office.archive.read" },
  { href: "/app/notes", label: "یادداشت‌ها", permission: "office.notes.read" },
  { href: "/app/reminders", label: "یادآورها", permission: "office.reminders.read" },
  { href: "/app/letters", label: "نامه‌ها", permission: "office.letters.read" },
  { href: "/app/search", label: "جستجو", permission: "office.search.use" },
  { href: "/app/profile", label: "پروفایل", permission: "profile.self.view" },
  { href: "/app/users", label: "کاربران", permission: "site.users.read" },
  { href: "/app/roles", label: "نقش‌ها", permission: "site.roles.read" },
];

export const caseStatuses = [
  { value: "open", label: "باز" },
  { value: "pending", label: "در انتظار" },
  { value: "closed", label: "بسته" },
] as const;
