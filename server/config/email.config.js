import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
export const testTransporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});
export const emailTemplates = {
  verifyEmail: (token) => ({
    subject: "Verify Your Email",
    html: `
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email:</p>
      <a href="${process.env.ORIGIN}/verify-email/${token}">Verify Email</a>
    `,
  }),
  resetPassword: (token) => ({
    subject: "Reset Your Password",
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${process.env.ORIGIN}/reset-password/${token}">Reset Password</a>
    `,
  }),
  adminResetUserPassword: (token, adminEmail) => ({
    subject: "Your Password Has Been Reset by Admin",
    html: `
    <h1>Admin Has Reset Your Password</h1>
    <p>Your password has been reset by admin (${adminEmail})</p>
    <p>Click the link below to set your new password:</p>
    <a href="${process.env.ORIGIN}/reset-password/${token}">Set New Password</a>
    <p>This link will expire in 24 hours.</p>
    <p>If you have any questions, please contact admin.</p>
  `,
  }),
};
