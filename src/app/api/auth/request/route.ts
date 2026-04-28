import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { newToken } from "@/lib/auth";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const emailRaw = String(body?.email ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(emailRaw)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }
  const token = newToken(32);
  const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await db.insert(schema.magicLinks).values({ token, email: emailRaw, expiresAt: expires });

  const url = new URL(req.url);
  const base = process.env.APP_URL ?? `${url.protocol}//${url.host}`;
  const link = `${base}/auth/verify?token=${encodeURIComponent(token)}`;

  await sendMail({
    to: emailRaw,
    subject: "Your Cat Tracker sign-in link",
    text: `Tap to sign in: ${link}\n\nExpires in 30 minutes. If you didn't request this, ignore.`,
    html: `<p>Tap to sign in to <b>Cat Tracker</b>:</p>
<p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#5f4b21;color:#fff;border-radius:10px;text-decoration:none;font-family:system-ui">Sign in</a></p>
<p style="font-size:12px;color:#888">Expires in 30 minutes.</p>`,
  });

  return NextResponse.json({ ok: true });
}
