import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || "noreply@pilotzap.com";

  if (!host || !user || !pass) {
    console.warn("⚠️  SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars.");
    return null;
  }

  return { transporter: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }), from };
}

export async function sendPasswordResetCode(toEmail: string, code: string): Promise<boolean> {
  const config = getTransporter();
  if (!config) return false;

  const { transporter, from } = config;
  const appName = "Pilot Zap";

  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to: toEmail,
      subject: `${appName} — Código de redefinição de senha`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f0f17;border-radius:12px;border:1px solid #2d2d3d">
          <h2 style="color:#a855f7;margin:0 0 8px">Pilot Zap</h2>
          <p style="color:#9ca3af;margin:0 0 24px;font-size:14px">Automação para WhatsApp</p>
          <h3 style="color:#f3f4f6;margin:0 0 12px">Redefinição de senha</h3>
          <p style="color:#d1d5db;font-size:14px;margin:0 0 24px">
            Use o código abaixo para redefinir sua senha. Ele expira em <strong>15 minutos</strong>.
          </p>
          <div style="background:#1e1e2e;border:1px solid #7c3aed;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px">
            <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#a855f7">${code}</span>
          </div>
          <p style="color:#6b7280;font-size:12px;margin:0">
            Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha não será alterada.
          </p>
        </div>
      `,
      text: `Seu código de redefinição de senha Pilot Zap: ${code}\n\nExpira em 15 minutos.\n\nSe não foi você, ignore este e-mail.`,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
