import { readFile } from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";
import { resendEmailAllowed, resolveSmtpConfig } from "@/lib/integration-settings";
import { Resend } from "resend";
import type { DraftState } from "@/lib/drafts";
import {
  generateInvoiceEmailHtml,
  generateInvoicePlainText,
} from "@/lib/invoice-email-html";
import { buildInvoicePdfAttachment } from "@/lib/invoice-email-attachment";
import { buildInvoicePaymentLink } from "@/lib/stripe-checkout";

function getPublicAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`;
  }
  return "http://localhost:3000";
}

export async function loadServerLogoDataUrl(): Promise<string | undefined> {
  try {
    const buffer = await readFile(
      path.join(process.cwd(), "public", "overdrive-logo.png")
    );
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export function getHostedLogoUrl(): string {
  return `${getPublicAppUrl()}/overdrive-logo.png`;
}

export function buildInvoiceEmailSubject(state: DraftState): string {
  return `${state.docType} ${state.client.documentNumber} — ${(state.client.projectName ?? "").trim() || "Over Drive OS"}`;
}

export async function buildInvoiceEmailBodies(
  state: DraftState,
  to: string,
  logoUrl?: string,
  existingPaymentUrl?: string | null
): Promise<{
  html: string;
  plainText: string;
  paymentUrl: string | null;
  pdfAttachment: Awaited<ReturnType<typeof buildInvoicePdfAttachment>>;
  subject: string;
}> {
  const subject = buildInvoiceEmailSubject(state);
  const paymentUrl =
    state.docType === "Invoice"
      ? existingPaymentUrl !== undefined
        ? existingPaymentUrl
        : buildInvoicePaymentLink(state, to)
      : null;
  const pdfAttachment = await buildInvoicePdfAttachment(state);
  const logo = logoUrl ?? getHostedLogoUrl();
  const html = generateInvoiceEmailHtml(state, {
    logoUrl: logo,
    paymentUrl,
  });
  const plainText = generateInvoicePlainText(state, {
    paymentUrl,
    pdfAttachmentFilename: pdfAttachment.filename,
  });

  return {
    html,
    plainText,
    paymentUrl,
    pdfAttachment,
    subject,
  };
}

export function hasSmtpConfig(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

export function hasResendConfig(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function hasEmailConfig(): boolean {
  return hasSmtpConfig() || hasResendConfig();
}

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    (process.env.SMTP_USER?.trim()
      ? `Over Drive OS <${process.env.SMTP_USER.trim()}>`
      : "") ||
    "Over Drive OS <admin@overdriveio.com>"
  );
}

function isResendTestModeError(message: string): boolean {
  return (
    message.includes("only send testing emails") ||
    message.includes("domain is not verified")
  );
}

export async function emailDeliveryEnabled(): Promise<boolean> {
  if (await resolveSmtpConfig()) return true;
  return resendEmailAllowed();
}

function fromAddressFor(user: string): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    (user ? `Over Drive OS <${user}>` : "") ||
    "Over Drive OS <admin@overdriveio.com>"
  );
}

export async function sendPlainEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const smtp = await resolveSmtpConfig();
  const html = `<p>${input.text.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`;
  if (smtp) {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
    });
    await transporter.sendMail({
      from: fromAddressFor(smtp.user),
      to: input.to,
      subject: input.subject,
      html,
      text: input.text,
    });
    return;
  }
  if (!(await resendEmailAllowed())) {
    throw new Error("Email is not configured.");
  }
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: [input.to],
    subject: input.subject,
    html,
    text: input.text,
  });
  if (error) throw new Error(error.message || "Failed to send email");
}

export async function sendInvoiceEmail(
  state: DraftState,
  to: string
): Promise<void> {
  if (await resolveSmtpConfig()) {
    await sendInvoiceViaSmtp(state, to);
    return;
  }

  if (await resendEmailAllowed()) {
    try {
      await sendInvoiceViaResend(state, to);
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send email";
      if (isResendTestModeError(message)) {
        throw new Error(
          "Email is in Resend test mode. Add Hostinger SMTP credentials (SMTP_PASS for admin@overdriveio.com) in Vercel, or verify overdriveio.com at resend.com/domains."
        );
      }
      throw error;
    }
  }

  throw new Error(
    "Email is not configured. Add Hostinger SMTP credentials for admin@overdriveio.com in Vercel environment variables."
  );
}

export async function sendInvoiceViaResend(
  state: DraftState,
  to: string
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const logo = await loadServerLogoDataUrl();
  const { html, plainText, subject, pdfAttachment } =
    await buildInvoiceEmailBodies(state, to, logo ?? getHostedLogoUrl());

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: [to],
    subject,
    html,
    text: plainText,
    attachments: [
      {
        filename: pdfAttachment.filename,
        content: pdfAttachment.content,
        contentType: "application/pdf",
      },
    ],
  });

  if (error) {
    throw new Error(error.message || "Failed to send email");
  }
}

export async function sendInvoiceViaSmtp(
  state: DraftState,
  to: string
): Promise<void> {
  const logo = await loadServerLogoDataUrl();
  const { html, plainText, subject, pdfAttachment } =
    await buildInvoiceEmailBodies(state, to, logo ?? getHostedLogoUrl());

  const smtp = await resolveSmtpConfig();
  if (!smtp) throw new Error("Email is not configured.");

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  await transporter.sendMail({
    from: fromAddressFor(smtp.user),
    to,
    subject,
    html,
    text: plainText,
    attachments: [
      {
        filename: pdfAttachment.filename,
        content: pdfAttachment.content,
        contentType: "application/pdf",
        contentDisposition: "attachment",
      },
    ],
    headers: {
      "Color-Scheme": "light",
      "X-Color-Scheme": "light",
    },
  });
}
