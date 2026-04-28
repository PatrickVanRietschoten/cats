import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getActiveHousehold } from "@/lib/household";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { Onboarding } from "@/components/Onboarding";
import { LitterApp } from "@/components/LitterApp";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const hh = await getActiveHousehold(user.id);
  if (!hh) {
    return <Onboarding userEmail={user.email} />;
  }

  const [cats, settings, logs, mcpTokens] = await Promise.all([
    db.select().from(schema.cats).where(eq(schema.cats.householdId, hh.id)).orderBy(schema.cats.createdAt),
    db.select().from(schema.householdSettings).where(eq(schema.householdSettings.householdId, hh.id)).limit(1),
    db
      .select()
      .from(schema.logs)
      .where(eq(schema.logs.householdId, hh.id))
      .orderBy(desc(schema.logs.happenedAt))
      .limit(500),
    db.select().from(schema.mcpTokens).where(eq(schema.mcpTokens.householdId, hh.id)),
  ]);

  if (cats.length === 0) {
    return <Onboarding userEmail={user.email} householdName={hh.name} hasHousehold />;
  }

  const members = await db
    .select({ user: schema.users, role: schema.householdMembers.role })
    .from(schema.householdMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.householdMembers.userId))
    .where(eq(schema.householdMembers.householdId, hh.id));

  return (
    <LitterApp
      currentUser={{ id: user.id, email: user.email, name: user.name }}
      household={hh}
      cats={cats.map((c) => ({
        id: c.id,
        name: c.name,
        breed: c.breed,
        born: c.born,
        weightKg: c.weightKg,
        sex: c.sex,
        indoor: c.indoor,
        color: c.color,
        photoUrl: c.photoUrl,
      }))}
      logs={logs.map((l) => ({
        id: l.id,
        catId: l.catId,
        activitySlug: l.activitySlug,
        happenedAt: l.happenedAt.toISOString(),
        note: l.note,
        data: l.data,
        photoUrl: l.photoUrl,
        fileUrl: l.fileUrl,
        fileName: l.fileName,
        createdByLabel: l.createdByLabel,
      }))}
      settings={settings[0] ?? { accent: "#5f4b21", themeMode: "auto", density: "regular", iconStyle: "shape" }}
      mcpTokens={mcpTokens.map((t) => ({
        id: t.id,
        token: t.token,
        label: t.label,
        revokedAt: t.revokedAt?.toISOString() ?? null,
        lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
      }))}
      members={members.map((m) => ({ id: m.user.id, email: m.user.email, name: m.user.name, role: m.role }))}
    />
  );
}
