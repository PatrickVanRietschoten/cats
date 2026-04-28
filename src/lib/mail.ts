// Minimal Mailgun EU sender. No external deps.
const KEY = process.env.MAILGUN_KEY ?? "";
const DOMAIN = process.env.MAILGUN_DOMAIN ?? "";
const HOST = process.env.MAILGUN_HOST ?? "api.eu.mailgun.net";
const FROM = process.env.MAIL_FROM ?? `Cat Tracker <noreply@${DOMAIN}>`;

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(opts: MailOptions): Promise<void> {
  if (!KEY || !DOMAIN) {
    console.log("[mail:dev]", opts.to, "→", opts.subject, "\n", opts.text);
    return;
  }
  const auth = Buffer.from(`api:${KEY}`).toString("base64");
  const body = new URLSearchParams();
  body.set("from", FROM);
  body.set("to", opts.to);
  body.set("subject", opts.subject);
  body.set("text", opts.text);
  if (opts.html) body.set("html", opts.html);
  const res = await fetch(`https://${HOST}/v3/${DOMAIN}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Mailgun error", res.status, text);
    throw new Error(`Mailgun ${res.status}: ${text}`);
  }
}
