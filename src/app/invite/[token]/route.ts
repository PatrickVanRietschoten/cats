import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { createSession, currentUser, getOrCreateUser } from "@/lib/auth";
import { ensureMember } from "@/lib/household";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = new URL(req.url);

  const [invite] = await db
    .select()
    .from(schema.invites)
    .where(and(eq(schema.invites.token, token), isNull(schema.invites.acceptedAt)))
    .limit(1);
  if (!invite) {
    return NextResponse.redirect(new URL("/login?error=invite_invalid", url));
  }

  let user = await currentUser();
  if (!user) {
    const u = await getOrCreateUser(invite.email);
    await createSession(u.id);
    user = { id: u.id, email: u.email, name: u.name };
  }

  await db
    .insert(schema.householdMembers)
    .values({ householdId: invite.householdId, userId: user.id, role: "member" })
    .onConflictDoNothing();

  await db.update(schema.invites).set({ acceptedAt: new Date() }).where(eq(schema.invites.token, token));

  await ensureMember(user.id, invite.householdId);

  return NextResponse.redirect(new URL("/", url));
}
