import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAspirations,
  updateCertifications,
} from "../services/aspirationsService";

/**
 * ProfileAspirations Component
 * 
 * Allows users to edit existing aspirations from their profile.
 * Loads existing goal + certifications and allows modifications.
 * Does NOT reset aiAnalysisComplete flag.
 * After save, updates certifications and returns to aspirations view.
 */
export default function ProfileAspirations() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState("");
  const [certifications, setCertifications] = useState([
    {
      id: "",
      name: "",
      institute: "",
      validTill: "",
      file: null,
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadAspirations = async () => {
      try {
        setLoading(true);
        const { aspirations } = await getAspirations();

        if (aspirations) {
          setGoal(aspirations.goal || "");
          setCertifications(
            aspirations.certifications && aspirations.certifications.length > 0
              ? aspirations.certifications.map((cert) => ({
                  id: cert.certificateId ?? "",
                  name: cert.certificateName ?? "",
                  institute: cert.institute ?? "",
                  validTill: cert.validTill
                    ? cert.validTill.toString().slice(0, 10)
                    : "",
                  file: null,
                }))
              : [
                  {
                    id: "",
                    name: "",
                    institute: "",
                    validTill: "",
                    file: null,
                  },
                ]
          );
        }
      } catch (err) {
        console.error("Failed to load aspirations:", err);
        setError("Unable to load your aspirations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadAspirations();
  }, []);

  const handleAddCertification = () => {
    setCertifications([
      ...certifications,
      {
        id: "",
        name: "",
        institute: "",
        validTill: "",
        file: null,
      },
    ]);
  };

  const handleRemoveCertification = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleCertificationChange = (index, field, value) => {
    const updated = [...certifications];
    updated[index][field] = value;
    setCertifications(updated);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        certifications: certifications.map((cert) => ({
          certificateId: cert.id,
          certificateName: cert.name,
          institute: cert.institute,
          validTill: cert.validTill,
          fileUrl: cert.file ? cert.file.name : "",
        })),
      };

      await updateCertifications(payload);

      // Navigate back to aspirations
      navigate("/my-aspirations");
    } catch (err) {
      console.error("Failed to save certifications:", err);
      setError("Unable to save your changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-aspirations">
        <p>Loading your aspirations...</p>
      </div>
    );
  }

  return (
    <div className="profile-aspirations">
      <div className="profile-aspirations-header">
        <h2 className="profile-aspirations-title">Edit Your Aspirations</h2>
      </div>

      {error && (
        <div className="profile-aspirations-error">
          <p>{error}</p>
        </div>
      )}

      <div className="profile-aspirations-content">
        <div className="profile-aspirations-section">
          <label className="profile-aspirations-label">Your Goal</label>
          <input
            type="text"
            className="profile-aspirations-input"
            value={goal}
            disabled
            placeholder="Your selected goal"
            title="Goal cannot be changed here. Create new aspirations to change your goal."
          />
          <small className="profile-aspirations-hint">
            Goal is set during initial aspirations setup
          </small>
        </div>

        <div className="profile-aspirations-section">
          <label className="profile-aspirations-label">Certifications</label>
          <div className="profile-aspirations-certifications">
            {certifications.map((cert, index) => (
              <div key={index} className="profile-aspirations-certification-item">
                <input
                  type="text"
                  placeholder="Certificate ID"
                  value={cert.id}
                  onChange={(e) =>
                    handleCertificationChange(index, "id", e.target.value)
                  }
                  className="profile-aspirations-cert-input"
                />
                <input
                  type="text"
                  placeholder="Certificate Name"
                  value={cert.name}
                  onChange={(e) =>
                    handleCertificationChange(index, "name", e.target.value)
                  }
                  className="profile-aspirations-cert-input"
                />
                <input
                  type="text"
                  placeholder="Institute"
                  value={cert.institute}
                  onChange={(e) =>
                    handleCertificationChange(index, "institute", e.target.value)
                  }
                  className="profile-aspirations-cert-input"
                />
                <input
                  type="date"
                  value={cert.validTill}
                  onChange={(e) =>
                    handleCertificationChange(index, "validTill", e.target.value)
                  }
                  className="profile-aspirations-cert-input"
                />
                {certifications.length > 1 && (
                  <button
                    type="button"
                    className="profile-aspirations-remove-button"
                    onClick={() => handleRemoveCertification(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="profile-aspirations-add-button"
            onClick={handleAddCertification}
          >
            + Add Certification
          </button>
        </div>

        <div className="profile-aspirations-actions">
          <button
            type="button"
            className="profile-aspirations-cancel-button"
            onClick={() => navigate("/my-aspirations")}
          >
            Cancel
          </button>
          <button
            type="button"
            className="profile-aspirations-save-button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
