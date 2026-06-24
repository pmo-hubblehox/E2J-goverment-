const express = require("express");
const router = express.Router();

const {
  sendOTP,
  verifyOTP,
  createPassword,
  resetPassword,
  loginUser
} = require("../controller/authController");

router.post("/send-otp", sendOTP);

router.post("/verify-otp", verifyOTP);

router.post("/register", createPassword);
router.post("/create-password", createPassword); // fallback for compatibility
router.post("/reset-password", resetPassword);

router.post("/login", loginUser);

module.exports = router;