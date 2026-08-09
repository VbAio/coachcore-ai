import { Resend } from 'resend';

import { getConfiguredAppUrl } from '@/lib/auth/app-url';

function getResend() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

function getFromEmail() {
  return process.env.EMAIL_FROM ?? 'CoachCore AI <noreply@coachcore.ai>';
}

export type SendEmailResult = {
  ok: boolean;
  /** Present when ok is false — safe to show in admin/dev UI or logs. */
  error?: string;
  /** True when the email was only printed to the server console (local/dev). */
  loggedOnly?: boolean;
};

function allowConsoleEmailFallback(): boolean {
  // Never pretend a real send happened in production / on Vercel.
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return false;
  }
  return process.env.ALLOW_CONSOLE_EMAIL !== '0';
}

async function sendEmail(to: string, subject: string, html: string): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) {
    if (allowConsoleEmailFallback()) {
      console.log(`[email:dev] To: ${to}\nSubject: ${subject}\n${html}`);
      return { ok: true, loggedOnly: true };
    }
    console.error('[email] RESEND_API_KEY is not set — cannot send email');
    return {
      ok: false,
      error:
        'Email delivery is not configured. Set RESEND_API_KEY (and EMAIL_FROM) in your deployment environment.',
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to,
      subject,
      html,
    });
    if (error) {
      console.error('[email] Send failed:', error);
      return {
        ok: false,
        error: error.message || 'Resend rejected the email. Check EMAIL_FROM domain verification.',
      };
    }
    console.log('[email] Sent', { to, id: data?.id });
    return { ok: true };
  } catch (err) {
    console.error('[email] Send error:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to send email',
    };
  }
}

function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid rgba(147,51,234,0.3);border-radius:16px;padding:40px;">
        <tr><td style="text-align:center;padding-bottom:24px;">
          <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#9333ea,#6366f1);color:#fff;font-weight:bold;font-size:18px;line-height:48px;">CC</div>
          <h1 style="color:#fff;font-size:24px;margin:16px 0 0;">CoachCore AI</h1>
        </td></tr>
        <tr><td style="color:#d4d4d8;font-size:15px;line-height:1.6;">${content}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  username: string
): Promise<SendEmailResult> {
  const url = `${getConfiguredAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const html = emailLayout(`
    <p>Hey <strong style="color:#fff;">${username}</strong>,</p>
    <p>Welcome to CoachCore AI! Verify your email to unlock saving heroes, replays, and synced settings across devices.</p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#9333ea,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Verify Email</a>
    </p>
    <p style="color:#71717a;font-size:13px;">Or paste this link into your browser:</p>
    <p style="color:#a78bfa;font-size:12px;word-break:break-all;">${url}</p>
    <p style="color:#71717a;font-size:13px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
  `);
  return sendEmail(email, 'Verify your CoachCore AI account', html);
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<SendEmailResult> {
  const url = `${getConfiguredAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const html = emailLayout(`
    <p>We received a request to reset your password.</p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#9333ea,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Reset Password</a>
    </p>
    <p style="color:#71717a;font-size:13px;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
  `);
  return sendEmail(email, 'Reset your CoachCore AI password', html);
}

export async function sendEmailChangeConfirmation(
  email: string,
  token: string
): Promise<SendEmailResult> {
  const url = `${getConfiguredAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const html = emailLayout(`
    <p>Confirm your new email address for CoachCore AI.</p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#9333ea,#6366f1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Confirm Email</a>
    </p>
    <p style="color:#71717a;font-size:13px;">This link expires in 24 hours.</p>
  `);
  return sendEmail(email, 'Confirm your new email address', html);
}
