// utils/email.js
const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
  const from = process.env.RESEND_FROM;

  const result = await resend.emails.send({ from, to, subject, html });

  if (result?.error) {
    console.error("❌ Resend error:", result.error);
    throw new Error(result.error.message || "Email send failed");
  }

  console.log("✅ Email sent to", to, ":", result?.data?.id);
  return result.data;
}

module.exports = { sendEmail };
