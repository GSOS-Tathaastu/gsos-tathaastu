import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { to, subject, html } = await req.json();

  if (!to || !subject || !html) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM || "GSOS TATHAASTU <info@tathaastu.global>";

  if (!host || !user || !pass) {
    return Response.json({ error: "smtp_not_configured" }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host, port, secure: port === 465, auth: { user, pass }
  });

  await transporter.sendMail({ from, to, subject, html });

  return Response.json({ ok: true });
}
