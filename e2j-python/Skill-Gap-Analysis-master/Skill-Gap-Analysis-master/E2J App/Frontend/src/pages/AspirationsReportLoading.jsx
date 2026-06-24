import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getAiAnalysisStatus } from "../services/aiAnalysisService";
import "../styles/aspirations.css";

const POLL_INTERVAL_MS = 3500;
const MAX_POLLS = 60;

export default function AspirationsReportLoading() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get("taskId") || "";
  const [attempts, setAttempts] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Preparing your AI skill readiness report...");
  const [progress, setProgress] = useState(0);

  const isTimedOut = useMemo(() => attempts >= MAX_POLLS, [attempts]);

  useEffect(() => {
    if (!taskId) {
      navigate("/dashboard/aspirations/report", { replace: true });
      return;
    }

    if (isTimedOut) {
      console.error("AI processing timed out before completion.");
      navigate(`/dashboard/aspirations/report?taskId=${encodeURIComponent(taskId)}`, { replace: true });
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const status = await getAiAnalysisStatus(taskId);
        setStatusMessage(status.message || "Analyzing your profile and role match...");
        setProgress(typeof status.progress === "number" ? status.progress : Math.min(95, attempts * 5 + 10));

        if (status.status === "finished" || status.result_available || status.status === "failed") {
          if (status.status === "failed") {
            console.error("AI processing failed:", status.error || "Unknown AI error");
          }
          navigate(`/dashboard/aspirations/report?taskId=${encodeURIComponent(taskId)}`, { replace: true });
          return;
        }

        setAttempts((current) => current + 1);
      } catch (err) {
        console.error("Failed to poll AI analysis status:", err);
        navigate(`/dashboard/aspirations/report?taskId=${encodeURIComponent(taskId)}`, { replace: true });
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [attempts, isTimedOut, navigate, taskId]);

  return (
    <div className="asp-standalone">
      <div className="asp-report-shell asp-report-shell--loading">
        <div className="asp-loading-card">
          <div className="ai-results-loader" aria-hidden="true" />
          <h1 className="asp-report-title">Generating Your Skill Readiness Report</h1>
          <p className="asp-report-subtitle">{statusMessage}</p>
          <div className="asp-progress-track" aria-hidden="true">
            <div className="asp-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <p className="asp-loading-footnote">This usually takes 2 to 5 minutes.</p>
          <div className="asp-report-actions asp-report-actions--centered">
            <Link to="/dashboard/aspirations" className="asp-report-secondaryButton">
              Back to My Aspirations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
