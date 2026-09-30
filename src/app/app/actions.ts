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
  addInquiryNote,
  createAboutSection,
  createAppointment,
  createArchiveItem,
  createCase,
  createClient,
  createFormTopic,
  createLetter,
  createOfficeTask,
  createPersonalNote,
  createReminder,
  deleteAboutSection,
  deleteAppointment,
  deleteClient,
  deleteFormTopic,
  deleteInquiry,
  deleteLetter,
  deleteOfficeTask,
  deletePersonalNote,
  deleteReminder,
  findOrCreateClient,
  getInquiry,
  markPhoneAsJunk,
  setAppointmentStatus,
  setInquiryStatus,
  setOfficeTaskDone,
  setReminderDone,
  updateAboutPageMeta,
  updateAboutSection,
  updateAppointment,
  updateArchiveItem,
  updateCase,
  updateClient,
  updateFormTopic,
  updateInquiryFields,
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
  const status = String(formData.get("status") ?? "open");
  await setInquiryStatus(id, status);
  refresh(["/app", "/app/requests"]);
}

export async function saveInquiryNoteAction(formData: FormData) {
  const user = await requirePermission("office.requests.update");
  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const conclusion = String(formData.get("conclusion") ?? "").trim();
  if (!id) redirect("/app/requests");
  if (body) {
    await addInquiryNote({ inquiryId: id, body, createdBy: user.id });
  }
  if (conclusion) {
    await updateInquiryFields(id, { conclusion, status: "open" });
  } else if (body) {
    await setInquiryStatus(id, "open");
  }
  refresh(["/app", "/app/requests"]);
  redirect("/app/requests");
}

export async function inquiryNoAnswerAction(formData: FormData) {
  const user = await requirePermission(["office.requests.update", "office.reminders.write"]);
  const id = String(formData.get("id") ?? "");
  const dueRaw = String(formData.get("dueAt") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const row = await getInquiry(id);
  if (!row) redirect("/app/requests");
  if (!dueRaw) redirect("/app/requests?error=due");
  if (note) {
    await addInquiryNote({ inquiryId: id, body: note, createdBy: user.id });
  }
  await createReminder({
    title: `تماس مجدد با ${row.fullName}`,
    body: note || `عدم پاسخ — ${row.phone}`,
    dueAt: new Date(dueRaw),
    caseId: null,
  });
  await updateInquiryFields(id, { status: "no_answer" });
  refresh(["/app", "/app/requests", "/app/reminders"]);
  redirect("/app/requests");
}

export async function inquiryJunkAction(formData: FormData) {
  const user = await requirePermission("office.requests.update");
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim() || "تماس هرز / بی‌ارزش";
  const row = await getInquiry(id);
  if (!row) redirect("/app/requests");
  await markPhoneAsJunk({ phone: row.phone, reason: note, createdBy: user.id });
  await addInquiryNote({ inquiryId: id, body: note, createdBy: user.id });
  await updateInquiryFields(id, {
    status: "junk",
    conclusion: note,
    closedAt: new Date(),
    closedBy: user.id,
  });
  refresh(["/app", "/app/requests"]);
  redirect("/app/requests");
}

export async function inquiryCloseAction(formData: FormData) {
  const user = await requirePermission("office.requests.close");
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const conclusion = String(formData.get("conclusion") ?? "").trim() || note;
  const row = await getInquiry(id);
  if (!row) redirect("/app/requests");
  if (note) {
    await addInquiryNote({ inquiryId: id, body: note, createdBy: user.id });
  }
  await updateInquiryFields(id, {
    status: "closed",
    conclusion: conclusion || row.conclusion || "تماس انجام و بسته شد.",
    closedAt: new Date(),
    closedBy: user.id,
  });
  refresh(["/app", "/app/requests"]);
  redirect("/app/requests");
}

export async function inquiryCallbackAction(formData: FormData) {
  const user = await requirePermission(["office.requests.update", "office.tasks.write"]);
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const dueRaw = String(formData.get("dueAt") ?? "");
  const row = await getInquiry(id);
  if (!row) redirect("/app/requests");
  if (note) {
    await addInquiryNote({ inquiryId: id, body: note, createdBy: user.id });
  }
  await createOfficeTask({
    title: `پیگیری ${row.fullName}`,
    body: note || row.message,
    dueAt: dueRaw ? new Date(dueRaw) : null,
    inquiryId: id,
    createdBy: user.id,
  });
  await updateInquiryFields(id, { status: "callback" });
  refresh(["/app", "/app/requests", "/app/tasks"]);
  redirect("/app/tasks");
}

export async function inquiryAppointmentAction(formData: FormData) {
  const user = await requirePermission([
    "office.requests.update",
    "office.appointments.write",
    "office.clients.write",
  ]);
  const id = String(formData.get("id") ?? "");
  const startsRaw = String(formData.get("startsAt") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const row = await getInquiry(id);
  if (!row) redirect("/app/requests");
  if (!startsRaw) redirect("/app/requests?error=appointment");
  if (note) {
    await addInquiryNote({ inquiryId: id, body: note, createdBy: user.id });
  }
  const client = await findOrCreateClient({
    fullName: row.fullName,
    phone: row.phone,
    email: row.email,
  });
  await createAppointment({
    title: `جلسه با ${client.fullName}`,
    body: note || row.message,
    startsAt: new Date(startsRaw),
    clientId: client.id,
    inquiryId: id,
    createdBy: user.id,
  });
  await updateInquiryFields(id, {
    status: "appointment",
    conclusion: note || row.conclusion,
  });
  refresh(["/app", "/app/requests", "/app/appointments", "/app/clients"]);
  redirect("/app/appointments");
}

export async function deleteInquiryAction(formData: FormData) {
  await requirePermission("office.requests.delete");
  const id = String(formData.get("id") ?? "");
  await deleteInquiry(id);
  refresh(["/app", "/app/requests"]);
  redirect("/app/requests");
}

export async function toggleTaskAction(formData: FormData) {
  await requirePermission("office.tasks.write");
  const id = String(formData.get("id") ?? "");
  const done = String(formData.get("done") ?? "") === "1";
  await setOfficeTaskDone(id, done);
  refresh(["/app/tasks", "/app"]);
}

export async function removeTaskAction(formData: FormData) {
  await requirePermission("office.tasks.write");
  const id = String(formData.get("id") ?? "");
  await deleteOfficeTask(id);
  refresh(["/app/tasks", "/app"]);
  redirect("/app/tasks");
}

export async function createTaskAction(formData: FormData) {
  const user = await requirePermission("office.tasks.write");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const dueRaw = String(formData.get("dueAt") ?? "");
  if (!title) redirect("/app/tasks?error=1");
  await createOfficeTask({
    title,
    body,
    dueAt: dueRaw ? new Date(dueRaw) : null,
    createdBy: user.id,
  });
  refresh(["/app/tasks", "/app"]);
  redirect("/app/tasks");
}

export async function createAppointmentAction(formData: FormData) {
  const user = await requirePermission("office.appointments.write");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const startsRaw = String(formData.get("startsAt") ?? "");
  const clientId = String(formData.get("clientId") ?? "").trim();
  const minutes = String(formData.get("minutes") ?? "").trim();
  if (!title || !startsRaw || !clientId) redirect("/app/appointments?error=1");
  await createAppointment({
    title,
    body,
    startsAt: new Date(startsRaw),
    clientId,
    minutes,
    createdBy: user.id,
  });
  refresh(["/app/appointments", "/app/clients", "/app"]);
  redirect("/app/appointments");
}

export async function updateAppointmentMinutesAction(formData: FormData) {
  await requirePermission("office.appointments.write");
  const id = String(formData.get("id") ?? "");
  const minutes = String(formData.get("minutes") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!id) redirect("/app/appointments");
  await updateAppointment(id, {
    minutes,
    title: title || undefined,
    body,
    clientId: clientId || undefined,
  });
  refresh(["/app/appointments", "/app/clients", "/app"]);
  redirect("/app/appointments");
}

export async function setAppointmentStatusAction(formData: FormData) {
  await requirePermission("office.appointments.write");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "scheduled");
  await setAppointmentStatus(id, status);
  refresh(["/app/appointments", "/app"]);
}

export async function removeAppointmentAction(formData: FormData) {
  await requirePermission("office.appointments.write");
  const id = String(formData.get("id") ?? "");
  await deleteAppointment(id);
  refresh(["/app/appointments", "/app/clients", "/app"]);
  redirect("/app/appointments");
}

export async function createClientAction(formData: FormData) {
  await requirePermission("office.clients.write");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!fullName || !phone) redirect("/app/clients?error=1");
  try {
    await createClient({ fullName, phone, email: email || null, notes });
  } catch {
    redirect("/app/clients?error=dup");
  }
  refresh(["/app/clients", "/app/appointments"]);
  redirect("/app/clients");
}

export async function updateClientAction(formData: FormData) {
  await requirePermission("office.clients.write");
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id || !fullName) redirect("/app/clients?error=1");
  await updateClient(id, { fullName, email: email || null, notes });
  refresh(["/app/clients", "/app/appointments"]);
  redirect("/app/clients");
}

export async function deleteClientAction(formData: FormData) {
  await requirePermission("office.clients.write");
  const id = String(formData.get("id") ?? "");
  try {
    await deleteClient(id);
  } catch {
    redirect("/app/clients?error=linked");
  }
  refresh(["/app/clients", "/app/appointments"]);
  redirect("/app/clients");
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
