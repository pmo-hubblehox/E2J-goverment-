const mongoose = require('mongoose');
const Aspiration = require("../models/Aspiration");

// GET /aspirations/me — get all analyses for the user
exports.getUserAspirations = async (req, res) => {
  try {
    const userId = req.userId;
    const aspirations = await Aspiration.find({ userId }).sort({ createdAt: -1 });
    return res.json({ aspirations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch aspirations" });
  }
};

// GET /aspirations/:analysisId — get a specific analysis
exports.getAspirationByAnalysisId = async (req, res) => {
  try {
    const userId = req.userId;
    const { analysisId } = req.params;

    const aspiration = await Aspiration.findOne({ userId, analysisId });

    if (!aspiration) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    return res.json({ aspiration });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch aspiration" });
  }
};

// POST /aspirations — create a specific analysis
exports.createAspirations = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      goal = "",
      certifications = [],
      roleAreas = [],
      roleMatch = "",
      curriculumChoice,
      analysisMode,
      numSampleJobs,
    } = req.body;

    // Generate unique analysisId for this aspiration
    const analysisId = new mongoose.Types.ObjectId().toString();

    const normalizedCertifications = Array.isArray(certifications)
     ? certifications.filter(Boolean)
      : [];
    const normalizedRoleAreas = Array.isArray(roleAreas)
     ? roleAreas.filter(Boolean)
      : [];
    const parsedNumSampleJobs = Number(numSampleJobs);

    const aspiration = await Aspiration.create({
      userId,
      analysisId, // unique ID to satisfy userId_1_analysisId_1 index
      goal,
      certifications: normalizedCertifications,
      roleAreas: normalizedRoleAreas,
      roleMatch,
      curriculumChoice: curriculumChoice || "",
      analysisMode: typeof analysisMode === "string"? analysisMode.trim() : "",
      numSampleJobs: Number.isFinite(parsedNumSampleJobs) && parsedNumSampleJobs > 0
       ? parsedNumSampleJobs
        : null,
      aiAnalysisComplete: false,
      aiTaskId: "", // filled after startAiAnalysis returns
      aiStatus: "idle",
      aiStatusMessage: "",
      aiError: "",
      aiResult: null,
    });

    return res.status(201).json({ aspiration });
  } catch (error) {
    console.error("aspirations.createAspirations error:", error);
    return res.status(500).json({
      message: `Failed to create aspirations: ${error.message || error}`,
    });
  }
};

// PUT /aspirations/:analysisId — update aspiration, used to save aiTaskId
exports.updateAspiration = async (req, res) => {
  try {
    const userId = req.userId;
    const { analysisId } = req.params;

    const aspiration = await Aspiration.findOneAndUpdate(
      { userId, analysisId },
      { $set: req.body },
      { new: true }
    );

    if (!aspiration) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    return res.json({ aspiration });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update aspiration" });
  }
};