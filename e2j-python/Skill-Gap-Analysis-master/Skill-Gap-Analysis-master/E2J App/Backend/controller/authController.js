const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateOTP = require("../utils/generateOTP");
const sendOTP = require("../utils/sendOTP");

// SEND OTP
exports.sendOTP = async (req, res) => {
  try {
    const { email, flow } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingUser = await User.findOne({ email });

    if (flow === "forgot" || flow === "reset") {
      if (!existingUser) {
        return res.status(404).json({ message: "Email not registered" });
      }
    } else {
      // signup flow
      if (existingUser) {
        return res.status(400).json({ message: "User already registered" });
      }
      // ENFORCE: email must exist in InstituteStudent
      const InstituteStudent = require("../models/InstituteStudent");
      const instStudent = await InstituteStudent.findOne({ email });
      if (!instStudent) {
        return res.status(400).json({ message: "This email is not registered by any institute" });
      }
    }

    const otp = generateOTP();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      expiresAt,
    });

    await sendOTP(email, otp);

    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending OTP" });
  }
};


// VERIFY OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.json({ message: "OTP verified" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "OTP verification failed" });
  }
};


// CREATE PASSWORD (REGISTER USER)
exports.createPassword = async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password is required"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must contain 8 characters, one uppercase, one number and one special character"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: "student",
      isVerified: true
    });

    res.json({
      message: "Account created successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Account creation failed"
    });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not registered" });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ message: "Password must contain 8 characters, one uppercase, one number and one special character" });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Password reset failed" });
  }
};


// LOGIN USER
exports.loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("Match result:", isMatch);

    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password"
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const InstituteStudent = require("../models/InstituteStudent");
    const instStudent = await InstituteStudent.findOne({ email });
    const name = instStudent?.name || "";

    res.json({
      message: "Login successful",
      token,
      name,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Login failed"
    });
  }
};