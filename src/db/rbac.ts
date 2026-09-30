import { asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "./index";
import {
  loginAttempts,
  permissions,
  rolePermissions,
  roles,
  users,
} from "./schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  ALL_PERMISSION_KEYS,
  PERMISSION_CATALOG,
  ROLE_PRESETS,
  type PermissionKey,
} from "@/lib/permissions";
import { normalizePhone } from "@/lib/format";

export type SessionUser = {
  id: string;
  phone: string;
  fullName: string;
  roleId: string;
  roleSlug: string;
  roleName: string;
  allAccess: boolean;
  permissions: PermissionKey[];
};

const ADMIN_PHONE = "09124971667";
const ADMIN_PASSWORD = "change-me";
const FAIL_LIMIT = 3;
const LOCK_MINUTES = 15;

let seedPromise: Promise<void> | null = null;

export async function ensureRbacSeed() {
  const db = getDb();
  if (!db) return;
  if (!seedPromise) {
    seedPromise = (async () => {
      for (const item of PERMISSION_CATALOG) {
        const existing = await db
          .select({ id: permissions.id })
          .from(permissions)
          .where(eq(permissions.key, item.key))
          .limit(1);
        if (existing.length === 0) {
          await db.insert(permissions).values({
            key: item.key,
            label: item.label,
            division: item.division,
          });
        }
      }

      for (const preset of ROLE_PRESETS) {
        let [role] = await db.select().from(roles).where(eq(roles.slug, preset.slug)).limit(1);
        if (!role) {
          const [created] = await db
            .insert(roles)
            .values({
              slug: preset.slug,
              name: preset.name,
              description: preset.description,
              allAccess: preset.allAccess,
              isSystem: true,
            })
            .returning();
          role = created;
        } else {
          await db
            .update(roles)
            .set({
              name: preset.name,
              description: preset.description,
              allAccess: preset.allAccess,
              isSystem: true,
              updatedAt: new Date(),
            })
            .where(eq(roles.id, role.id));
        }

        if (!preset.allAccess && preset.permissions.length > 0) {
          const permRows = await db
            .select()
            .from(permissions)
            .where(inArray(permissions.key, [...preset.permissions]));
          const linked = await db
            .select({ permissionId: rolePermissions.permissionId })
            .from(rolePermissions)
            .where(eq(rolePermissions.roleId, role.id));
          const have = new Set(linked.map((row) => row.permissionId));
          for (const perm of permRows) {
            if (have.has(perm.id)) continue;
            await db.insert(rolePermissions).values({
              roleId: role.id,
              permissionId: perm.id,
            });
          }
        }
      }

      const [adminRole] = await db.select().from(roles).where(eq(roles.slug, "admin")).limit(1);
      if (!adminRole) return;

      const [adminUser] = await db
        .select()
        .from(users)
        .where(eq(users.phone, ADMIN_PHONE))
        .limit(1);
      if (!adminUser) {
        await db.insert(users).values({
          phone: ADMIN_PHONE,
          fullName: "ادمین سیستم",
          passwordHash: hashPassword(ADMIN_PASSWORD),
          roleId: adminRole.id,
          active: true,
        });
      }
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  await seedPromise;
}

async function loadPermissionsForRole(roleId: string, allAccess: boolean): Promise<PermissionKey[]> {
  if (allAccess) return [...ALL_PERMISSION_KEYS];
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId));
  return rows.map((row) => row.key as PermissionKey);
}

export async function getSessionUser(userId: string): Promise<SessionUser | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select({
      id: users.id,
      phone: users.phone,
      fullName: users.fullName,
      active: users.active,
      roleId: users.roleId,
      roleSlug: roles.slug,
      roleName: roles.name,
      allAccess: roles.allAccess,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);
  const row = rows[0];
  if (!row || !row.active) return null;
  const perms = await loadPermissionsForRole(row.roleId, row.allAccess);
  return {
    id: row.id,
    phone: row.phone,
    fullName: row.fullName,
    roleId: row.roleId,
    roleSlug: row.roleSlug,
    roleName: row.roleName,
    allAccess: row.allAccess,
    permissions: perms,
  };
}

export async function getLoginGate(phoneRaw: string) {
  const db = getDb();
  const phone = normalizePhone(phoneRaw);
  if (!db || !phone) {
    return { failCount: 0, captchaRequired: false, locked: false, lockedUntil: null as Date | null };
  }
  await ensureRbacSeed();
  const [row] = await db.select().from(loginAttempts).where(eq(loginAttempts.phone, phone)).limit(1);
  if (!row) {
    return { failCount: 0, captchaRequired: false, locked: false, lockedUntil: null };
  }
  const locked = Boolean(row.lockedUntil && row.lockedUntil.getTime() > Date.now());
  return {
    failCount: row.failCount,
    captchaRequired: row.captchaRequired || row.failCount >= FAIL_LIMIT,
    locked,
    lockedUntil: row.lockedUntil,
  };
}

export async function recordLoginFailure(phoneRaw: string) {
  const db = getDb();
  const phone = normalizePhone(phoneRaw);
  if (!db || !phone) return { captchaRequired: true, locked: false };
  const [existing] = await db.select().from(loginAttempts).where(eq(loginAttempts.phone, phone)).limit(1);
  const failCount = (existing?.failCount ?? 0) + 1;
  const captchaRequired = failCount >= FAIL_LIMIT;
  const lockedUntil =
    failCount >= FAIL_LIMIT * 2 ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null;
  if (existing) {
    await db
      .update(loginAttempts)
      .set({
        failCount,
        captchaRequired,
        lockedUntil,
        updatedAt: new Date(),
      })
      .where(eq(loginAttempts.id, existing.id));
  } else {
    await db.insert(loginAttempts).values({
      phone,
      failCount,
      captchaRequired,
      lockedUntil,
    });
  }
  return { captchaRequired, locked: Boolean(lockedUntil) };
}

export async function clearLoginFailures(phoneRaw: string) {
  const db = getDb();
  const phone = normalizePhone(phoneRaw);
  if (!db || !phone) return;
  await db.delete(loginAttempts).where(eq(loginAttempts.phone, phone));
}

export async function authenticateUser(phoneRaw: string, password: string) {
  const db = getDb();
  if (!db) return { ok: false as const, reason: "no_db" as const };
  await ensureRbacSeed();
  const phone = normalizePhone(phoneRaw);
  const [row] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      active: users.active,
    })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);
  if (!row || !row.active || !verifyPassword(password, row.passwordHash)) {
    return { ok: false as const, reason: "invalid" as const };
  }
  return { ok: true as const, userId: row.id };
}

export async function listRoles() {
  const db = getDb();
  if (!db) return [];
  await ensureRbacSeed();
  return db.select().from(roles).orderBy(asc(roles.name));
}

export async function listPermissions() {
  const db = getDb();
  if (!db) return [];
  await ensureRbacSeed();
  return db.select().from(permissions).orderBy(asc(permissions.division), asc(permissions.key));
}

export async function getRolePermissionKeys(roleId: string) {
  const db = getDb();
  if (!db) return [] as PermissionKey[];
  const rows = await db
    .select({ key: permissions.key, allAccess: roles.allAccess })
    .from(roles)
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(roles.id, roleId));
  if (rows[0]?.allAccess) return [...ALL_PERMISSION_KEYS];
  return rows.map((row) => row.key).filter(Boolean) as PermissionKey[];
}

export async function listUsersWithRoles() {
  const db = getDb();
  if (!db) return [];
  await ensureRbacSeed();
  return db
    .select({
      id: users.id,
      phone: users.phone,
      fullName: users.fullName,
      active: users.active,
      roleId: users.roleId,
      roleName: roles.name,
      roleSlug: roles.slug,
      createdAt: users.createdAt,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .orderBy(asc(users.fullName));
}

export async function createUser(input: {
  phone: string;
  fullName: string;
  password: string;
  roleId: string;
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const phone = normalizePhone(input.phone);
  await db.insert(users).values({
    phone,
    fullName: input.fullName.trim(),
    passwordHash: hashPassword(input.password),
    roleId: input.roleId,
    active: true,
  });
}

export async function updateUserByAdmin(
  id: string,
  input: { fullName: string; roleId: string; active: boolean; password?: string },
) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const patch: {
    fullName: string;
    roleId: string;
    active: boolean;
    updatedAt: Date;
    passwordHash?: string;
  } = {
    fullName: input.fullName.trim(),
    roleId: input.roleId,
    active: input.active,
    updatedAt: new Date(),
  };
  if (input.password) patch.passwordHash = hashPassword(input.password);
  await db.update(users).set(patch).where(eq(users.id, id));
}

export async function updateOwnProfile(
  userId: string,
  input: { fullName: string; currentPassword?: string; newPassword?: string },
) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row) throw new Error("user missing");
  const patch: { fullName: string; updatedAt: Date; passwordHash?: string } = {
    fullName: input.fullName.trim(),
    updatedAt: new Date(),
  };
  if (input.newPassword) {
    if (!input.currentPassword || !verifyPassword(input.currentPassword, row.passwordHash)) {
      return { ok: false as const, reason: "bad_password" as const };
    }
    patch.passwordHash = hashPassword(input.newPassword);
  }
  await db.update(users).set(patch).where(eq(users.id, userId));
  return { ok: true as const };
}

export async function createRole(input: {
  slug: string;
  name: string;
  description?: string;
  allAccess?: boolean;
  permissionKeys?: PermissionKey[];
}) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const [role] = await db
    .insert(roles)
    .values({
      slug: input.slug,
      name: input.name.trim(),
      description: input.description?.trim() || "",
      allAccess: input.allAccess ?? false,
      isSystem: false,
    })
    .returning();
  if (!input.allAccess && input.permissionKeys?.length) {
    await setRolePermissions(role.id, input.permissionKeys);
  }
  return role;
}

export async function updateRole(
  id: string,
  input: {
    name: string;
    description: string;
    allAccess: boolean;
    permissionKeys: PermissionKey[];
  },
) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db
    .update(roles)
    .set({
      name: input.name.trim(),
      description: input.description.trim(),
      allAccess: input.allAccess,
      updatedAt: new Date(),
    })
    .where(eq(roles.id, id));
  if (input.allAccess) {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
  } else {
    await setRolePermissions(id, input.permissionKeys);
  }
}

async function setRolePermissions(roleId: string, keys: PermissionKey[]) {
  const db = getDb();
  if (!db) throw new Error("no db");
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
  if (keys.length === 0) return;
  const permRows = await db.select().from(permissions).where(inArray(permissions.key, keys));
  if (permRows.length === 0) return;
  await db.insert(rolePermissions).values(
    permRows.map((perm) => ({
      roleId,
      permissionId: perm.id,
    })),
  );
}

export async function deleteRole(id: string) {
  const db = getDb();
  if (!db) throw new Error("no db");
  const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!role || role.isSystem) throw new Error("system role");
  const [{ value } = { value: 0 }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.roleId, id));
  if (Number(value) > 0) throw new Error("role in use");
  await db.delete(roles).where(eq(roles.id, id));
}

export { FAIL_LIMIT };
