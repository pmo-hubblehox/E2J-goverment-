const mongoose = require("mongoose");

const aspirationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  analysisId: {
    type: String,
    required: true,
  },
  goal: {
    type: String,
    default: "",
  },
  certifications: {
    type: [String],
    default: [],
  },
  roleAreas: {
    type: [String],
    default: [],
  },
  roleMatch: {
    type: String,
    default: "",
  },
  curriculumChoice: {
    type: String,
    default: "",
  },
  analysisMode: {
    type: String,
    default: "",
  },
  numSampleJobs: {
    type: Number,
    default: null,
  },
  aiAnalysisComplete: {
    type: Boolean,
    default: false,
  },
  aiTaskId: {
    type: String,
    default: "",
  },
  aiStatus: {
    type: String,
    default: "idle",
  },
  aiStatusMessage: {
    type: String,
    default: "",
  },
  aiError: {
    type: String,
    default: "",
  },
  aiResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
}, {
  timestamps: true,
});

// Compound unique index: no duplicate userId + analysisId combos
aspirationSchema.index({ userId: 1, analysisId: 1 }, { unique: true });

module.exports = mongoose.model("Aspiration", aspirationSchema);