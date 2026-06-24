import React, { useRef, useState } from "react";
import { UploadCloud, Trash2, Star } from "lucide-react";
import { extractResumeDataFromPdf } from "../../utils/resumePdfParser";

export default function StepResume({ data, onChange, errors = {} }) {
  const fileRef = useRef(null);
  const resumes = data.resumes || [];
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractSummary, setExtractSummary] = useState("");

  const isEmpty = (value) => {
    if (Array.isArray(value)) return value.length === 0;
    if (value && typeof value === "object") return Object.keys(value).length === 0;
    return value === undefined || value === null || String(value).trim() === "";
  };

  const mergeExtractedIntoProfile = (extracted) => {
    const patch = {};
    const source = extracted || {};

    const assignIfMissing = (field, value) => {
      if (!isEmpty(value) && isEmpty(data[field])) {
        patch[field] = value;
      }
    };

    assignIfMissing("title", source.title);
    assignIfMissing("firstName", source.firstName);
    assignIfMissing("middleName", source.middleName);
    assignIfMissing("lastName", source.lastName);
    assignIfMissing("dob", source.dob);
    assignIfMissing("gender", source.gender);
    assignIfMissing("nationality", source.nationality);
    assignIfMissing("maritalStatus", source.maritalStatus);
    assignIfMissing("physicallyChallenged", source.physicallyChallenged);
    assignIfMissing("bloodGroup", source.bloodGroup);
    assignIfMissing("email", source.email);
    assignIfMissing("mobilePrimary", source.mobilePrimary);
    assignIfMissing("mobileAlternate", source.mobileAlternate);
    assignIfMissing("experienceCategory", source.experienceCategory);
    assignIfMissing("totalExperience", source.totalExperience);

    const nextPresentAddress = {
      ...(data.presentAddress || {}),
      ...(source.presentAddress || {}),
    };
    if (!isEmpty(source.address) && isEmpty(nextPresentAddress.line1)) {
      nextPresentAddress.line1 = source.address;
    }
    if (!isEmpty(source.presentAddress) || !isEmpty(source.address)) {
      patch.presentAddress = nextPresentAddress;
    }

    if (!isEmpty(source.permanentAddress) && isEmpty(data.permanentAddress)) {
      patch.permanentAddress = {
        ...(data.permanentAddress || {}),
        ...(source.permanentAddress || {}),
      };
    }

    if (Array.isArray(source.education) && source.education.length > 0 && isEmpty(data.education)) {
      patch.education = source.education;
    }

    if (Array.isArray(source.work) && source.work.length > 0 && isEmpty(data.work)) {
      patch.work = source.work;
    }

    if (Array.isArray(source.certifications) && source.certifications.length > 0 && isEmpty(data.certifications)) {
      patch.certifications = source.certifications;
    }

    const incomingSkills = Array.isArray(source.skills) ? source.skills : [];
    if (incomingSkills.length > 0) {
      const mergedSkills = [...new Set([...(data.skills || []), ...incomingSkills])];
      patch.skills = mergedSkills;
    }

    if (Array.isArray(source.languages) && source.languages.length > 0 && isEmpty(data.languages)) {
      patch.languages = source.languages;
    }

    const incomingJobPrefs = source.jobPreferences || {};
    if (!isEmpty(incomingJobPrefs)) {
      const existingJobPrefs = data.jobPreferences || {};
      patch.jobPreferences = {
        ...existingJobPrefs,
        currentCTC: existingJobPrefs.currentCTC || incomingJobPrefs.currentCTC || "",
        expectedCTC: existingJobPrefs.expectedCTC || incomingJobPrefs.expectedCTC || "",
        noticePeriod: existingJobPrefs.noticePeriod || incomingJobPrefs.noticePeriod || "",
      };
    }

    return patch;
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });

  const addPdfFiles = async (incomingFiles) => {
    const files = Array.from(incomingFiles || []);
    if (!files.length) return;

    const validPdfs = files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );
    const rejectedCount = files.length - validPdfs.length;

    if (!validPdfs.length) {
      setUploadError("Only PDF files are allowed for resume upload.");
      setExtractSummary("");
      return;
    }

    if (rejectedCount > 0) {
      setUploadError("Only PDF files were accepted. Non-PDF files were skipped.");
    } else {
      setUploadError("");
    }

    setExtracting(true);

    try {
      const encodedFiles = await Promise.all(validPdfs.map((file) => readFileAsDataUrl(file)));
      const extractResults = await Promise.all(validPdfs.map((file) => extractResumeDataFromPdf(file)));

      const newResumes = validPdfs.map((file, idx) => ({
        name: file.name,
        url: encodedFiles[idx],
        isPrimary: resumes.length === 0 && idx === 0,
      }));

      const aggregatePatch = extractResults.reduce((acc, result) => {
        const extractedPatch = mergeExtractedIntoProfile(result.extracted || {});
        return { ...acc, ...extractedPatch };
      }, {});

      const finalPatch = { ...aggregatePatch };

      onChange({
        resumes: [...resumes, ...newResumes],
        ...finalPatch,
      });

      const filledGroups = [];
      if (finalPatch.firstName || finalPatch.lastName || finalPatch.mobilePrimary || finalPatch.presentAddress) {
        filledGroups.push("Personal");
      }
      if (finalPatch.education?.length) {
        filledGroups.push("Education");
      }
      if (finalPatch.work?.length || finalPatch.totalExperience) {
        filledGroups.push("Work Experience");
      }
      if (finalPatch.skills?.length || finalPatch.languages?.length) {
        filledGroups.push("Skills & Languages");
      }

      if (filledGroups.length > 0) {
        setExtractSummary(`Local PDF/OCR extraction complete. Prefilled: ${filledGroups.join(", ")}. You can edit these in their sections.`);
      } else {
        setExtractSummary("Resume uploaded. We could not confidently prefill sections from this file, so please review and fill manually.");
      }
    } catch (err) {
      console.error("Failed to extract data from resume PDF:", err);
      setUploadError("Resume uploaded, but local extraction failed. Please review fields manually.");

      const encodedFiles = await Promise.all(validPdfs.map((file) => readFileAsDataUrl(file)));

      const newResumes = validPdfs.map((file, idx) => ({
        name: file.name,
        url: encodedFiles[idx],
        isPrimary: resumes.length === 0 && idx === 0,
      }));
      onChange({ resumes: [...resumes, ...newResumes] });
    } finally {
      setExtracting(false);
    }
  };

  const handleFileChange = async (e) => {
    await addPdfFiles(e.target.files);
    e.target.value = "";
  };

  const handleDelete = (idx) => {
    const updated = resumes.filter((_, i) => i !== idx);
    if (updated.length > 0 && !updated.some((r) => r.isPrimary)) {
      updated[0].isPrimary = true;
    }
    onChange({ resumes: updated });
  };

  const handleSetPrimary = (idx) => {
    const updated = resumes.map((r, i) => ({ ...r, isPrimary: i === idx }));
    onChange({ resumes: updated });
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    await addPdfFiles(e.dataTransfer.files);
  };

  return (
    <div className="profile-step">
      <h3 className="profile-step__title">Upload Resume</h3>
      <p className="profile-step__desc">Upload your resume in PDF format. Key details are auto-extracted to prefill later tabs, and you can edit them anytime.</p>

      <div
        className={`profile-upload-zone${isDragOver ? " drag-over" : ""}`}
        onClick={() => fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
        aria-label="Upload resume PDF files"
      >
        <UploadCloud size={36} className="profile-upload-zone__icon" />
        <p className="profile-upload-zone__text">Click or drag PDF files here to upload</p>
        <p className="profile-upload-zone__hint">Only PDF files are accepted</p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="profile-hidden-input"
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </div>

      {extracting && (
        <div className="profile-status-msg success" role="status">
          Running local PDF/OCR resume extraction and prefill...
        </div>
      )}

      {(uploadError || errors.resumes) && (
        <span className="profile-error" role="alert">{errors.resumes || uploadError}</span>
      )}

      {extractSummary && !extracting && (
        <div className="profile-status-msg success" role="status">
          {extractSummary}
        </div>
      )}

      {resumes.length > 0 && (
        <ul className="profile-resume-list" aria-label="Uploaded resumes">
          {resumes.map((resume, idx) => (
            <li key={idx} className={`profile-resume-item${resume.isPrimary ? " is-primary" : ""}`}>
              <span className="profile-resume-name">{resume.name}</span>
              <div className="profile-resume-actions">
                {resume.isPrimary && (
                  <span className="profile-badge-primary" aria-label="Primary resume">Primary</span>
                )}
                {!resume.isPrimary && (
                  <button
                    type="button"
                    className="profile-btn-icon"
                    onClick={() => handleSetPrimary(idx)}
                    title="Set as Primary"
                    aria-label={`Set ${resume.name} as primary`}
                  >
                    <Star size={14} />
                  </button>
                )}
                <button
                  type="button"
                  className="profile-btn-icon profile-btn-icon--danger"
                  onClick={() => handleDelete(idx)}
                  title="Delete resume"
                  aria-label={`Delete ${resume.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {resumes.length === 0 && (
        <p className="profile-empty-state">No resume uploaded yet. Upload at least one PDF resume.</p>
      )}
    </div>
  );
}
