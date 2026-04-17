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

export async function sendApplicationAcceptedEmail(
  to: string,
  modelName: string,
  campaignTitle: string,
  brandName: string,
  brandProfileUrl: string,
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `🎉 You've been accepted — ${campaignTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#ec4899">Congratulations, ${modelName}! 🎉</h2>
        <p><strong>${brandName}</strong> has accepted your application for <strong>${campaignTitle}</strong>.</p>
        <p>Head to your Kailani inbox to connect with the brand and get started.</p>
        <a href="${brandProfileUrl}"
           style="display:inline-block;padding:12px 24px;background:#ec4899;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          View Brand Profile
        </a>
      </div>
    `,
  });
}

export async function sendApplicationRejectedEmail(
  to: string,
  modelName: string,
  campaignTitle: string,
  brandName: string,
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Update on your application — ${campaignTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Application update</h2>
        <p>Hi ${modelName},</p>
        <p>Thank you for applying to <strong>${campaignTitle}</strong> by ${brandName}.</p>
        <p>After careful consideration, they've decided to move forward with other candidates for this campaign. This doesn't reflect on your talent — there are plenty of other great opportunities on Kailani.</p>
        <a href="${FRONTEND}"
           style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          Browse More Campaigns
        </a>
      </div>
    `,
  });
}

export async function sendAdminVerificationAlert(userName: string, userId: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.EMAIL_FROM ?? 'admin@kailani.com';
  const url = `${FRONTEND}/admin/approvals`;
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New verification request — ${userName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>New ID verification request</h2>
        <p><strong>${userName}</strong> has submitted their ID for verification.</p>
        <a href="${url}"
           style="display:inline-block;padding:12px 24px;background:#ec4899;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          Review in Admin Panel
        </a>
      </div>
    `,
  });
}

export async function sendVerificationApprovedEmail(to: string, name: string): Promise<void> {
  const url = `${FRONTEND}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: '✓ Your Kailani verification has been approved',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#ec4899">You're verified! ✓</h2>
        <p>Hi ${name},</p>
        <p>Your identity verification has been approved. Your profile now shows a verified badge and your account has full access to the platform.</p>
        <a href="${url}"
           style="display:inline-block;padding:12px 24px;background:#ec4899;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          Go to Kailani
        </a>
      </div>
    `,
  });
}

export async function sendVerificationRejectedEmail(to: string, name: string, reason: string): Promise<void> {
  const url = `${FRONTEND}/model/verify`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your Kailani verification was not approved',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Verification not approved</h2>
        <p>Hi ${name},</p>
        <p>Unfortunately we could not verify your identity at this time.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You can submit a new verification request with clearer documents.</p>
        <a href="${url}"
           style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          Resubmit Verification
        </a>
      </div>
    `,
  });
}

export async function sendWarningEmail(to: string, name: string, reason: string): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Account warning from Kailani',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#f59e0b">Account Warning</h2>
        <p>Hi ${name},</p>
        <p>You have received a warning from the Kailani moderation team.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Please review our community guidelines. Repeated violations may result in account suspension.</p>
        <a href="${FRONTEND}"
           style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
          Go to Kailani
        </a>
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
