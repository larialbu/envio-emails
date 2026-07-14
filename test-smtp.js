const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: (process.env.SMTP_HOST || "smtp.ethereal.email").trim(),
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: (process.env.SMTP_USER || "").trim(),
    pass: (process.env.SMTP_PASS || "").trim(),
  },
  debug: true,
  logger: true
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("Error:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});
