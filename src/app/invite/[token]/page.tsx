import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { currentUser, getOrCreateUser, createSession } from "@/lib/auth";
import { ensureMember } from "@/lib/household";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invite] = await db
    .select()
    .from(schema.invites)
    .where(and(eq(schema.invites.token, token), isNull(schema.invites.acceptedAt)))
    .limit(1);
  if (!invite) {
    return <Centered title="Invite not found">This invite link is invalid or has already been used.</Centered>;
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

  // Make sure they're now in the household
  await ensureMember(user.id, invite.householdId);
  redirect("/");
}

function Centered({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 380, padding: 28, background: "var(--paper)", borderRadius: 18, textAlign: "center" }}>
        <h1 style={{ fontFamily: '"Crimson Pro", Georgia, serif', fontWeight: 500 }}>{title}</h1>
        <p style={{ color: "var(--ink-soft)" }}>{children}</p>
      </div>
    </main>
  );
}
