import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
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
};
