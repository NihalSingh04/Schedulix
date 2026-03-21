import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text }) => {
  try {

    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log(
      "EMAIL_PASS:",
      process.env.EMAIL_PASS ? "Loaded ✅" : "Missing ❌"
    );

    /* ===============================
       CREATE TRANSPORTER
    =============================== */

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    /* ===============================
       SEND EMAIL
    =============================== */

    const info = await transporter.sendMail({
      from: `"Schedio" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log("📧 Email sent successfully");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);

  } catch (error) {

    console.error("❌ Email sending failed");
    console.error(error.message);

  }
};