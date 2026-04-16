import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'Kailani <noreply@kailani.com>';
const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:3000';

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const url = `${FRONTEND}/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verify your Kailani account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Welcome to Kailani</h2>
        <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
        <a href="${url}"
           style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          Verify Email
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px">
          Or copy this link: <a href="${url}">${url}</a>
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const url = `${FRONTEND}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your Kailani password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Reset your password</h2>
        <p>Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${url}"
           style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          Reset Password
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px">
          Or copy this link: <a href="${url}">${url}</a>
        </p>
        <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
