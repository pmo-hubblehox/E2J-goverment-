import React, { useState } from "react";
import { X, Plus } from "lucide-react";

const LANG_OPTIONS = ["English","Hindi","Tamil","Telugu","Kannada","Malayalam","Marathi","Bengali","Gujarati","Punjabi","Urdu","French","German","Spanish","Mandarin","Arabic","Japanese"];
const NOTICE_PERIODS = ["Immediate", "15 days", "1 month", "2 months", "3 months", "More than 3 months"];

export default function StepSkills({ data, onChange, errors = {} }) {
  const skills = data.skills || [];
  const languages = data.languages || [];
  const jobPrefs = data.jobPreferences || {};
  const [skillInput, setSkillInput] = useState("");
  const [newLang, setNewLang] = useState("");

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      onChange({ skills: [...skills, s] });
    }
    setSkillInput("");
  };

  const removeSkill = (skill) => onChange({ skills: skills.filter((s) => s !== skill) });

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addSkill(); }
  };

  const addLanguage = () => {
    if (newLang && !languages.find((l) => l.language === newLang)) {
      onChange({ languages: [...languages, { language: newLang, canRead: false, canWrite: false, canSpeak: false, isNative: false }] });
      setNewLang("");
    }
  };

  const updateLang = (idx, field, val) => {
    onChange({ languages: languages.map((l, i) => (i === idx ? { ...l, [field]: val } : l)) });
  };

  const removeLang = (idx) => onChange({ languages: languages.filter((_, i) => i !== idx) });

  const setJobPref = (field) => (e) => onChange({ jobPreferences: { ...jobPrefs, [field]: e.target.value } });

  return (
    <div className="profile-step">
      <h3 className="profile-step__title">Skills &amp; Languages</h3>

      <section className="profile-section">
        <h4 className="profile-section__heading">Technical / Professional Skills</h4>
        <div className="profile-skill-input-row">
          <input
            className={`profile-input${errors.skills ? " profile-input--error" : ""}`}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="Type a skill and press Enter or click Add"
            aria-label="Add skill"
          />
          <button type="button" className="profile-btn-primary" onClick={addSkill}>
            <Plus size={16} />Add
          </button>
        </div>
        {errors.skills && <span className="profile-error" role="alert">{errors.skills}</span>}
        {skills.length > 0 && (
          <div className="profile-skill-tags" role="list" aria-label="Added skills">
            {skills.map((skill) => (
              <span key={skill} className="profile-skill-tag" role="listitem">
                {skill}
                <button
                  type="button"
                  className="profile-skill-tag__remove"
                  onClick={() => removeSkill(skill)}
                  aria-label={`Remove ${skill}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        {skills.length === 0 && !errors.skills && <p className="profile-empty-state">No skills added yet.</p>}
      </section>

      <section className="profile-section">
        <h4 className="profile-section__heading">Languages</h4>
        <div className="profile-skill-input-row">
          <select className="profile-select" value={newLang} onChange={(e) => setNewLang(e.target.value)} aria-label="Select language">
            <option value="">Select language…</option>
            {LANG_OPTIONS.filter((l) => !languages.find((x) => x.language === l)).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <button type="button" className="profile-btn-primary" onClick={addLanguage} disabled={!newLang}>
            <Plus size={16} /> Add
          </button>
        </div>
        {languages.length > 0 && (
          <div className="profile-table-wrap">
            <table className="profile-table" aria-label="Languages">
              <thead>
                <tr>
                  <th>Language</th>
                  <th>Read</th>
                  <th>Write</th>
                  <th>Speak</th>
                  <th>Native</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {languages.map((lang, idx) => (
                  <tr key={idx}>
                    <td>{lang.language}</td>
                    {["canRead","canWrite","canSpeak","isNative"].map((field) => (
                      <td key={field}>
                        <input
                          type="checkbox"
                          checked={lang[field]}
                          onChange={(e) => updateLang(idx, field, e.target.checked)}
                          aria-label={`${lang.language} ${field}`}
                        />
                      </td>
                    ))}
                    <td>
                      <button type="button" className="profile-btn-icon profile-btn-icon--danger" onClick={() => removeLang(idx)} aria-label={`Remove ${lang.language}`}><X size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {languages.length === 0 && <p className="profile-empty-state">No languages added yet.</p>}
      </section>

      <section className="profile-section">
        <h4 className="profile-section__heading">Salary &amp; Preferences</h4>
        <div className="profile-grid-3">
          <div className="profile-field">
            <label className="profile-field__label">
              Current CTC <span className="profile-required">*</span>
            </label>
            <input
              type="text"
              className={`profile-input${errors.currentCTC ? " profile-input--error" : ""}`}
              value={jobPrefs.currentCTC || ""}
              onChange={setJobPref("currentCTC")}
              placeholder="e.g. 5 LPA or 5,00,000"
            />
            {errors.currentCTC && <span className="profile-error" role="alert">{errors.currentCTC}</span>}
          </div>
          <div className="profile-field">
            <label className="profile-field__label">
              Expected CTC <span className="profile-required">*</span>
            </label>
            <input
              type="text"
              className={`profile-input${errors.expectedCTC ? " profile-input--error" : ""}`}
              value={jobPrefs.expectedCTC || ""}
              onChange={setJobPref("expectedCTC")}
              placeholder="e.g. 8 LPA or 8,00,000"
            />
            {errors.expectedCTC && <span className="profile-error" role="alert">{errors.expectedCTC}</span>}
          </div>
          <div className="profile-field">
            <label className="profile-field__label">
              Notice Period <span className="profile-required">*</span>
            </label>
            <select
              className={`profile-select${errors.noticePeriod ? " profile-input--error" : ""}`}
              value={jobPrefs.noticePeriod || ""}
              onChange={setJobPref("noticePeriod")}
            >
              <option value="">Select notice period…</option>
              {NOTICE_PERIODS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            {errors.noticePeriod && <span className="profile-error" role="alert">{errors.noticePeriod}</span>}
          </div>
        </div>
      </section>
    </div>
  );
}
