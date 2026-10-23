import { Resend } from "resend";

// ADR 0033: this app's first email-sending need -- a magic link for
// account recovery/bootstrap (REQ-31.3). Resend over SMTP/nodemailer: a
// single API call, no mail-server config, and it's the standard choice in
// the Vercel/Next.js ecosystem this project already deploys on. Follows
// ADR 0005's env-based secrets pattern, same as ANTHROPIC_API_KEY/
// BLOB_READ_WRITE_TOKEN.
//
// Constructed lazily inside sendMagicLinkEmail, not at module scope --
// `new Resend(undefined)` throws immediately rather than waiting until a
// send is attempted, which would crash on import alone (including by
// anything that transitively imports lib/auth.ts, e.g. lib/session.ts)
// whenever RESEND_API_KEY is unset -- defeating the graceful-fallback this
// module exists to provide.

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "ScoutBuddy <onboarding@resend.dev>";

export async function sendMagicLinkEmail(to: string, url: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // REQ-31.3 needs this path to work end-to-end in local dev without
    // requiring a real Resend account -- log the link instead of throwing,
    // same spirit as this project's other "missing external secret" fallbacks
    // (e.g. ingredient categorization's keyword fallback, ADR 0021).
    console.log(`[dev] Magic link for ${to}: ${url}`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Sign in to ScoutBuddy",
    html: `<p>Click the link below to sign in to ScoutBuddy. This link expires shortly and can only be used once.</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  });
}

// Names and unit labels come from user input, so they're escaped before
// going into the HTML body.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// REQ-34.5: the invitation link is the only place the token ever exists
// (only its hash is stored), and following it is what verifies the invited
// address (REQ-34.7).
export async function sendInvitationEmail(
  to: string,
  url: string,
  details: { unitLabel: string; roleLabel: string; inviterName: string }
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[dev] Invitation for ${to} to ${details.unitLabel}: ${url}`);
    return;
  }

  const unit = escapeHtml(details.unitLabel);
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `You're invited to ${details.unitLabel} on ScoutBuddy`,
    html: `<p>${escapeHtml(details.inviterName)} invited you to join <strong>${unit}</strong> on ScoutBuddy as ${escapeHtml(details.roleLabel)}.</p><p><a href="${url}">${url}</a></p><p>This link works once and expires in 7 days. If you weren't expecting this, you can ignore this email.</p>`,
  });
}
