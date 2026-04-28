import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";

export interface ActiveHousehold {
  id: string;
  name: string;
  role: string;
}

// Each user has exactly one "active" household at a time. v1: pick the first
// household the user is a member of.
export async function getActiveHousehold(userId: string): Promise<ActiveHousehold | null> {
  const rows = await db
    .select({ h: schema.households, m: schema.householdMembers })
    .from(schema.householdMembers)
    .innerJoin(schema.households, eq(schema.households.id, schema.householdMembers.householdId))
    .where(eq(schema.householdMembers.userId, userId))
    .limit(1);
  if (!rows.length) return null;
  return { id: rows[0].h.id, name: rows[0].h.name, role: rows[0].m.role };
}

export async function ensureMember(userId: string, householdId: string): Promise<boolean> {
  const r = await db
    .select()
    .from(schema.householdMembers)
    .where(
      and(
        eq(schema.householdMembers.householdId, householdId),
        eq(schema.householdMembers.userId, userId),
      ),
    )
    .limit(1);
  return !!r[0];
}

export async function createHouseholdForUser(userId: string, name: string): Promise<ActiveHousehold> {
  const [h] = await db.insert(schema.households).values({ name }).returning();
  await db.insert(schema.householdMembers).values({
    householdId: h.id,
    userId,
    role: "owner",
  });
  await db.insert(schema.householdSettings).values({ householdId: h.id }).onConflictDoNothing();
  return { id: h.id, name: h.name, role: "owner" };
}
