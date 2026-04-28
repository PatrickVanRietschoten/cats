import { db, schema } from "@/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { BUILTIN_ACTIVITIES, BUILTIN_BY_SLUG } from "./activities";

export interface McpContext {
  householdId: string;
  catId?: string;
  tokenId: string;
}

// Validate ?token= against the household's mcp_tokens; returns ctx or null.
export async function authorizeMcp(
  householdId: string,
  catId: string | undefined,
  token: string | null,
): Promise<McpContext | null> {
  if (!token) return null;
  const [row] = await db
    .select()
    .from(schema.mcpTokens)
    .where(
      and(
        eq(schema.mcpTokens.householdId, householdId),
        eq(schema.mcpTokens.token, token),
        isNull(schema.mcpTokens.revokedAt),
      ),
    )
    .limit(1);
  if (!row) return null;
  // touch lastUsedAt async; not awaited
  void db
    .update(schema.mcpTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.mcpTokens.id, row.id));

  if (catId) {
    const [c] = await db
      .select()
      .from(schema.cats)
      .where(and(eq(schema.cats.id, catId), eq(schema.cats.householdId, householdId)))
      .limit(1);
    if (!c) return null;
  }
  return { householdId, catId, tokenId: row.id };
}

interface JsonRpcReq {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcRes {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

const SERVER_INFO = {
  name: "cat-tracker",
  version: "0.1.0",
};

const TOOLS = [
  {
    name: "list_cats",
    description: "List all cats in the household.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_logs",
    description: "List recent activity logs. Filter by cat_id and/or activity_slug. Returns up to `limit` entries (default 100, max 500).",
    inputSchema: {
      type: "object",
      properties: {
        cat_id: { type: "string", description: "UUID of the cat to filter by." },
        activity_slug: { type: "string", description: "Activity slug e.g. 'poop', 'eat-wet'." },
        limit: { type: "number", default: 100 },
        since: { type: "string", description: "ISO timestamp; only logs at or after this time are returned." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "list_activities",
    description: "List the activity taxonomy (built-in slugs + labels + categories).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "log_activity",
    description: "Record an activity log for a cat. Required: cat_id, activity_slug. Optional: happened_at (ISO), note, data (object).",
    inputSchema: {
      type: "object",
      properties: {
        cat_id: { type: "string" },
        activity_slug: { type: "string" },
        happened_at: { type: "string", description: "ISO 8601; defaults to now." },
        note: { type: "string" },
        data: { type: "object", description: "Activity-specific structured fields, e.g. {amount:'medium',consistency:4}." },
      },
      required: ["cat_id", "activity_slug"],
      additionalProperties: false,
    },
  },
  {
    name: "add_cat",
    description: "Add a new cat to the household.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        breed: { type: "string" },
        born: { type: "string", description: "ISO date YYYY-MM-DD" },
        weight_kg: { type: "number" },
        sex: { type: "string", enum: ["M", "F"] },
        indoor: { type: "boolean" },
      },
      required: ["name"],
      additionalProperties: false,
    },
  },
];

function err(id: string | number | null, code: number, message: string): JsonRpcRes {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

export async function handleMcpRequest(ctx: McpContext, req: JsonRpcReq): Promise<JsonRpcRes> {
  const id = req.id ?? null;
  if (req.jsonrpc !== "2.0" || typeof req.method !== "string") {
    return err(id, -32600, "Invalid Request");
  }
  try {
    switch (req.method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: SERVER_INFO,
          },
        };
      case "ping":
        return { jsonrpc: "2.0", id, result: {} };
      case "tools/list":
        return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
      case "tools/call": {
        const params = req.params as { name?: string; arguments?: Record<string, unknown> } | undefined;
        const name = params?.name;
        const args = params?.arguments ?? {};
        if (!name) return err(id, -32602, "Missing tool name");
        const result = await callTool(ctx, name, args);
        return { jsonrpc: "2.0", id, result };
      }
      default:
        return err(id, -32601, `Method not found: ${req.method}`);
    }
  } catch (e) {
    return err(id, -32000, e instanceof Error ? e.message : "Internal error");
  }
}

async function callTool(ctx: McpContext, name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "list_cats":
      return content(await listCats(ctx));
    case "list_logs":
      return content(await listLogs(ctx, args));
    case "list_activities":
      return content({
        activities: BUILTIN_ACTIVITIES.map((a) => ({
          slug: a.slug,
          label: a.label,
          category: a.category,
          fields: a.fields,
        })),
      });
    case "log_activity":
      return content(await logActivity(ctx, args));
    case "add_cat":
      return content(await addCat(ctx, args));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function content(payload: unknown) {
  return {
    content: [
      { type: "text", text: JSON.stringify(payload, null, 2) },
    ],
    structuredContent: payload,
  };
}

async function listCats(ctx: McpContext) {
  const where = ctx.catId
    ? and(eq(schema.cats.householdId, ctx.householdId), eq(schema.cats.id, ctx.catId))
    : eq(schema.cats.householdId, ctx.householdId);
  const cats = await db.select().from(schema.cats).where(where);
  return { cats: cats.map(serializeCat) };
}

function serializeCat(c: typeof schema.cats.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    breed: c.breed,
    born: c.born,
    weight_kg: c.weightKg,
    sex: c.sex,
    indoor: c.indoor,
  };
}

async function listLogs(ctx: McpContext, args: Record<string, unknown>) {
  const limit = clampInt(args.limit, 100, 1, 500);
  const filterCat = (args.cat_id as string | undefined) ?? ctx.catId;
  const slug = args.activity_slug as string | undefined;
  const since = args.since as string | undefined;

  const conds = [eq(schema.logs.householdId, ctx.householdId)];
  if (filterCat) conds.push(eq(schema.logs.catId, filterCat));
  if (slug) conds.push(eq(schema.logs.activitySlug, slug));

  let rows = await db
    .select()
    .from(schema.logs)
    .where(and(...conds))
    .orderBy(desc(schema.logs.happenedAt))
    .limit(limit);

  if (since) {
    const t = new Date(since).getTime();
    if (!Number.isNaN(t)) rows = rows.filter((r) => r.happenedAt.getTime() >= t);
  }
  return {
    logs: rows.map((l) => ({
      id: l.id,
      cat_id: l.catId,
      activity_slug: l.activitySlug,
      happened_at: l.happenedAt.toISOString(),
      note: l.note,
      data: l.data,
      photo_url: l.photoUrl,
      file_url: l.fileUrl,
      created_by: l.createdByLabel,
    })),
  };
}

async function logActivity(ctx: McpContext, args: Record<string, unknown>) {
  const catId = (args.cat_id as string | undefined) ?? ctx.catId;
  const slug = args.activity_slug as string | undefined;
  if (!catId) throw new Error("cat_id is required (or use a per-cat endpoint)");
  if (!slug) throw new Error("activity_slug is required");
  if (!BUILTIN_BY_SLUG[slug]) throw new Error(`Unknown activity_slug: ${slug}`);
  // confirm cat belongs to household
  const [cat] = await db
    .select()
    .from(schema.cats)
    .where(and(eq(schema.cats.id, catId), eq(schema.cats.householdId, ctx.householdId)))
    .limit(1);
  if (!cat) throw new Error("cat not found in this household");

  const happenedAt = (args.happened_at as string | undefined) ? new Date(String(args.happened_at)) : new Date();
  if (Number.isNaN(happenedAt.getTime())) throw new Error("Invalid happened_at");

  const [created] = await db
    .insert(schema.logs)
    .values({
      householdId: ctx.householdId,
      catId,
      activitySlug: slug,
      happenedAt,
      note: (args.note as string | undefined) ?? null,
      data: (args.data as Record<string, unknown> | undefined) ?? {},
      createdByLabel: "MCP",
    })
    .returning();
  return {
    log: {
      id: created.id,
      cat_id: created.catId,
      activity_slug: created.activitySlug,
      happened_at: created.happenedAt.toISOString(),
    },
  };
}

async function addCat(ctx: McpContext, args: Record<string, unknown>) {
  const name = String(args.name ?? "").trim();
  if (!name) throw new Error("name is required");
  const [created] = await db
    .insert(schema.cats)
    .values({
      householdId: ctx.householdId,
      name,
      breed: (args.breed as string | undefined) ?? null,
      born: (args.born as string | undefined) ?? null,
      weightKg: typeof args.weight_kg === "number" ? args.weight_kg : null,
      sex: (args.sex as string | undefined) ?? null,
      indoor: typeof args.indoor === "boolean" ? args.indoor : true,
      color: pickColor(name),
    })
    .returning();
  return { cat: serializeCat(created) };
}

function clampInt(v: unknown, def: number, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
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
