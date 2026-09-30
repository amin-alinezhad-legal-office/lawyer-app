"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearAppSession,
  requireAppAuth,
  requirePermission,
  setAppSession,
} from "@/lib/auth";
import { uploadOfficeFile } from "@/lib/blob";
import {
  clearCaptchaCookie,
  readCaptchaCookie,
  verifyCaptchaAnswer,
} from "@/lib/captcha";
import { normalizePhone } from "@/lib/format";
import { isPermissionKey, type PermissionKey } from "@/lib/permissions";
import {
  authenticateUser,
  clearLoginFailures,
  createRole,
  createUser,
  deleteRole,
  getLoginGate,
  recordLoginFailure,
  updateOwnProfile,
  updateRole,
  updateUserByAdmin,
} from "@/db/rbac";
import {
  addCaseNote,
  createAboutSection,
  createArchiveItem,
  createCase,
  createFormTopic,
  createLetter,
  createPersonalNote,
  createReminder,
  deleteAboutSection,
  deleteFormTopic,
  deleteLetter,
  deletePersonalNote,
  deleteReminder,
  setInquiryStatus,
  setReminderDone,
  updateAboutPageMeta,
  updateAboutSection,
  updateArchiveItem,
  updateCase,
  updateFormTopic,
  updateLetter,
  updatePersonalNote,
} from "@/db/queries";

function refresh(paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

function slugifyRole(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `role-${Date.now().toString(36)}`;
}

export async function loginApp(formData: FormData) {
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const captchaAnswer = String(formData.get("captcha") ?? "");

  if (!phone || !password) redirect("/app/login?error=missing");

  const gate = await getLoginGate(phone);
  if (gate.locked) redirect("/app/login?error=locked");

  if (gate.captchaRequired) {
    // Prefer the token shown on the form; cookie can lag behind a freshly rendered challenge.
    const token =
      String(formData.get("captchaToken") ?? "") || (await readCaptchaCookie());
    if (!token || !verifyCaptchaAnswer(token, captchaAnswer)) {
      const q = new URLSearchParams({
        error: "captcha",
        captcha: "1",
        phone: normalizePhone(phone) || phone,
      });
      redirect(`/app/login?${q.toString()}`);
    }
  }

  const result = await authenticateUser(phone, password);
  if (!result.ok) {
    const fail = await recordLoginFailure(phone);
    const q = new URLSearchParams();
    q.set("phone", normalizePhone(phone) || phone);
    if (fail.locked) {
      q.set("error", "locked");
      redirect(`/app/login?${q.toString()}`);
    }
    q.set("error", "auth");
    if (fail.captchaRequired) q.set("captcha", "1");
    redirect(`/app/login?${q.toString()}`);
  }

  await clearLoginFailures(phone);
  await clearCaptchaCookie();
  await setAppSession(result.userId);
  redirect("/app");
}

export async function logoutApp() {
  await clearAppSession();
  redirect("/app/login");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requirePermission(["profile.self.update"]);
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) redirect("/app/profile?error=name");
  await updateOwnProfile(user.id, { fullName });
  refresh(["/app/profile", "/app"]);
  redirect("/app/profile?saved=1");
}

export async function updatePasswordAction(formData: FormData) {
  const user = await requirePermission(["profile.password.update"]);
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    redirect("/app/profile?error=password");
  }
  if (newPassword !== confirmPassword) redirect("/app/profile?error=confirm");
  const result = await updateOwnProfile(user.id, {
    fullName: user.fullName,
    currentPassword,
    newPassword,
  });
  if (!result.ok) redirect("/app/profile?error=current");
  refresh(["/app/profile"]);
  redirect("/app/profile?saved=password");
}

export async function createUserAction(formData: FormData) {
  await requirePermission("site.users.write");
  const phone = String(formData.get("phone") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const roleId = String(formData.get("roleId") ?? "");
  if (!phone || !fullName || !password || !roleId) redirect("/app/users?error=1");
  try {
    await createUser({ phone, fullName, password, roleId });
  } catch {
    redirect("/app/users?error=dup");
  }
  refresh(["/app/users"]);
  redirect("/app/users");
}

export async function updateUserAction(formData: FormData) {
  await requirePermission("site.users.write");
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const roleId = String(formData.get("roleId") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  const password = String(formData.get("password") ?? "").trim();
  if (!id || !fullName || !roleId) redirect("/app/users?error=1");
  await updateUserByAdmin(id, {
    fullName,
    roleId,
    active,
    password: password || undefined,
  });
  refresh(["/app/users"]);
  redirect("/app/users");
}

export async function createRoleAction(formData: FormData) {
  await requirePermission("site.roles.write");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const allAccess = String(formData.get("allAccess") ?? "") === "1";
  const slug = slugifyRole(String(formData.get("slug") ?? name));
  const permissionKeys = formData
    .getAll("permissions")
    .map(String)
    .filter(isPermissionKey) as PermissionKey[];
  if (!name) redirect("/app/roles?error=1");
  try {
    await createRole({ slug, name, description, allAccess, permissionKeys });
  } catch {
    redirect("/app/roles?error=dup");
  }
  refresh(["/app/roles"]);
  redirect("/app/roles");
}

export async function updateRoleAction(formData: FormData) {
  await requirePermission("site.roles.write");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const allAccess = String(formData.get("allAccess") ?? "") === "1";
  const permissionKeys = formData
    .getAll("permissions")
    .map(String)
    .filter(isPermissionKey) as PermissionKey[];
  if (!id || !name) redirect("/app/roles?error=1");
  await updateRole(id, { name, description, allAccess, permissionKeys });
  refresh(["/app/roles"]);
  redirect("/app/roles");
}

export async function deleteRoleAction(formData: FormData) {
  await requirePermission("site.roles.write");
  const id = String(formData.get("id") ?? "");
  try {
    await deleteRole(id);
  } catch {
    redirect("/app/roles?error=delete");
  }
  refresh(["/app/roles"]);
  redirect("/app/roles");
}

export async function markInquiry(formData: FormData) {
  await requirePermission("office.requests.update");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "read");
  await setInquiryStatus(id, status);
  refresh(["/app", "/app/requests"]);
}

export async function saveCaseAction(formData: FormData) {
  await requirePermission("office.cases.write");
  const id = String(formData.get("id") ?? "");
  const data = {
    title: String(formData.get("title") ?? "").trim(),
    caseNumber: String(formData.get("caseNumber") ?? "").trim() || null,
    clientName: String(formData.get("clientName") ?? "").trim(),
    clientPhone: (() => {
      const raw = String(formData.get("clientPhone") ?? "").trim();
      return raw ? normalizePhone(raw) : null;
    })(),
    status: String(formData.get("status") ?? "open"),
    summary: String(formData.get("summary") ?? "").trim(),
  };
  if (!data.title || !data.clientName) {
    redirect(id ? `/app/cases/${id}?error=1` : "/app/cases/new?error=1");
  }
  if (id) {
    await updateCase(id, data);
    refresh(["/app/cases", `/app/cases/${id}`, "/app"]);
    redirect(`/app/cases/${id}`);
  }
  const row = await createCase(data);
  refresh(["/app/cases", "/app"]);
  redirect(`/app/cases/${row.id}`);
}

export async function addCaseNoteAction(formData: FormData) {
  await requirePermission("office.cases.write");
  const caseId = String(formData.get("caseId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!caseId || !body) redirect(`/app/cases/${caseId}`);
  await addCaseNote(caseId, body);
  refresh([`/app/cases/${caseId}`]);
  redirect(`/app/cases/${caseId}`);
}

export async function saveArchiveAction(formData: FormData) {
  await requirePermission("office.archive.write");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tags = String(formData.get("tags") ?? "").trim();
  const caseId = String(formData.get("caseId") ?? "").trim() || null;
  const file = formData.get("file");

  if (!title) {
    redirect(id ? `/app/archive/${id}?error=1` : "/app/archive/new?error=1");
  }

  let fileMeta: { fileUrl?: string | null; fileName?: string | null; fileMime?: string | null } = {};
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadOfficeFile(file, "archive");
    fileMeta = {
      fileUrl: uploaded.url,
      fileName: uploaded.fileName,
      fileMime: uploaded.fileMime,
    };
  }

  if (id) {
    await updateArchiveItem(id, { title, body, tags, caseId, ...fileMeta });
    refresh(["/app/archive", `/app/archive/${id}`, "/app"]);
    redirect(`/app/archive/${id}`);
  }

  const row = await createArchiveItem({
    title,
    body,
    tags,
    caseId,
    ...fileMeta,
  });
  refresh(["/app/archive", "/app"]);
  redirect(`/app/archive/${row.id}`);
}

export async function saveReminderAction(formData: FormData) {
  await requirePermission("office.reminders.write");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const dueRaw = String(formData.get("dueAt") ?? "");
  const caseId = String(formData.get("caseId") ?? "").trim() || null;
  if (!title || !dueRaw) redirect("/app/reminders?error=1");
  await createReminder({ title, body, dueAt: new Date(dueRaw), caseId });
  refresh(["/app/reminders", "/app"]);
  redirect("/app/reminders");
}

export async function toggleReminderAction(formData: FormData) {
  await requirePermission("office.reminders.write");
  const id = String(formData.get("id") ?? "");
  const done = String(formData.get("done") ?? "") === "1";
  await setReminderDone(id, done);
  refresh(["/app/reminders", "/app"]);
}

export async function removeReminderAction(formData: FormData) {
  await requirePermission("office.reminders.write");
  const id = String(formData.get("id") ?? "");
  await deleteReminder(id);
  refresh(["/app/reminders", "/app"]);
}

export async function savePersonalNoteAction(formData: FormData) {
  await requirePermission("office.notes.write");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title) redirect("/app/notes?error=1");
  if (id) {
    await updatePersonalNote(id, { title, body });
    refresh(["/app/notes", `/app/notes/${id}`]);
    redirect(`/app/notes/${id}`);
  }
  const row = await createPersonalNote({ title, body });
  refresh(["/app/notes"]);
  redirect(`/app/notes/${row.id}`);
}

export async function removePersonalNoteAction(formData: FormData) {
  await requirePermission("office.notes.write");
  const id = String(formData.get("id") ?? "");
  await deletePersonalNote(id);
  refresh(["/app/notes"]);
  redirect("/app/notes");
}

const letterSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1),
  bodyHtml: z.string(),
  showHeader: z.boolean(),
});

export async function saveLetterAction(input: {
  id?: string;
  title: string;
  bodyHtml: string;
  showHeader: boolean;
}) {
  await requirePermission("office.letters.write");
  const parsed = letterSchema.parse(input);
  if (parsed.id) {
    await updateLetter(parsed.id, {
      title: parsed.title,
      bodyHtml: parsed.bodyHtml,
      showHeader: parsed.showHeader,
    });
    refresh(["/app/letters", `/app/letters/${parsed.id}`]);
    return { id: parsed.id };
  }
  const row = await createLetter({
    title: parsed.title,
    bodyHtml: parsed.bodyHtml,
    showHeader: parsed.showHeader,
  });
  refresh(["/app/letters", "/app"]);
  return { id: row.id };
}

export async function removeLetterAction(formData: FormData) {
  await requirePermission("office.letters.write");
  const id = String(formData.get("id") ?? "");
  await deleteLetter(id);
  refresh(["/app/letters", "/app"]);
  redirect("/app/letters");
}

export async function createTopicAction(formData: FormData) {
  await requirePermission("site.topics.write");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const active = String(formData.get("active") ?? "") === "1";
  const showOnSite = String(formData.get("showOnSite") ?? "") === "1";
  if (!title) redirect("/app/topics?error=1");
  await createFormTopic({ title, summary, body, active, showOnSite });
  refresh(["/app/topics", "/contact", "/", "/practice"]);
  redirect("/app/topics");
}

export async function updateTopicAction(formData: FormData) {
  await requirePermission("site.topics.write");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const active = String(formData.get("active") ?? "") === "1";
  const showOnSite = String(formData.get("showOnSite") ?? "") === "1";
  if (!id || !title) redirect("/app/topics?error=1");
  await updateFormTopic(id, {
    title,
    summary,
    body,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    active,
    showOnSite,
  });
  refresh(["/app/topics", "/contact", "/", "/practice"]);
  redirect("/app/topics");
}

export async function deleteTopicAction(formData: FormData) {
  await requirePermission("site.topics.write");
  const id = String(formData.get("id") ?? "");
  await deleteFormTopic(id);
  refresh(["/app/topics", "/contact", "/", "/practice"]);
  redirect("/app/topics");
}

export async function updateAboutMetaAction(formData: FormData) {
  await requirePermission("site.about.write");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/app/about?error=1");
  await updateAboutPageMeta({
    kicker: String(formData.get("kicker") ?? "").trim(),
    title,
    lede: String(formData.get("lede") ?? "").trim(),
    ctaLabel: String(formData.get("ctaLabel") ?? "").trim(),
    ctaHref: String(formData.get("ctaHref") ?? "").trim() || "/contact",
  });
  refresh(["/app/about", "/about"]);
  redirect("/app/about");
}

export async function createAboutSectionAction(formData: FormData) {
  await requirePermission("site.about.write");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect("/app/about?error=1");
  await createAboutSection({
    title: String(formData.get("title") ?? "").trim(),
    body,
    active: String(formData.get("active") ?? "") === "1",
  });
  refresh(["/app/about", "/about"]);
  redirect("/app/about");
}

export async function updateAboutSectionAction(formData: FormData) {
  await requirePermission("site.about.write");
  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  if (!id || !body) redirect("/app/about?error=1");
  await updateAboutSection(id, {
    title: String(formData.get("title") ?? "").trim(),
    body,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    active: String(formData.get("active") ?? "") === "1",
  });
  refresh(["/app/about", "/about"]);
  redirect("/app/about");
}

export async function deleteAboutSectionAction(formData: FormData) {
  await requirePermission("site.about.write");
  const id = String(formData.get("id") ?? "");
  await deleteAboutSection(id);
  refresh(["/app/about", "/about"]);
  redirect("/app/about");
}
