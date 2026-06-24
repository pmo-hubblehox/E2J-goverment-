import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import WorkModal from "./WorkModal";

const EXP_CATEGORIES = [
  "Fresher",
  "Entry Level (0–2 years)",
  "Mid Level (2–5 years)",
  "Senior Level (5–10 years)",
  "Lead / Principal (10+ years)",
];

export default function StepWorkExperience({ data, onChange, errors = {} }) {
  const work = data.work || [];
  const [modal, setModal] = useState(null);

  const saveWork = (item) => {
    if (modal.mode === "add") {
      onChange({ work: [...work, item] });
    } else {
      onChange({ work: work.map((w, i) => (i === modal.idx ? item : w)) });
    }
    setModal(null);
  };
  const deleteWork = (idx) => onChange({ work: work.filter((_, i) => i !== idx) });

  const formatDate = (d) => {
    if (!d) return "";
    const [y, m] = d.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(m, 10) - 1] || ""} ${y}`;
  };

  return (
    <div className="profile-step">
      <h3 className="profile-step__title">Work Experience</h3>

      <section className="profile-section">
        <h4 className="profile-section__heading">Experience Summary</h4>
        <div className="profile-grid-2">
          <div className="profile-field">
            <label className="profile-field__label">
              Experience Category <span className="profile-required">*</span>
            </label>
            <select
              className={`profile-select${errors.experienceCategory ? " profile-input--error" : ""}`}
              value={data.experienceCategory || ""}
              onChange={(e) => onChange({ experienceCategory: e.target.value })}
            >
              <option value="">Select category…</option>
              {EXP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.experienceCategory && (
              <span className="profile-error" role="alert">{errors.experienceCategory}</span>
            )}
          </div>
          <div className="profile-field">
            <label className="profile-field__label">
              Total Experience <span className="profile-required">*</span>
            </label>
            <input
              type="text"
              className={`profile-input${errors.totalExperience ? " profile-input--error" : ""}`}
              value={data.totalExperience || ""}
              onChange={(e) => onChange({ totalExperience: e.target.value })}
              placeholder="e.g. 2 years 3 months"
            />
            {errors.totalExperience && (
              <span className="profile-error" role="alert">{errors.totalExperience}</span>
            )}
          </div>
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-header">
          <h4 className="profile-section__heading">Work History</h4>
          <button type="button" className="profile-btn-add" onClick={() => setModal({ mode: "add" })}>
            <Plus size={16} /> Add Experience
          </button>
        </div>

        {work.length === 0 ? (
          <p className="profile-empty-state">No work experience added yet. Click &quot;Add Experience&quot; to start.</p>
        ) : (
          <div className="profile-table-wrap">
            <table className="profile-table" aria-label="Work experience">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {work.map((w, idx) => (
                  <tr key={idx}>
                    <td>{w.company}</td>
                    <td>{w.role}</td>
                    <td>{w.employmentType || "—"}</td>
                    <td>{formatDate(w.startDate)} – {w.currentlyWorking ? "Present" : formatDate(w.endDate)}</td>
                    <td>{w.location || "—"}</td>
                    <td>
                      <div className="profile-table-actions">
                        <button type="button" className="profile-btn-icon" onClick={() => setModal({ mode: "edit", idx, initial: w })} aria-label="Edit work experience"><Pencil size={16} /></button>
                        <button type="button" className="profile-btn-icon profile-btn-icon--danger" onClick={() => deleteWork(idx)} aria-label="Delete work experience"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && (
        <WorkModal
          initial={modal.initial}
          onSave={saveWork}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
