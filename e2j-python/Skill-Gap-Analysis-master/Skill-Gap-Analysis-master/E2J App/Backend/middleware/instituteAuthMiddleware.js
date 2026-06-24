const jwt = require("jsonwebtoken");
const Institute = require("../models/Institute");

exports.instituteAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const institute = await Institute.findById(decoded.instituteId);
    if (!institute) {
      return res.status(401).json({ message: "Institute not found" });
    }
    req.institute = institute;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};