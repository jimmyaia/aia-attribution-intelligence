import { and, eq, gt, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { randomInt } from "node:crypto";
import { InsertUser, supportViewSessions, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEmailUser(data: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  website?: string;
  agencyName?: string;
  agencyId?: number;
  agencyMemberRole?: "owner" | "member";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const name = `${data.firstName} ${data.lastName}`;
  await db.insert(users).values({
    email: data.email,
    passwordHash: data.passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone ?? null,
    website: data.website ?? null,
    agencyName: data.agencyName ?? null,
    name,
    loginMethod: "email",
    profileComplete: true,
    agencyId: data.agencyId ?? null,
    agencyMemberRole: data.agencyMemberRole ?? "owner",
    agencyMemberActive: true,
    lastSignedIn: new Date(),
  });
  const created = await getUserByEmail(data.email);
  if (!created) throw new Error("Failed to create user");
  const workspaceOwnerId = data.agencyId ?? created.id;
  await db
    .update(users)
    .set({ agencyId: workspaceOwnerId })
    .where(eq(users.id, created.id));
  await assignCustomerId(created.id);
  return (await getUserById(created.id)) ?? created;
}

export async function ensureAgencyMembership(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");
  if (user.agencyId) return user;

  await db
    .update(users)
    .set({ agencyId: user.id, agencyMemberRole: "owner", agencyMemberActive: true })
    .where(eq(users.id, user.id));
  return (await getUserById(user.id)) ?? user;
}

export async function getAgencyOwnerForMember(userId: number) {
  const user = await getUserById(userId);
  if (!user) return undefined;
  return getUserById(user.agencyId ?? user.id);
}

export async function listAgencyMembers(agencyId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.select().from(users).where(eq(users.agencyId, agencyId));
}

export function generateCustomerId() {
  return randomInt(1_000_000, 10_000_000).toString();
}

export async function reserveUniqueCustomerId(
  assign: (customerId: string) => Promise<void>,
  generate = generateCustomerId,
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const customerId = generate();
    try {
      await assign(customerId);
      return customerId;
    } catch (error: any) {
      if (error?.code !== "ER_DUP_ENTRY") throw error;
    }
  }
  throw new Error("Unable to assign a unique Customer ID");
}

export async function assignCustomerId(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getUserById(userId);
  if (!existing) throw new Error("User not found");
  if (existing.customerId) return existing.customerId;

  return reserveUniqueCustomerId(async customerId => {
      await db.update(users).set({ customerId }).where(eq(users.id, userId));
  });
}

export async function createSupportViewSession(data: {
  adminUserId: number;
  targetUserId: number;
  reason: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const inserted = await db.insert(supportViewSessions).values(data);
  const sessionId = Number(inserted[0].insertId);
  const [session] = await db
    .select()
    .from(supportViewSessions)
    .where(eq(supportViewSessions.id, sessionId))
    .limit(1);
  if (!session) throw new Error("Failed to create support-view session");
  return session;
}

export async function getActiveSupportViewSession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [session] = await db
    .select()
    .from(supportViewSessions)
    .where(
      and(
        eq(supportViewSessions.id, sessionId),
        isNull(supportViewSessions.endedAt),
        gt(supportViewSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return session;
}

export async function endSupportViewSession(sessionId: number, adminUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(supportViewSessions)
    .set({ endedAt: new Date() })
    .where(
      and(
        eq(supportViewSessions.id, sessionId),
        eq(supportViewSessions.adminUserId, adminUserId),
        isNull(supportViewSessions.endedAt),
      ),
    );
}

export async function endActiveSupportViewSessionsForAdmin(adminUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(supportViewSessions)
    .set({ endedAt: new Date() })
    .where(
      and(
        eq(supportViewSessions.adminUserId, adminUserId),
        isNull(supportViewSessions.endedAt),
      ),
    );
}

// TODO: add feature queries here as your schema grows.
