import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { STORE_NAME } from "./catalog";
import { appUrl, emailDeliveryEnabled } from "./config";
import { db } from "./db";
import { formatDate, inr, orderLabel } from "./format";

// Every email is recorded in email_logs. With SMTP configured it's also sent;
// without, it's only logged, and Admin → Emails shows what would have gone out.

let transport: Transporter | null = null;

function getTransport() {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!emailDeliveryEnabled()) {
    console.log(`[email] (not sent: SMTP not configured) to=${to} subject="${subject}"`);
    await db.emailLog.create({ data: { to, subject, html, status: "logged" } });
    return;
  }
  try {
    await getTransport().sendMail({
      from: process.env.EMAIL_FROM || `${STORE_NAME} <no-reply@localhost>`,
      to,
      subject,
      html,
    });
    await db.emailLog.create({ data: { to, subject, html, status: "sent" } });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[email] failed to=${to}: ${error}`);
    await db.emailLog.create({ data: { to, subject, html, status: "failed", error } });
  }
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#FFF9F0;font-family:Arial,Helvetica,sans-serif;color:#25253A">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#D02B65;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:bold">${escape(STORE_NAME)}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px">${escape(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:16px 28px;background:#F6F2EA;font-size:12px;color:#6B6B80">You're receiving this because you used ${escape(STORE_NAME)}. Need help? Just reply to this email.</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendOrderConfirmation(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: true, downloads: { include: { product: true } } },
  });
  if (!order) return;

  const base = appUrl();
  const rows = order.downloads
    .map(
      (d) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #EEE">${escape(d.product.title)}</td>
<td style="padding:10px 0;border-bottom:1px solid #EEE;text-align:right">
${d.product.file?.toLowerCase().endsWith(".pdf") ? `<a href="${base}/read/${d.downloadToken}" style="background:#D02B65;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:14px">Open book</a> ` : ""}<a href="${base}/download/${d.downloadToken}" style="background:#ffffff;color:#D02B65;border:2px solid #D02B65;text-decoration:none;padding:6px 12px;border-radius:8px;font-size:14px">Download</a>
</td></tr>`,
    )
    .join("");
  const expires = order.downloads[0]?.expiresAt;
  const limit = order.downloads[0]?.maxDownloads;

  const body = `<p style="margin:0 0 16px">Hi ${escape(order.user.name)}, thank you for your order ${orderLabel(order.number)}${
    order.amount > 0 ? ` of <strong>${inr(order.amount)}</strong>` : ""
  }. Your files are ready.</p>
<table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<p style="margin:16px 0 0;font-size:13px;color:#6B6B80">Each link works for ${limit} downloads${
    expires ? ` until ${formatDate(expires)}` : ""
  }. Downloads don't count when you read online. You can also find everything on <a href="${base}/order/${order.id}" style="color:#D02B65">your order page</a>.</p>`;

  await sendEmail({
    to: order.user.email,
    subject: `Your downloads are ready (order ${orderLabel(order.number)})`,
    html: layout("Your downloads are ready", body),
  });
}

export async function sendLoginLink(to: string, link: string) {
  const body = `<p style="margin:0 0 20px">Use the button below to see your orders and downloads. The link works once and expires in 30 minutes.</p>
<p><a href="${link}" style="background:#D02B65;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold">View my orders</a></p>
<p style="margin:20px 0 0;font-size:13px;color:#6B6B80">If you didn't ask for this, you can ignore this email.</p>`;
  await sendEmail({ to, subject: `Your ${STORE_NAME} sign-in link`, html: layout("Sign in to see your orders", body) });
}
