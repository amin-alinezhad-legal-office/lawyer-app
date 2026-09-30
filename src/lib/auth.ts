import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ensureRbacSeed, getSessionUser, type SessionUser } from "@/db/rbac";
import { canAccess, type PermissionKey } from "@/lib/permissions";

export const APP_SESSION = "app_session";
/** Legacy cookie from the first studio screen */
export const STUDIO_SESSION = "studio_session";

function secret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "aminalinezhad-session";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function sameText(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function encodeSession(userId: string) {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 90;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string | undefined) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userId, expRaw, sig] = parts;
  if (!userId || !expRaw || !sig) return null;
  if (!sameText(sig, sign(`${userId}.${expRaw}`))) return null;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  return userId;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    await ensureRbacSeed();
  } catch {
    /* seed may fail if DB is offline */
  }
  const jar = await cookies();
  const userId = decodeSession(jar.get(APP_SESSION)?.value);
  if (!userId) return null;
  return getSessionUser(userId);
}

export async function isAppAuthed() {
  return Boolean(await getCurrentUser());
}

export async function requireAppAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/app/login");
    throw new Error("unauthorized");
  }
  return user;
}

export async function requirePermission(
  permission: PermissionKey | PermissionKey[],
): Promise<SessionUser> {
  const user = await requireAppAuth();
  if (!canAccess(user.permissions, permission, user.allAccess)) {
    const { redirect } = await import("next/navigation");
    redirect("/app?forbidden=1");
    throw new Error("forbidden");
  }
  return user;
}

export async function setAppSession(userId: string) {
  const jar = await cookies();
  jar.set(APP_SESSION, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function clearAppSession() {
  const jar = await cookies();
  jar.delete(APP_SESSION);
  jar.delete(STUDIO_SESSION);
}

export function userCan(user: SessionUser, permission: PermissionKey | PermissionKey[]) {
  return canAccess(user.permissions, permission, user.allAccess);
}
