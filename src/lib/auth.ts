import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes } from "node:crypto";

const SESSION_COOKIE = "cats_session";
const SESSION_DAYS = 60;

export function newToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export async function createSession(userId: string): Promise<string> {
  const id = newToken(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await db.insert(schema.sessions).values({ id, userId, expiresAt: expires });
  const c = await cookies();
  c.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return id;
}

export async function destroySession() {
  const c = await cookies();
  const tok = c.get(SESSION_COOKIE)?.value;
  if (tok) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, tok));
  }
  c.delete(SESSION_COOKIE);
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
}

export async function currentUser(): Promise<CurrentUser | null> {
  const c = await cookies();
  const tok = c.get(SESSION_COOKIE)?.value;
  if (!tok) return null;
  const rows = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, tok), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  if (!rows.length) return null;
  const u = rows[0].user;
  return { id: u.id, email: u.email, name: u.name };
}

export async function requireUser(): Promise<CurrentUser> {
  const u = await currentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function getOrCreateUser(email: string): Promise<{ id: string; email: string; name: string | null }> {
  const norm = email.trim().toLowerCase();
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, norm)).limit(1);
  if (existing[0]) return existing[0];
  const [created] = await db.insert(schema.users).values({ email: norm }).returning();
  return created;
}
