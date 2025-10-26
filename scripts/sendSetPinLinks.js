require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

async function main() {
  await mongoose.connect(process.env.DB_URL);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const users = await User.find({ pin6: { $exists: false }, email: { $ne: null } }).select("_id email");
  for (const u of users) {
    const token = crypto.randomBytes(32).toString("hex");
    u.resetToken = token;
    u.resetTokenExpires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // صلاحية 14 يوم
    await u.save();

    const link = `${process.env.FRONTEND_BASE_URL || "https://sy-dallal.sy"}/set-pin/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: u.email,
      subject: "إلزامي: ضبط PIN لحسابك في Dallal",
      html: `<p>للاستمرار باستخدام حسابك يرجى ضبط PIN (6 أرقام):</p>
             <p><a href="${link}">${link}</a></p>
             <p>هذا الرابط صالح لمدة 14 يوم.</p>`
    });

    console.log("Sent set-PIN link to", u.email);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
