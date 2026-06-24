import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import EducationModal from "./EducationModal";
import CertificationModal from "./CertificationModal";

export default function StepEducation({ data, onChange }) {
  const education = data.education || [];
  const certifications = data.certifications || [];
  const [edModal, setEdModal] = useState(null);
  const [certModal, setCertModal] = useState(null);

  // Education CRUD
  const saveEducation = (item) => {
    if (edModal.mode === "add") {
      onChange({ education: [...education, item] });
    } else {
      const updated = education.map((e, i) => (i === edModal.idx ? item : e));
      onChange({ education: updated });
    }
    setEdModal(null);
  };
  const deleteEducation = (idx) => onChange({ education: education.filter((_, i) => i !== idx) });

  // Certification CRUD via modal
  const saveCert = (item) => {
    if (certModal.mode === "add") {
      onChange({ certifications: [...certifications, item] });
    } else {
      const updated = certifications.map((c, i) => (i === certModal.idx ? item : c));
      onChange({ certifications: updated });
    }
    setCertModal(null);
  };
  const deleteCert = (idx) => onChange({ certifications: certifications.filter((_, i) => i !== idx) });

  const formatDate = (d) => {
    if (!d) return "—";
    const [y, m] = d.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(m, 10) - 1] || ""} ${y}`;
  };

  return (
    <div className="profile-step">
      <h3 className="profile-step__title">Education</h3>

      <section className="profile-section">
        <div className="profile-section-header">
          <h4 className="profile-section__heading">Academic Qualifications</h4>
          <button type="button" className="profile-btn-add" onClick={() => setEdModal({ mode: "add" })}>
            <Plus size={16} /> Add Education
          </button>
        </div>

        {education.length === 0 ? (
          <p className="profile-empty-state">No education added yet. Click &quot;Add Education&quot; to start.</p>
        ) : (
          <div className="profile-table-wrap">
            <table className="profile-table" aria-label="Education entries">
              <thead>
                <tr>
                  <th>Degree</th>
                  <th>College / University</th>
                  <th>Specialization</th>
                  <th>Year</th>
                  <th>%/CGPA</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {education.map((ed, idx) => (
                  <tr key={idx}>
                    <td>{ed.degree}</td>
                    <td>{ed.college}</td>
                    <td>{ed.specialization || "—"}</td>
                    <td>{ed.currentlyPursuing ? "Pursuing" : ed.yearOfPassing || "—"}</td>
                    <td>{ed.percentage || "—"}</td>
                    <td>
                      <div className="profile-table-actions">
                        <button type="button" className="profile-btn-icon" onClick={() => setEdModal({ mode: "edit", idx, initial: ed })} aria-label="Edit education"><Pencil size={16} /></button>
                        <button type="button" className="profile-btn-icon profile-btn-icon--danger" onClick={() => deleteEducation(idx)} aria-label="Delete education"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="profile-section">
        <div className="profile-section-header">
          <h4 className="profile-section__heading">Certifications</h4>
          <button type="button" className="profile-btn-add" onClick={() => setCertModal({ mode: "add" })}>
            <Plus size={16} /> Add Certification
          </button>
        </div>
        {certifications.length === 0 ? (
          <p className="profile-empty-state">No certifications added yet. Click &quot;Add Certification&quot; to start.</p>
        ) : (
          <div className="profile-table-wrap">
            <table className="profile-table" aria-label="Certifications">
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Name</th>
                  <th>Issuing Authority</th>
                  <th>Valid Till</th>
                  <th>Document</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certifications.map((cert, idx) => (
                  <tr key={idx}>
                    <td>{cert.certId || "—"}</td>
                    <td>{cert.name}</td>
                    <td>{cert.issuer || "—"}</td>
                    <td>{formatDate(cert.validTill)}</td>
                    <td>{cert.file?.name ? <span className="profile-file-chip">{cert.file.name}</span> : "—"}</td>
                    <td>
                      <div className="profile-table-actions">
                        <button type="button" className="profile-btn-icon" onClick={() => setCertModal({ mode: "edit", idx, initial: cert })} aria-label="Edit certification"><Pencil size={16} /></button>
                        <button type="button" className="profile-btn-icon profile-btn-icon--danger" onClick={() => deleteCert(idx)} aria-label="Delete certification"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {edModal && (
        <EducationModal
          initial={edModal.initial}
          onSave={saveEducation}
          onClose={() => setEdModal(null)}
        />
      )}

      {certModal && (
        <CertificationModal
          initial={certModal.initial}
          onSave={saveCert}
          onClose={() => setCertModal(null)}
        />
      )}
    </div>
  );
}
