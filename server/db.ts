import { and, asc, eq, gte, isNull, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertSchoolItem, InsertUser, SchoolItemCategory, schoolItems, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
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
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listSchoolItems(filters: { category?: SchoolItemCategory; date?: string } = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const conditions = [];
  if (filters.category) conditions.push(eq(schoolItems.category, filters.category));
  if (filters.date) {
    conditions.push(
      and(
        lte(schoolItems.startDate, filters.date),
        or(
          gte(schoolItems.endDate, filters.date),
          and(isNull(schoolItems.endDate), eq(schoolItems.startDate, filters.date)),
        ),
      ),
    );
  }

  const query = db.select().from(schoolItems);
  const filtered = conditions.length ? query.where(and(...conditions)) : query;
  return filtered.orderBy(asc(schoolItems.startDate), asc(schoolItems.id)).limit(500);
}

export async function createSchoolItem(item: InsertSchoolItem) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(schoolItems).values(item);
}

export async function updateSchoolItem(id: number, item: Partial<InsertSchoolItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(schoolItems).set(item).where(eq(schoolItems.id, id));
}

export async function deleteSchoolItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(schoolItems).where(eq(schoolItems.id, id));
}
