import React, { useState, useRef } from "react";
import { X, UploadCloud, Trash2 } from "lucide-react";

const empty = { certId: "", name: "", issuer: "", validTill: "", file: null };

export default function CertificationModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || empty);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) setForm((prev) => ({ ...prev, file: { name: f.name, url: "" } }));
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setForm((prev) => ({ ...prev, file: { name: f.name, url: "" } }));
  };

  const validate = () => {
    const errs = {};
    if (!form.certId?.trim()) errs.certId = "Certificate ID is required";
    if (!form.name?.trim()) errs.name = "Certificate name is required";
    if (!form.issuer?.trim()) errs.issuer = "Issuing authority is required";
    if (!form.validTill) errs.validTill = "Valid till date is required";
    if (!form.file) errs.file = "Please upload the certificate document";
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <div className="profile-modal-overlay" role="dialog" aria-modal="true" aria-label="Certification details">
      <div className="profile-modal">
        <div className="profile-modal__header">
          <h3>{initial ? "Edit Certification" : "Add Certification"}</h3>
          <button type="button" onClick={onClose} className="profile-modal__close" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="profile-modal__body">
          <div className="profile-grid-2">
            <div className="profile-field">
              <label className="profile-field__label">Certificate ID <span className="profile-required">*</span></label>
              <input
                className={`profile-input${errors.certId ? " profile-input--error" : ""}`}
                value={form.certId}
                onChange={set("certId")}
                placeholder="e.g. CERT-12345"
              />
              {errors.certId && <span className="profile-error">{errors.certId}</span>}
            </div>
            <div className="profile-field">
              <label className="profile-field__label">Certificate Name <span className="profile-required">*</span></label>
              <input
                className={`profile-input${errors.name ? " profile-input--error" : ""}`}
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. AWS Certified Developer"
              />
              {errors.name && <span className="profile-error">{errors.name}</span>}
            </div>
            <div className="profile-field">
              <label className="profile-field__label">Issuing Authority <span className="profile-required">*</span></label>
              <input
                className={`profile-input${errors.issuer ? " profile-input--error" : ""}`}
                value={form.issuer}
                onChange={set("issuer")}
                placeholder="e.g. Amazon Web Services"
              />
              {errors.issuer && <span className="profile-error">{errors.issuer}</span>}
            </div>
            <div className="profile-field">
              <label className="profile-field__label">Valid Till <span className="profile-required">*</span></label>
              <input
                type="month"
                className={`profile-input${errors.validTill ? " profile-input--error" : ""}`}
                value={form.validTill}
                onChange={set("validTill")}
              />
              {errors.validTill && <span className="profile-error">{errors.validTill}</span>}
            </div>
          </div>

          <div className="profile-field" style={{ marginTop: 16 }}>
            <label className="profile-field__label">
              Upload Certificate Document <span className="profile-required">*</span>
            </label>
            {form.file ? (
              <div className="profile-resume-item" style={{ marginTop: 8 }}>
                <span className="profile-resume-name">{form.file.name}</span>
                <button
                  type="button"
                  className="profile-btn-icon profile-btn-icon--danger"
                  onClick={() => setForm((prev) => ({ ...prev, file: null }))}
                  aria-label="Remove file"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div
                className={`profile-upload-zone profile-upload-zone--compact${errors.file ? " profile-upload-zone--error" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                aria-label="Upload certificate document"
              >
                <UploadCloud size={20} className="profile-upload-zone__icon" />
                <span className="profile-upload-zone__text">Click or drag to upload</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="profile-hidden-input"
                  onChange={handleFile}
                  aria-hidden="true"
                />
              </div>
            )}
            {errors.file && <span className="profile-error">{errors.file}</span>}
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
