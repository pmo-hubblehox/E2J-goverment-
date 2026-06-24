const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  startAiAnalysis,
  getAiAnalysisStatus,
  getAiAnalysisResult,
  suggestAiPositions,
} = require("../controller/aiAnalysisController");

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer disk storage with unique timestamped filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });
// Apply authentication middleware to all routes in this router


router.use(authMiddleware);

router.post("/analyze", upload.single("resume_file"), startAiAnalysis);
router.get("/status/:taskId", getAiAnalysisStatus);
router.get("/result/:taskId", getAiAnalysisResult);
router.post("/suggest-positions", suggestAiPositions);

module.exports = router;
