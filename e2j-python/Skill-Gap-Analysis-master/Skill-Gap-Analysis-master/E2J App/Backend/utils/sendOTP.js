const nodemailer = require("nodemailer");
require("dotenv").config();

const sendOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Student Portal OTP Verification",
      html: `
        <h2>Your OTP Code</h2>
        <p>Your OTP for registration is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log("OTP email sent to:", email);

  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};

module.exports = sendOTP;