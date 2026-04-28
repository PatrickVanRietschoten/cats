import { NextResponse } from "next/server";
import { authorizeMcp, handleMcpRequest } from "@/lib/mcp";

export const runtime = "nodejs";

async function dispatch(req: Request, householdId: string, catId?: string) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const ctx = await authorizeMcp(householdId, catId, token);
  if (!ctx) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32001, message: "unauthorized" } },
      { status: 401 },
    );
  }

  if (req.method === "GET") {
    // Convenience: GET returns a quick read-only summary so users can verify
    // their endpoint in a browser.
    const [cats, logs] = await Promise.all([
      handleMcpRequest(ctx, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_cats", arguments: {} } }),
      handleMcpRequest(ctx, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "list_logs", arguments: { limit: 50 } },
      }),
    ]);
    return NextResponse.json({
      ok: true,
      mcp_endpoint: url.origin + url.pathname + "?token=…",
      hint: "POST JSON-RPC 2.0 to this same URL. Methods: initialize, tools/list, tools/call.",
      household_id: householdId,
      cat_id: catId,
      cats: (cats.result as { structuredContent?: unknown })?.structuredContent ?? null,
      logs: (logs.result as { structuredContent?: unknown })?.structuredContent ?? null,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400 });
  }
  // Allow both single and batch calls.
  if (Array.isArray(body)) {
    const results = await Promise.all(
      body.map((r) => handleMcpRequest(ctx, r as Parameters<typeof handleMcpRequest>[1])),
    );
    return NextResponse.json(results);
  }
  const res = await handleMcpRequest(ctx, body as Parameters<typeof handleMcpRequest>[1]);
  return NextResponse.json(res);
}

export async function GET(req: Request, { params }: { params: Promise<{ householdId: string }> }) {
  const { householdId } = await params;
  return dispatch(req, householdId);
}

export async function POST(req: Request, { params }: { params: Promise<{ householdId: string }> }) {
  const { householdId } = await params;
  return dispatch(req, householdId);
}
