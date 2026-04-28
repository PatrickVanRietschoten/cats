"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { and, desc, eq } from "drizzle-orm";
import { destroySession, requireUser } from "@/lib/auth";
import { createHouseholdForUser, getActiveHousehold } from "@/lib/household";
import { newToken } from "@/lib/auth";

async function getCtx() {
  const user = await requireUser();
  const hh = await getActiveHousehold(user.id);
  if (!hh) throw new Error("No household");
  return { user, hh };
}

export async function createHouseholdAction(name: string, catName: string, catWeight?: number, catBreed?: string) {
  const user = await requireUser();
  const safeName = name?.trim() || `${user.email.split("@")[0]} household`;
  const hh = await createHouseholdForUser(user.id, safeName);
  if (catName?.trim()) {
    await db.insert(schema.cats).values({
      householdId: hh.id,
      name: catName.trim(),
      weightKg: catWeight && Number.isFinite(catWeight) ? catWeight : null,
      breed: catBreed?.trim() || null,
      color: pickColor(catName),
    });
  }
  revalidatePath("/");
}

function pickColor(seed: string): string {
  const palette = [
    "oklch(72% 0.05 60)",
    "oklch(70% 0.10 35)",
    "oklch(70% 0.10 280)",
    "oklch(72% 0.08 145)",
    "oklch(70% 0.10 320)",
    "oklch(72% 0.08 70)",
  ];
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

export async function addCatAction(form: FormData) {
  const { hh } = await getCtx();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await db.insert(schema.cats).values({
    householdId: hh.id,
    name,
    breed: String(form.get("breed") ?? "").trim() || null,
    weightKg: parseFloatOrNull(form.get("weightKg")),
    born: String(form.get("born") ?? "").trim() || null,
    sex: String(form.get("sex") ?? "").trim() || null,
    indoor: form.get("indoor") === "on" || form.get("indoor") === "true",
    color: pickColor(name),
  });
  revalidatePath("/");
}

export async function updateCatAction(form: FormData) {
  const { hh } = await getCtx();
  const id = String(form.get("id"));
  if (!id) return;
  await db
    .update(schema.cats)
    .set({
      name: String(form.get("name") ?? "").trim() || "Cat",
      breed: String(form.get("breed") ?? "").trim() || null,
      weightKg: parseFloatOrNull(form.get("weightKg")),
      born: String(form.get("born") ?? "").trim() || null,
      sex: String(form.get("sex") ?? "").trim() || null,
      indoor: form.get("indoor") === "on",
    })
    .where(and(eq(schema.cats.id, id), eq(schema.cats.householdId, hh.id)));
  revalidatePath("/");
}

function parseFloatOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function logActivityAction(input: {
  catId: string;
  activitySlug: string;
  happenedAt?: string;
  note?: string;
  data?: Record<string, unknown>;
  photoUrl?: string;
  fileUrl?: string;
  fileName?: string;
}) {
  const { user, hh } = await getCtx();
  const cat = await db
    .select()
    .from(schema.cats)
    .where(and(eq(schema.cats.id, input.catId), eq(schema.cats.householdId, hh.id)))
    .limit(1);
  if (!cat[0]) throw new Error("Cat not found");
  await db.insert(schema.logs).values({
    householdId: hh.id,
    catId: input.catId,
    activitySlug: input.activitySlug,
    happenedAt: input.happenedAt ? new Date(input.happenedAt) : new Date(),
    note: input.note || null,
    data: input.data ?? {},
    photoUrl: input.photoUrl || null,
    fileUrl: input.fileUrl || null,
    fileName: input.fileName || null,
    createdById: user.id,
    createdByLabel: user.name ?? user.email.split("@")[0],
  });
  revalidatePath("/");
}

export async function deleteLogAction(id: string) {
  const { hh } = await getCtx();
  await db.delete(schema.logs).where(and(eq(schema.logs.id, id), eq(schema.logs.householdId, hh.id)));
  revalidatePath("/");
}

export async function updateAppearanceAction(form: FormData) {
  const { hh } = await getCtx();
  const accent = String(form.get("accent") ?? "").trim();
  const themeMode = String(form.get("themeMode") ?? "auto");
  const iconStyle = String(form.get("iconStyle") ?? "shape");
  const density = String(form.get("density") ?? "regular");
  await db
    .update(schema.householdSettings)
    .set({ accent, themeMode, iconStyle, density })
    .where(eq(schema.householdSettings.householdId, hh.id));
  revalidatePath("/");
}

export async function createMcpTokenAction(label?: string) {
  const { hh } = await getCtx();
  const token = `rk_${newToken(18)}`;
  await db.insert(schema.mcpTokens).values({
    householdId: hh.id,
    token,
    label: label || "default",
  });
  revalidatePath("/");
  return token;
}

export async function revokeMcpTokenAction(id: string) {
  const { hh } = await getCtx();
  await db
    .update(schema.mcpTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.mcpTokens.id, id), eq(schema.mcpTokens.householdId, hh.id)));
  revalidatePath("/");
}

export async function inviteMemberAction(form: FormData) {
  const { user, hh } = await getCtx();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return;
  const token = newToken(20);
  await db.insert(schema.invites).values({
    householdId: hh.id,
    email,
    token,
    invitedBy: user.id,
  });
  // Send email with the invite link
  const { sendMail } = await import("@/lib/mail");
  const base = process.env.APP_URL ?? "http://localhost:3344";
  const link = `${base}/invite/${token}`;
  await sendMail({
    to: email,
    subject: `${user.name ?? user.email} invited you to ${hh.name} on Cat Tracker`,
    text: `Accept the invite: ${link}`,
    html: `<p>${user.name ?? user.email} invited you to join <b>${hh.name}</b> on Cat Tracker.</p><p><a href="${link}" style="background:#5f4b21;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-family:system-ui">Accept invite</a></p>`,
  });
  revalidatePath("/");
}

export async function signoutAction() {
  await destroySession();
  redirect("/login");
}

export async function listLogs(catId?: string, limit = 200) {
  const { hh } = await getCtx();
  const where = catId ? and(eq(schema.logs.householdId, hh.id), eq(schema.logs.catId, catId)) : eq(schema.logs.householdId, hh.id);
  return db
    .select()
    .from(schema.logs)
    .where(where)
    .orderBy(desc(schema.logs.happenedAt))
    .limit(limit);
}
