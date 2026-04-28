import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { currentUser } from "@/lib/auth";
import { getActiveHousehold } from "@/lib/household";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const hh = await getActiveHousehold(user.id);
  if (!hh) return NextResponse.json({ error: "no household" }, { status: 400 });

  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  // Local dev fallback: store as base64 data URL so the app keeps working
  // without configuring Vercel Blob.
  if (!token) {
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "file too large for dev mode (5MB)" }, { status: 413 });
    }
    const url = `data:${file.type};base64,${buf.toString("base64")}`;
    return NextResponse.json({ url, name: file.name });
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const key = `${hh.id}/${Date.now()}-${safeName}`;
  const blob = await put(key, file, {
    access: "public",
    token,
    addRandomSuffix: false,
  });
  return NextResponse.json({ url: blob.url, name: file.name });
}
