import React, { useState } from "react";
import { X } from "lucide-react";

const empty = { company: "", role: "", location: "", employmentType: "", startDate: "", endDate: "", currentlyWorking: false };
const EMP_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Freelance"];

export default function WorkModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || empty);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const validate = () => {
    const errs = {};
    if (!form.company?.trim()) errs.company = "Company name is required";
    if (!form.role?.trim()) errs.role = "Role / designation is required";
    if (!form.startDate) errs.startDate = "Start date is required";
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <div className="profile-modal-overlay" role="dialog" aria-modal="true" aria-label="Work experience">
      <div className="profile-modal">
        <div className="profile-modal__header">
          <h3>{initial ? "Edit Work Experience" : "Add Work Experience"}</h3>
          <button type="button" onClick={onClose} className="profile-modal__close" aria-label="Close"><X size={20} /></button>
        </div>
        <div className="profile-modal__body">
          <div className="profile-grid-2">
            <div className="profile-field">
              <label className="profile-field__label">Company <span className="profile-required">*</span></label>
              <input className={`profile-input${errors.company ? " profile-input--error" : ""}`} value={form.company} onChange={set("company")} placeholder="Company name" />
              {errors.company && <span className="profile-error">{errors.company}</span>}
            </div>
            <div className="profile-field">
              <label className="profile-field__label">Role / Designation <span className="profile-required">*</span></label>
              <input className={`profile-input${errors.role ? " profile-input--error" : ""}`} value={form.role} onChange={set("role")} placeholder="e.g. Software Engineer" />
              {errors.role && <span className="profile-error">{errors.role}</span>}
            </div>
            <div className="profile-field">
              <label className="profile-field__label">Location</label>
              <input className="profile-input" value={form.location} onChange={set("location")} placeholder="City, Country" />
            </div>
            <div className="profile-field">
              <label className="profile-field__label">Employment Type</label>
              <select className="profile-select" value={form.employmentType} onChange={set("employmentType")}>
                <option value="">Select type</option>
                {EMP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="profile-field">
              <label className="profile-field__label">Start Date <span className="profile-required">*</span></label>
              <input
                className={`profile-input${errors.startDate ? " profile-input--error" : ""}`}
                type="month"
                value={form.startDate}
                onChange={set("startDate")}
                aria-required="true"
              />
              {errors.startDate && <span className="profile-error">{errors.startDate}</span>}
            </div>
            <div className="profile-field">
              <label className="profile-field__label">End Date</label>
              <input className="profile-input" type="month" value={form.endDate} onChange={set("endDate")} disabled={form.currentlyWorking} />
            </div>
            <div className="profile-field profile-field--checkbox">
              <label className="profile-checkbox-label">
                <input type="checkbox" checked={form.currentlyWorking} onChange={set("currentlyWorking")} />
                <span>Currently Working Here</span>
              </label>
            </div>
          </div>
        </div>
        <div className="profile-modal__footer">
          <button type="button" className="profile-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="profile-btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
