const Aspiration = require("../models/Aspiration");
const StudentProfile = require("../models/StudentProfile");
const InstituteStudent = require("../models/InstituteStudent");
const Program = require("../models/Program");
const {
  startAnalysis,
  getAnalysisStatus,
  getAnalysisResult,
  suggestPositions,
} = require("../utils/aiAnalysisClient");
const { ALLOWED_CURRICULA, resolveCurriculumChoice } = require("../utils/curriculumResolver");

// ─────────────────────────────────────────────────────────────
// Helper: Pick resume from profile
// ─────────────────────────────────────────────────────────────
function pickResume(profile) {
  const resumes = Array.isArray(profile?.resumes) ? profile.resumes : [];
  return (
    resumes.find((resume) => resume?.isPrimary && resume?.url) ||
    resumes.find((resume) => resume?.url) ||
    null
  );
}

// ─────────────────────────────────────────────────────────────
// Helper: Get full user context
// ─────────────────────────────────────────────────────────────

async function getUserContext(userId, userEmail) {
  const [profile, instituteStudent] = await Promise.all([
    StudentProfile.findOne({ email: userEmail }),
    InstituteStudent.findOne({ email: userEmail }),
  ]);

  if (!profile) {
    return {
      error: {
        status: 404,
        message: "Profile not found. Complete your profile to continue.",
      },
    };
  }

  const resume = pickResume(profile);
  if (!resume?.url) {
    return {
      error: {
        status: 400,
        message:
          "A usable profile resume was not found. Please upload a resume with a stored file URL before generating the AI report.",
      },
    };
  }

  let program = null;
  if (instituteStudent?.instituteId) {
    program = await Program.findOne({
      instituteId: instituteStudent.instituteId,
      $or: [
        { name: instituteStudent.program },
        { programId: instituteStudent.program },
      ],
    });
  }

  const curriculumChoice = resolveCurriculumChoice({
    instituteStudent,
    program,
    profile,
  });

  // ✅ No longer returns aspiration - it gets created in startAiAnalysis
  return { profile, resume, curriculumChoice };
}

// ─────────────────────────────────────────────────────────────
// START AI ANALYSIS (PROFILE-ONLY FLOW)
// ─────────────────────────────────────────────────────────────
exports.startAiAnalysis = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { analysisId } = req.body;
    if (!analysisId) {
      return res.status(400).json({ detail: "analysisId is required" });
    }

    // 1. Get user context
    const { error, profile, resume, curriculumChoice } = await getUserContext(
      req.userId,
      req.userEmail
    );

    if (error) {
      return res.status(error.status).json({ detail: error.message });
    }

    const requestedRole = String(req.body?.job_designation || "").trim();
    const requestedAnalysisMode = String(req.body?.analysis_mode || "").trim();
    const requestedNumSampleJobs = Number(req.body?.num_sample_jobs);

    if (!requestedRole) {
      return res.status(400).json({ detail: "Please select a role." });
    }
    if (!requestedAnalysisMode) {
      return res.status(400).json({ detail: "Please provide an analysis mode." });
    }
    if (!Number.isFinite(requestedNumSampleJobs) || requestedNumSampleJobs <= 0) {
      return res.status(400).json({ detail: "Please provide a valid number of sample jobs." });
    }
    if (!curriculumChoice || !ALLOWED_CURRICULA.includes(curriculumChoice)) {
      return res.status(400).json({
        detail: "Curriculum could not be derived from the linked institute student/program records.",
      });
    }

    // 2. Find or CREATE the aspiration - upsert logic
    let aspiration = await Aspiration.findOne({
      userId: req.userId,
      analysisId: analysisId,
    });

    if (!aspiration) {
      console.log("Aspiration not found, creating new one for analysisId:", analysisId);
      aspiration = new Aspiration({
        userId: req.userId,
        analysisId: analysisId,
        goal: "", // will be filled from frontend form if you pass it
        certifications: [],
        roleAreas: [],
        roleMatch: "",
        curriculumChoice: "",
        analysisMode: "",
        numSampleJobs: null,
        aiAnalysisComplete: false,
        aiTaskId: "",
        aiStatus: "idle",
        aiStatusMessage: "",
        aiError: "",
        aiResult: null,
      });
    }

    // 3. Call AI service
    const analysisResponse = await startAnalysis({
      jobDesignation: requestedRole,
      analysisMode: requestedAnalysisMode,
      numSampleJobs: requestedNumSampleJobs,
      curriculumChoice,
      resumeUrl: resume.url,
      resumeFileName: resume.name,
    });

    // 4. Update aspiration with form data + AI task details
    aspiration.roleMatch = requestedRole;
    aspiration.analysisMode = requestedAnalysisMode;
    aspiration.numSampleJobs = requestedNumSampleJobs;
    aspiration.curriculumChoice = curriculumChoice;
    aspiration.aiTaskId = analysisResponse.task_id || "";
    aspiration.aiStatus = analysisResponse.job_status || "queued";
    aspiration.aiStatusMessage = analysisResponse.message || "Analysis started";
    aspiration.aiError = "";
    aspiration.aiAnalysisComplete = false;
    aspiration.aiResult = null;

    await aspiration.save();

    return res.status(200).json({
      task_id: aspiration.aiTaskId,
      analysisId: aspiration.analysisId,
    });

  } catch (error) {
    console.error("AI ANALYSIS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};
// ─────────────────────────────────────────────────────────────
// GET STATUS
// ─────────────────────────────────────────────────────────────
exports.getAiAnalysisStatus = async (req, res) => {
  try {
    const taskId = req.params.taskId;

    const aspiration = await Aspiration.findOne({
      userId: req.userId,
      aiTaskId: taskId,
    });

    if (!aspiration) {
      return res.status(404).json({ detail: "Analysis task not found for this user." });
    }

    const statusResponse = await getAnalysisStatus(taskId);

    aspiration.aiStatus = statusResponse.status || aspiration.aiStatus;
    aspiration.aiStatusMessage = statusResponse.message || aspiration.aiStatusMessage;
    aspiration.aiError = statusResponse.error || "";

    // NEW: If finished, fetch and save the result
    if (statusResponse.status === "finished" && !aspiration.aiResult) {
      try {
        const resultResponse = await getAnalysisResult(taskId);
        aspiration.aiResult = resultResponse;
        aspiration.aiAnalysisComplete = true;
        aspiration.aiStatusMessage = "Analysis completed";
      } catch (resultErr) {
        console.error("Failed to fetch result on status finish:", resultErr);
        aspiration.aiError = "Failed to fetch result";
      }
    }

    if (statusResponse.status === "failed") {
      aspiration.aiAnalysisComplete = false;
    }

    await aspiration.save();

    return res.status(200).json(statusResponse);
  } catch (error) {
    console.error("aiAnalysis.getAiAnalysisStatus error:", error);
    return res.status(error.status || 500).json({
      detail: error.message || "Failed to fetch analysis status",
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET RESULT
// ─────────────────────────────────────────────────────────────
exports.getAiAnalysisResult = async (req, res) => {
  try {
    const { taskId } = req.params;

    const aspiration = await Aspiration.findOne({
      userId: req.userId,
      aiTaskId: taskId,
    });

    if (!aspiration) {
      return res
        .status(404)
        .json({ detail: "Analysis task not found for this user." });
    }

    const resultResponse = await getAnalysisResult(taskId);

    aspiration.aiAnalysisComplete = true;
    aspiration.aiStatus = "finished";
    aspiration.aiStatusMessage = "Analysis completed";
    aspiration.aiError = "";
    aspiration.aiResult = resultResponse;

    await aspiration.save();

    return res.status(200).json(resultResponse);
  } catch (error) {
    console.error("aiAnalysis.getAiAnalysisResult error:", error);
    return res
      .status(error.status || 500)
      .json({
        detail: error.message || "Failed to fetch analysis result",
      });
  }
};

// Instead of findOne, use find with sort
exports.getAspirations = async (req, res) => {
  try {
    const aspirations = await Aspiration.find({ userId: req.userId })
      .sort({ createdAt: -1 });  // newest first
    
    return res.status(200).json({ aspirations });
  } catch (error) {
    console.error("getAspirations error:", error);
    return res.status(500).json({ detail: "Failed to fetch aspirations" });
  }
};

// ─────────────────────────────────────────────────────────────
// SUGGEST POSITIONS (fallback kept)
// ─────────────────────────────────────────────────────────────
exports.suggestAiPositions = async (req, res) => {
  try {
    const { field = "" } = req.body || {};
    let response;

    try {
      response = await suggestPositions(field);
    } catch (err) {
      console.error("AI SERVICE DOWN (suggest):", err.message);

      response = [
        "Software Engineer",
        "Data Scientist",
        "Web Developer",
      ];
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("aiAnalysis.suggestAiPositions error:", error);
    return res
      .status(error.status || 500)
      .json({
        detail: error.message || "Failed to fetch job suggestions",
      });
  }
};