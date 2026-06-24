import React from "react";
import { Link } from "react-router-dom";
import "../styles/aspirations.css";

export default function CoursesPlaceholder() {
  return (
    <div className="asp-standalone">
      <div className="asp-report-shell asp-report-shell--placeholder">
        <div className="asp-report-topbar">
          <div>
            <h1 className="asp-report-title">Courses</h1>
            <p className="asp-report-subtitle">Course recommendations will be available here next.</p>
          </div>
        </div>
        <div className="asp-report-empty">
          <p>The dedicated Courses page has not been built yet.</p>
          <Link to="/dashboard/aspirations" className="asp-report-linkButton">
            Back to My Aspirations
          </Link>
        </div>
      </div>
    </div>
  );
}
