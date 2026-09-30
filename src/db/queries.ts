import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { getDb } from "./index";
import {
  aboutPage,
  aboutSections,
  appointments,
  archiveItems,
  caseNotes,
  cases,
  clients,
  formTopics,
  inquiries,
  inquiryNotes,
  junkPhones,
  letters,
  officeTasks,
  personalNotes,
  reminders,
  siteNotes,
} from "./schema";
import { notes as staticNotes, type Note } from "@/lib/notes";
import { defaultAboutContent, type AboutContent } from "@/lib/about";
import { normalizePhone } from "@/lib/format";
import { defaultMatters, type MatterTopic } from "@/lib/site";

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export async function listNotes(): Promise<Note[]> {
  const db = getDb();
  if (!db) return staticNotes;
  try {
    const rows = await db.select().from(siteNotes).orderBy(desc(siteNotes.publishedAt));
    if (rows.length === 0) return staticNotes;
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      body: row.body,
      publishedAt: asDate(row.publishedAt),
    }));
  } catch {
    return staticNotes;
  }
}

export async function getNote(slug: string): Promise<Note | undefined> {
  const db = getDb();
  if (!db) return staticNotes.find((note) => note.slug === slug);
  try {
    const rows = await db.select().from(siteNotes).where(eq(siteNotes.slug, slug)).limit(1);
    const row = rows[0];
    if (!row) return staticNotes.find((note) => note.slug === slug);
    return {
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      body: row.body,
      publishedAt: asDate(row.publishedAt),
    };
  } catch {
    return staticNotes.find((note) => note.slug === slug);
  }
}

export async function createInquiry(input: {
  fullName: string;
  phone: string;
  email: string | null;
  matter: string;
  message: string;
}) {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");
  await db.insert(inquiries).values(input);
}

export async function listInquiries() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
}

export async function getInquiry(id: string) {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  return row ?? null;
}

export async function listInquiryNotes(inquiryId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(inquiryNotes)
    .where(eq(inquiryNotes.inquiryId, inquiryId))
    .orderBy(desc(inquiryNotes.createdAt));
}

export async function listInquiryNotesByIds(inquiryIds: string[]) {
  const db = getDb();
  if (!db || inquiryIds.length === 0) return [] as (typeof inquiryNotes.$inferSelect)[];
  return db
    .select()
    .from(inquiryNotes)
    .where(inArray(inquiryNotes.inquiryId, inquiryIds))
    .orderBy(desc(inquiryNotes.createdAt));
}

export async function isJunkPhone(phoneRaw: string) {
  const db = getDb();
  if (!db) return false;
  const phone = normalizePhone(phoneRaw);
  const [row] = await db.select().from(junkPhones).where(eq(junkPhones.phone, phone)).limit(1);
  return Boolean(row);
}

export async function listJunkPhonesSet(phones: string[]) {
  const db = getDb();
  if (!db || phones.length === 0) return new Set<string>();
  const normalized = [...new Set(phones.map(normalizePhone).filter(Boolean))];
  if (normalized.length === 0) return new Set<string>();
  const rows = await db.select().from(junkPhones).where(inArray(junkPhones.phone, normalized));
  return new Set(rows.map((row) => row.phone));
}

export async function setInquiryStatus(id: string, status: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db
    .update(inquiries)
    .set({ status, updatedAt: new Date() })
    .where(eq(inquiries.id, id));
}

export async function updateInquiryFields(
  id: string,
  input: {
    status?: string;
    conclusion?: string;
    closedAt?: Date | null;
    closedBy?: string | null;
  },
) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db
    .update(inquiries)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(inquiries.id, id));
}

export async function addInquiryNote(input: {
  inquiryId: string;
  body: string;
  createdBy?: string | null;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.insert(inquiryNotes).values({
    inquiryId: input.inquiryId,
    body: input.body,
    createdBy: input.createdBy ?? null,
  });
  await db
    .update(inquiries)
    .set({ updatedAt: new Date() })
    .where(eq(inquiries.id, input.inquiryId));
}

export async function markPhoneAsJunk(input: {
  phone: string;
  reason?: string;
  createdBy?: string | null;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const phone = normalizePhone(input.phone);
  const existing = await db.select().from(junkPhones).where(eq(junkPhones.phone, phone)).limit(1);
  if (existing.length === 0) {
    await db.insert(junkPhones).values({
      phone,
      reason: input.reason ?? "",
      createdBy: input.createdBy ?? null,
    });
  }
}

export async function deleteInquiry(id: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.delete(inquiries).where(eq(inquiries.id, id));
}

export async function listOfficeTasks() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(officeTasks).orderBy(asc(officeTasks.status), desc(officeTasks.createdAt));
}

export async function createOfficeTask(input: {
  title: string;
  body?: string;
  dueAt?: Date | null;
  inquiryId?: string | null;
  createdBy?: string | null;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const [row] = await db
    .insert(officeTasks)
    .values({
      title: input.title,
      body: input.body ?? "",
      dueAt: input.dueAt ?? null,
      inquiryId: input.inquiryId ?? null,
      createdBy: input.createdBy ?? null,
      status: "open",
    })
    .returning();
  return row;
}

export async function setOfficeTaskDone(id: string, done: boolean) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db
    .update(officeTasks)
    .set({ status: done ? "done" : "open", updatedAt: new Date() })
    .where(eq(officeTasks.id, id));
}

export async function deleteOfficeTask(id: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.delete(officeTasks).where(eq(officeTasks.id, id));
}

export async function listClients() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(clients).orderBy(asc(clients.fullName));
}

export async function getClient(id: string) {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return row ?? null;
}

export async function createClient(input: {
  fullName: string;
  phone: string;
  email?: string | null;
  notes?: string;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const phone = normalizePhone(input.phone);
  const [row] = await db
    .insert(clients)
    .values({
      fullName: input.fullName.trim(),
      phone,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || "",
    })
    .returning();
  return row;
}

export async function updateClient(
  id: string,
  input: { fullName: string; email?: string | null; notes?: string },
) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db
    .update(clients)
    .set({
      fullName: input.fullName.trim(),
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || "",
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id));
}

export async function deleteClient(id: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.delete(clients).where(eq(clients.id, id));
}

/** Find موکل by phone or create one. Phone stays the stable identity. */
export async function findOrCreateClient(input: {
  fullName: string;
  phone: string;
  email?: string | null;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const phone = normalizePhone(input.phone);
  const [existing] = await db.select().from(clients).where(eq(clients.phone, phone)).limit(1);
  if (existing) {
    if (input.fullName.trim() && input.fullName.trim() !== existing.fullName) {
      await db
        .update(clients)
        .set({
          fullName: input.fullName.trim(),
          email: input.email?.trim() || existing.email,
          updatedAt: new Date(),
        })
        .where(eq(clients.id, existing.id));
      const [updated] = await db.select().from(clients).where(eq(clients.id, existing.id)).limit(1);
      return updated ?? existing;
    }
    return existing;
  }
  return createClient(input);
}

export async function listAppointments() {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      id: appointments.id,
      title: appointments.title,
      body: appointments.body,
      startsAt: appointments.startsAt,
      clientId: appointments.clientId,
      clientName: appointments.clientName,
      clientPhone: appointments.clientPhone,
      minutes: appointments.minutes,
      status: appointments.status,
      inquiryId: appointments.inquiryId,
      createdBy: appointments.createdBy,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
      clientFullName: clients.fullName,
      clientNotes: clients.notes,
    })
    .from(appointments)
    .innerJoin(clients, eq(appointments.clientId, clients.id))
    .orderBy(asc(appointments.startsAt));
}

export async function listAppointmentsForClient(clientId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(appointments)
    .where(eq(appointments.clientId, clientId))
    .orderBy(desc(appointments.startsAt));
}

export async function createAppointment(input: {
  title: string;
  body?: string;
  startsAt: Date;
  clientId: string;
  minutes?: string;
  inquiryId?: string | null;
  createdBy?: string | null;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const client = await getClient(input.clientId);
  if (!client) throw new Error("client required");
  const [row] = await db
    .insert(appointments)
    .values({
      title: input.title,
      body: input.body ?? "",
      startsAt: input.startsAt,
      clientId: client.id,
      clientName: client.fullName,
      clientPhone: client.phone,
      minutes: input.minutes ?? "",
      inquiryId: input.inquiryId ?? null,
      createdBy: input.createdBy ?? null,
      status: "scheduled",
    })
    .returning();
  return row;
}

export async function updateAppointment(
  id: string,
  input: {
    title?: string;
    body?: string;
    startsAt?: Date;
    clientId?: string;
    minutes?: string;
    status?: string;
  },
) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.body !== undefined) patch.body = input.body;
  if (input.startsAt !== undefined) patch.startsAt = input.startsAt;
  if (input.minutes !== undefined) patch.minutes = input.minutes;
  if (input.status !== undefined) patch.status = input.status;
  if (input.clientId) {
    const client = await getClient(input.clientId);
    if (!client) throw new Error("client required");
    patch.clientId = client.id;
    patch.clientName = client.fullName;
    patch.clientPhone = client.phone;
  }
  await db.update(appointments).set(patch).where(eq(appointments.id, id));
}

export async function setAppointmentStatus(id: string, status: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db
    .update(appointments)
    .set({ status, updatedAt: new Date() })
    .where(eq(appointments.id, id));
}

export async function deleteAppointment(id: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.delete(appointments).where(eq(appointments.id, id));
}

export async function listCases(query?: string) {
  const db = getDb();
  if (!db) return [];
  if (query?.trim()) {
    const q = `%${query.trim()}%`;
    return db
      .select()
      .from(cases)
      .where(
        or(
          ilike(cases.title, q),
          ilike(cases.clientName, q),
          ilike(cases.caseNumber, q),
          ilike(cases.summary, q),
        ),
      )
      .orderBy(desc(cases.updatedAt));
  }
  return db.select().from(cases).orderBy(desc(cases.updatedAt));
}

export async function getCase(id: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createCase(input: {
  title: string;
  caseNumber?: string | null;
  clientName: string;
  clientPhone?: string | null;
  status?: string;
  summary?: string;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const [row] = await db
    .insert(cases)
    .values({
      title: input.title,
      caseNumber: input.caseNumber ?? null,
      clientName: input.clientName,
      clientPhone: input.clientPhone ?? null,
      status: input.status ?? "open",
      summary: input.summary ?? "",
    })
    .returning();
  return row;
}

export async function updateCase(
  id: string,
  input: Partial<{
    title: string;
    caseNumber: string | null;
    clientName: string;
    clientPhone: string | null;
    status: string;
    summary: string;
  }>,
) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db
    .update(cases)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(cases.id, id));
}

export async function listCaseNotes(caseId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(caseNotes)
    .where(eq(caseNotes.caseId, caseId))
    .orderBy(desc(caseNotes.createdAt));
}

export async function addCaseNote(caseId: string, body: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.insert(caseNotes).values({ caseId, body });
  await db.update(cases).set({ updatedAt: new Date() }).where(eq(cases.id, caseId));
}

export async function listArchive(query?: string) {
  const db = getDb();
  if (!db) return [];
  if (query?.trim()) {
    const q = `%${query.trim()}%`;
    return db
      .select()
      .from(archiveItems)
      .where(or(ilike(archiveItems.title, q), ilike(archiveItems.body, q), ilike(archiveItems.tags, q)))
      .orderBy(desc(archiveItems.updatedAt));
  }
  return db.select().from(archiveItems).orderBy(desc(archiveItems.updatedAt));
}

export async function getArchiveItem(id: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(archiveItems).where(eq(archiveItems.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createArchiveItem(input: {
  title: string;
  body?: string;
  tags?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileMime?: string | null;
  caseId?: string | null;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const [row] = await db
    .insert(archiveItems)
    .values({
      title: input.title,
      body: input.body ?? "",
      tags: input.tags ?? "",
      fileUrl: input.fileUrl ?? null,
      fileName: input.fileName ?? null,
      fileMime: input.fileMime ?? null,
      caseId: input.caseId ?? null,
    })
    .returning();
  return row;
}

export async function updateArchiveItem(
  id: string,
  input: Partial<{
    title: string;
    body: string;
    tags: string;
    fileUrl: string | null;
    fileName: string | null;
    fileMime: string | null;
    caseId: string | null;
  }>,
) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db
    .update(archiveItems)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(archiveItems.id, id));
}

export async function listReminders() {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(reminders)
    .orderBy(asc(reminders.done), asc(reminders.dueAt));
}

export async function createReminder(input: {
  title: string;
  body?: string;
  dueAt: Date;
  caseId?: string | null;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const [row] = await db
    .insert(reminders)
    .values({
      title: input.title,
      body: input.body ?? "",
      dueAt: input.dueAt,
      caseId: input.caseId ?? null,
    })
    .returning();
  return row;
}

export async function setReminderDone(id: string, done: boolean) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.update(reminders).set({ done }).where(eq(reminders.id, id));
}

export async function deleteReminder(id: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.delete(reminders).where(eq(reminders.id, id));
}

export async function listPersonalNotes(query?: string) {
  const db = getDb();
  if (!db) return [];
  if (query?.trim()) {
    const q = `%${query.trim()}%`;
    return db
      .select()
      .from(personalNotes)
      .where(or(ilike(personalNotes.title, q), ilike(personalNotes.body, q)))
      .orderBy(desc(personalNotes.updatedAt));
  }
  return db.select().from(personalNotes).orderBy(desc(personalNotes.updatedAt));
}

export async function getPersonalNote(id: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(personalNotes).where(eq(personalNotes.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createPersonalNote(input: { title: string; body?: string }) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const [row] = await db
    .insert(personalNotes)
    .values({ title: input.title, body: input.body ?? "" })
    .returning();
  return row;
}

export async function updatePersonalNote(id: string, input: { title: string; body: string }) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db
    .update(personalNotes)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(personalNotes.id, id));
}

export async function deletePersonalNote(id: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.delete(personalNotes).where(eq(personalNotes.id, id));
}

export async function listLetters() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(letters).orderBy(desc(letters.updatedAt));
}

export async function getLetter(id: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(letters).where(eq(letters.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createLetter(input: {
  title: string;
  bodyHtml?: string;
  showHeader?: boolean;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const [row] = await db
    .insert(letters)
    .values({
      title: input.title,
      bodyHtml: input.bodyHtml ?? "<p></p>",
      showHeader: input.showHeader ?? true,
    })
    .returning();
  return row;
}

export async function updateLetter(
  id: string,
  input: { title: string; bodyHtml: string; showHeader: boolean },
) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db
    .update(letters)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(letters.id, id));
}

export async function deleteLetter(id: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.delete(letters).where(eq(letters.id, id));
}

export async function searchOffice(query: string) {
  const q = query.trim();
  if (!q) {
    return { cases: [], archive: [], notes: [], letters: [], inquiries: [] };
  }
  const db = getDb();
  if (!db) {
    return { cases: [], archive: [], notes: [], letters: [], inquiries: [] };
  }
  const pattern = `%${q}%`;
  const [caseRows, archiveRows, noteRows, letterRows, inquiryRows] = await Promise.all([
    db
      .select()
      .from(cases)
      .where(or(ilike(cases.title, pattern), ilike(cases.clientName, pattern), ilike(cases.summary, pattern)))
      .limit(12),
    db
      .select()
      .from(archiveItems)
      .where(
        or(ilike(archiveItems.title, pattern), ilike(archiveItems.body, pattern), ilike(archiveItems.tags, pattern)),
      )
      .limit(12),
    db
      .select()
      .from(personalNotes)
      .where(or(ilike(personalNotes.title, pattern), ilike(personalNotes.body, pattern)))
      .limit(12),
    db
      .select()
      .from(letters)
      .where(or(ilike(letters.title, pattern), ilike(letters.bodyHtml, pattern)))
      .limit(12),
    db
      .select()
      .from(inquiries)
      .where(
        or(ilike(inquiries.fullName, pattern), ilike(inquiries.message, pattern), ilike(inquiries.phone, pattern)),
      )
      .limit(12),
  ]);
  return {
    cases: caseRows,
    archive: archiveRows,
    notes: noteRows,
    letters: letterRows,
    inquiries: inquiryRows,
  };
}

export async function dashboardCounts() {
  const db = getDb();
  if (!db) {
    return { inquiries: 0, cases: 0, reminders: 0, archive: 0, letters: 0 };
  }
  const [inq, cas, rem, arc, let_] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(inquiries).where(eq(inquiries.status, "new")),
    db.select({ n: sql<number>`count(*)::int` }).from(cases).where(eq(cases.status, "open")),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(reminders)
      .where(and(eq(reminders.done, false))),
    db.select({ n: sql<number>`count(*)::int` }).from(archiveItems),
    db.select({ n: sql<number>`count(*)::int` }).from(letters),
  ]);
  return {
    inquiries: inq[0]?.n ?? 0,
    cases: cas[0]?.n ?? 0,
    reminders: rem[0]?.n ?? 0,
    archive: arc[0]?.n ?? 0,
    letters: let_[0]?.n ?? 0,
  };
}

function toMatterTopic(row: typeof formTopics.$inferSelect): MatterTopic {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
  };
}

async function ensureDefaultTopics() {
  const db = getDb();
  if (!db) return;
  const existing = await db.select({ id: formTopics.id }).from(formTopics).limit(1);
  if (existing.length > 0) return;
  await db.insert(formTopics).values(
    defaultMatters.map((matter, index) => ({
      slug: matter.slug,
      title: matter.title,
      summary: matter.summary,
      body: matter.body,
      sortOrder: index,
      active: true,
      showOnSite: true,
    })),
  );
}

export async function listAllFormTopics() {
  const db = getDb();
  if (!db) {
    return defaultMatters.map((matter, index) => ({
      id: matter.slug,
      slug: matter.slug,
      title: matter.title,
      summary: matter.summary,
      body: matter.body,
      sortOrder: index,
      active: true,
      showOnSite: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
  await ensureDefaultTopics();
  return db.select().from(formTopics).orderBy(asc(formTopics.sortOrder), asc(formTopics.createdAt));
}

export async function listFormTopicsForContact(): Promise<MatterTopic[]> {
  const db = getDb();
  if (!db) return defaultMatters;
  try {
    await ensureDefaultTopics();
    const rows = await db
      .select()
      .from(formTopics)
      .where(eq(formTopics.active, true))
      .orderBy(asc(formTopics.sortOrder), asc(formTopics.createdAt));
    return rows.length > 0 ? rows.map(toMatterTopic) : defaultMatters;
  } catch {
    return defaultMatters;
  }
}

export async function listFormTopicsForSite(): Promise<MatterTopic[]> {
  const db = getDb();
  if (!db) return defaultMatters;
  try {
    await ensureDefaultTopics();
    const rows = await db
      .select()
      .from(formTopics)
      .where(and(eq(formTopics.active, true), eq(formTopics.showOnSite, true)))
      .orderBy(asc(formTopics.sortOrder), asc(formTopics.createdAt));
    return rows.length > 0 ? rows.map(toMatterTopic) : defaultMatters;
  } catch {
    return defaultMatters;
  }
}

export async function createFormTopic(input: {
  title: string;
  summary?: string;
  body?: string;
  active?: boolean;
  showOnSite?: boolean;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await ensureDefaultTopics();
  const slugBase = slugifyTopic(input.title);
  let slug = slugBase;
  let attempt = 1;
  while (true) {
    const clash = await db.select({ id: formTopics.id }).from(formTopics).where(eq(formTopics.slug, slug)).limit(1);
    if (clash.length === 0) break;
    attempt += 1;
    slug = `${slugBase}-${attempt}`;
  }
  const current = await db.select({ n: sql<number>`count(*)::int` }).from(formTopics);
  const [row] = await db
    .insert(formTopics)
    .values({
      slug,
      title: input.title,
      summary: input.summary ?? "",
      body: input.body ?? "",
      sortOrder: current[0]?.n ?? 0,
      active: input.active ?? true,
      showOnSite: input.showOnSite ?? true,
    })
    .returning();
  return row;
}

export async function updateFormTopic(
  id: string,
  input: {
    title: string;
    summary: string;
    body: string;
    active: boolean;
    showOnSite: boolean;
    sortOrder: number;
  },
) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db
    .update(formTopics)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(formTopics.id, id));
}

export async function deleteFormTopic(id: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.delete(formTopics).where(eq(formTopics.id, id));
}

function slugifyTopic(title: string) {
  const ascii = title
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (ascii) return ascii.slice(0, 48);
  return `topic-${Date.now().toString(36)}`;
}

async function ensureDefaultAbout() {
  const db = getDb();
  if (!db) return;
  const existing = await db.select({ id: aboutPage.id }).from(aboutPage).limit(1);
  if (existing.length > 0) return;
  const { sections, ...meta } = defaultAboutContent;
  await db.insert(aboutPage).values({
    kicker: meta.kicker,
    title: meta.title,
    lede: meta.lede,
    ctaLabel: meta.ctaLabel,
    ctaHref: meta.ctaHref,
  });
  await db.insert(aboutSections).values(
    sections.map((section, index) => ({
      title: section.title,
      body: section.body,
      sortOrder: index,
      active: true,
    })),
  );
}

export async function getAboutContent(): Promise<AboutContent> {
  const db = getDb();
  if (!db) return defaultAboutContent;
  try {
    await ensureDefaultAbout();
    const [page] = await db.select().from(aboutPage).limit(1);
    if (!page) return defaultAboutContent;
    const sections = await db
      .select()
      .from(aboutSections)
      .where(eq(aboutSections.active, true))
      .orderBy(asc(aboutSections.sortOrder), asc(aboutSections.createdAt));
    return {
      kicker: page.kicker,
      title: page.title,
      lede: page.lede,
      ctaLabel: page.ctaLabel,
      ctaHref: page.ctaHref,
      sections: sections.map((s) => ({
        id: s.id,
        title: s.title,
        body: s.body,
        sortOrder: s.sortOrder,
        active: s.active,
      })),
    };
  } catch {
    return defaultAboutContent;
  }
}

export async function getAboutForAdmin() {
  const db = getDb();
  if (!db) {
    return {
      page: {
        id: "local",
        kicker: defaultAboutContent.kicker,
        title: defaultAboutContent.title,
        lede: defaultAboutContent.lede,
        ctaLabel: defaultAboutContent.ctaLabel,
        ctaHref: defaultAboutContent.ctaHref,
      },
      sections: defaultAboutContent.sections,
    };
  }
  await ensureDefaultAbout();
  const [page] = await db.select().from(aboutPage).limit(1);
  const sections = await db
    .select()
    .from(aboutSections)
    .orderBy(asc(aboutSections.sortOrder), asc(aboutSections.createdAt));
  return {
    page: page ?? {
      id: "missing",
      kicker: defaultAboutContent.kicker,
      title: defaultAboutContent.title,
      lede: defaultAboutContent.lede,
      ctaLabel: defaultAboutContent.ctaLabel,
      ctaHref: defaultAboutContent.ctaHref,
    },
    sections,
  };
}

export async function updateAboutPageMeta(input: {
  kicker: string;
  title: string;
  lede: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await ensureDefaultAbout();
  const [page] = await db.select({ id: aboutPage.id }).from(aboutPage).limit(1);
  if (!page) throw new Error("about page missing");
  await db
    .update(aboutPage)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(aboutPage.id, page.id));
}

export async function createAboutSection(input: {
  title?: string;
  body?: string;
  active?: boolean;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await ensureDefaultAbout();
  const [{ value: maxOrder } = { value: 0 }] = await db
    .select({ value: sql<number>`coalesce(max(${aboutSections.sortOrder}), -1)` })
    .from(aboutSections);
  await db.insert(aboutSections).values({
    title: input.title?.trim() || "",
    body: input.body?.trim() || "",
    sortOrder: Number(maxOrder) + 1,
    active: input.active ?? true,
  });
}

export async function updateAboutSection(
  id: string,
  input: { title: string; body: string; sortOrder: number; active: boolean },
) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db
    .update(aboutSections)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(aboutSections.id, id));
}

export async function deleteAboutSection(id: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.delete(aboutSections).where(eq(aboutSections.id, id));
}
