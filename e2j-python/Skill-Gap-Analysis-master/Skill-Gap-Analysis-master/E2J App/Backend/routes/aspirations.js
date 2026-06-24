const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getUserAspirations,
  createAspirations,
  getAspirationByAnalysisId,   // ← add this
} = require("../controller/aspirationController");

router.use(authMiddleware);

router.get("/me", getUserAspirations);
router.get("/:analysisId", getAspirationByAnalysisId);  // ← add this route
router.post("/", createAspirations);

module.exports = router;