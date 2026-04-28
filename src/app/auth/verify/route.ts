import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import { createSession, getOrCreateUser } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login?error=missing", url));

  const [row] = await db
    .select()
    .from(schema.magicLinks)
    .where(
      and(
        eq(schema.magicLinks.token, token),
        gt(schema.magicLinks.expiresAt, new Date()),
        isNull(schema.magicLinks.consumedAt),
      ),
    )
    .limit(1);
  if (!row) return NextResponse.redirect(new URL("/login?error=invalid", url));

  await db
    .update(schema.magicLinks)
    .set({ consumedAt: new Date() })
    .where(eq(schema.magicLinks.token, token));

  const user = await getOrCreateUser(row.email);
  await createSession(user.id);

  return NextResponse.redirect(new URL("/", url));
}
