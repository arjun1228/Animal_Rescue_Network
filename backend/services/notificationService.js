const Notification = require('../models/Notification');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// ─── Email transporter (only created if env vars are set) ────────────────────
const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ─── Send email (non-blocking, silent failure) ───────────────────────────────
const sendEmail = async (to, subject, text) => {
  const transporter = getTransporter();
  if (!transporter) return; // skip if SMTP not configured
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `Animal Rescue Network <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
  }
};

// ─── Core function: save in-app notification + send email ────────────────────
const sendNotification = async (userId, type, message) => {
  try {
    // Save to DB (in-app)
    await Notification.create({ userId, type, message });

    // Send email to the user
    const user = await User.findById(userId).select('email name');
    if (user?.email) {
      await sendEmail(
        user.email,
        `Animal Rescue Network — ${type.replace(/_/g, ' ')}`,
        `Hi ${user.name},\n\n${message}\n\n— Animal Rescue Network Team`
      );
    }
  } catch (err) {
    console.error('[Notification] Error:', err.message);
  }
};

// ─── Helper: fetch the first admin user from DB ──────────────────────────────
const getAdminUser = async () => {
  return await User.findOne({ role: 'admin' }).select('_id email name');
};

module.exports = { sendNotification, getAdminUser };
