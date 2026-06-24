const AI_API_BASE_URL = process.env.AI_API_BASE_URL || "http://localhost:8000";
const AI_API_TIMEOUT_MS = Number(process.env.AI_API_TIMEOUT_MS || 60000);
const fs = require("fs");

async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      const message = data?.detail || data?.message || `AI request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchResumeAsBlob(resumeUrl) {
  const response = await fetch(resumeUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch resume file from ${resumeUrl}`);
  }
  return response.blob();
}

async function startAnalysis({ jobDesignation, analysisMode, numSampleJobs, curriculumChoice, resumeUrl, resumeFileName, resumeFilePath }) {
  const formData = new FormData();
  formData.append("job_designation", jobDesignation);
  formData.append("analysis_mode", analysisMode);
  formData.append("num_sample_jobs", String(numSampleJobs));
  formData.append("curriculum_choice", curriculumChoice);

  let resumeBlob;
  let effectiveFileName;

  if (resumeFilePath) {
    // Use locally uploaded file read from disk
    const fileBuffer = await fs.promises.readFile(resumeFilePath);
    resumeBlob = new Blob([fileBuffer]);
    effectiveFileName = resumeFileName || require("path").basename(resumeFilePath);
  } else {
    // Fall back to fetching resume from the stored profile URL
    resumeBlob = await fetchResumeAsBlob(resumeUrl);
    effectiveFileName = resumeFileName || "resume.pdf";
  }

  formData.append("resume_file", resumeBlob, effectiveFileName);

  return requestJson(`${AI_API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });
}

async function getAnalysisStatus(taskId) {
  return requestJson(`${AI_API_BASE_URL}/api/status/${encodeURIComponent(taskId)}`);
}

async function getAnalysisResult(taskId) {
  return requestJson(`${AI_API_BASE_URL}/api/result/${encodeURIComponent(taskId)}`);
}

async function suggestPositions(field) {
  return requestJson(`${AI_API_BASE_URL}/api/suggest-positions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ field }),
  });
}

module.exports = {
  startAnalysis,
  getAnalysisStatus,
  getAnalysisResult,
  suggestPositions,
};
