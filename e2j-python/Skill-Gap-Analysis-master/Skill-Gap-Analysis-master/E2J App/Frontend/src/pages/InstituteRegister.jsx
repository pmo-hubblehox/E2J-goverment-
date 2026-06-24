import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/InstituteRegister.css";
import Stepper from "../components/Stepper";

export default function InstituteRegister() {
  const navigate = useNavigate();
  const fileInputsRef = useRef({});
  const steps = ["Institute Information", "Services", "Payments"];
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    website: "",
    email: "",
    password: "",
    registeredAddress: {
      buildingName: "",
      roomNumber: "",
      country: "",
      pincode: "",
      state: "",
      city: "",
      area: "",
      landmark: "",
      locationPin: "",
    },
    contacts: [{ name: "", email: "", phone: "" }],
    documents: {
      accreditationBody: "",
      accreditationCertificate: null,
      universityCertificate: null,
      ugcCertificate: null,
      rating: null,
    },
    mou: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [section, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (field.includes(".")) {
      const [section, subfield] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [subfield]: file },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: file }));
    }
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { name: "", email: "", phone: "" }],
    }));
  };

  const updateContact = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      ),
    }));
  };

  const triggerFileInput = (key) => {
    if (fileInputsRef.current[key]) {
      fileInputsRef.current[key].click();
    }
  };

  const fileLabel = (file) => (file ? file.name : "Click to upload or drag and drop");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // For now, just send the data without files (files would need multer on backend)
      const submitData = { ...formData };
      // Remove files for now
      submitData.documents = { ...formData.documents };
      Object.keys(submitData.documents).forEach(key => {
        if (submitData.documents[key] instanceof File) {
          submitData.documents[key] = submitData.documents[key].name;
        }
      });
      if (submitData.mou instanceof File) {
        submitData.mou = submitData.mou.name;
      }

      await axios.post("http://localhost:5000/api/institute/register", submitData);
      navigate("/login/institute");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="institute-register-container">
      <div className="institute-register-content">
        <Stepper steps={steps} activeStep={0} />

        <h1 className="institute-register-title">Institution Registration</h1>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Section 1 - Institute Details */}
          <div className="section-card">
            <h2 className="section-title">Institute Details</h2>
            <div className="form-grid">
              <div>
                <label className="form-label">Institute Name</label>
                <input
                  className="form-input"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="form-label">Type of Institute</label>
                <select
                  className="form-select"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div>
                <label className="form-label">Website URL</label>
                <input
                  className="form-input"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-field-full">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2 - Registered Address */}
          <div className="section-card">
            <h2 className="section-title">Registered Address</h2>
            <div className="form-grid">
              <div>
                <label className="form-label">Building Name</label>
                <input
                  className="form-input"
                  name="registeredAddress.buildingName"
                  value={formData.registeredAddress.buildingName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="form-label">Room Number / Floor</label>
                <input
                  className="form-input"
                  name="registeredAddress.roomNumber"
                  value={formData.registeredAddress.roomNumber}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="form-label">Country</label>
                <select
                  className="form-select"
                  name="registeredAddress.country"
                  value={formData.registeredAddress.country}
                  onChange={handleChange}
                >
                  <option value="">Select Country</option>
                  <option value="India">India</option>
                </select>
              </div>
              <div>
                <label className="form-label">Pincode</label>
                <input
                  className="form-input"
                  name="registeredAddress.pincode"
                  value={formData.registeredAddress.pincode}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="form-label">State</label>
                <input
                  className="form-input"
                  name="registeredAddress.state"
                  value={formData.registeredAddress.state}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="form-label">City</label>
                <input
                  className="form-input"
                  name="registeredAddress.city"
                  value={formData.registeredAddress.city}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="form-label">Area / Locality</label>
                <input
                  className="form-input"
                  name="registeredAddress.area"
                  value={formData.registeredAddress.area}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="form-label">Landmark</label>
                <input
                  className="form-input"
                  name="registeredAddress.landmark"
                  value={formData.registeredAddress.landmark}
                  onChange={handleChange}
                />
              </div>
              <div className="form-field-full">
                <label className="form-label">Location Pin (Google Maps URL)</label>
                <input
                  className="form-input"
                  name="registeredAddress.locationPin"
                  type="url"
                  value={formData.registeredAddress.locationPin}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Section 3 - Placement Officer Information */}
          <div className="section-card">
            <h2 className="section-title">Placement Officer Information</h2>
            {formData.contacts.map((contact, index) => (
              <div key={index} className="contact-group">
                <div className="form-grid">
                  <div>
                    <label className="form-label">Contact Person Name</label>
                    <input
                      className="form-input"
                      value={contact.name}
                      onChange={(e) => updateContact(index, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Contact Person Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateContact(index, "email", e.target.value)}
                    />
                  </div>
                  <div className="form-field-full">
                    <label className="form-label">Contact Person Phone Number</label>
                    <input
                      className="form-input"
                      value={contact.phone}
                      onChange={(e) => updateContact(index, "phone", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="add-contact-btn" onClick={addContact}>
              + Add Contacts
            </button>
          </div>

          {/* Section 4 - Documents Upload */}
          <div className="section-card">
            <h2 className="section-title">Documents Upload</h2>
            <div className="form-grid">
              <div>
                <label className="form-label">Accreditation Body</label>
                <select
                  className="form-select"
                  name="documents.accreditationBody"
                  value={formData.documents.accreditationBody}
                  onChange={handleChange}
                >
                  <option value="">Select Body</option>
                  <option value="NAAC">NAAC</option>
                  <option value="NBA">NBA</option>
                </select>
              </div>
              <div>
                <label className="form-label">Accreditation Certificate</label>
                <div
                  className="file-upload-box"
                  onClick={() => triggerFileInput("documents.accreditationCertificate")}
                >
                  <input
                    type="file"
                    ref={(el) => (fileInputsRef.current["documents.accreditationCertificate"] = el)}
                    className="hidden-file-input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "documents.accreditationCertificate")}
                  />
                  <span>{fileLabel(formData.documents.accreditationCertificate)}</span>
                </div>
              </div>
              <div>
                <label className="form-label">University Certificate</label>
                <div
                  className="file-upload-box"
                  onClick={() => triggerFileInput("documents.universityCertificate")}
                >
                  <input
                    type="file"
                    ref={(el) => (fileInputsRef.current["documents.universityCertificate"] = el)}
                    className="hidden-file-input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "documents.universityCertificate")}
                  />
                  <span>{fileLabel(formData.documents.universityCertificate)}</span>
                </div>
              </div>
              <div>
                <label className="form-label">UGC Certificate</label>
                <div
                  className="file-upload-box"
                  onClick={() => triggerFileInput("documents.ugcCertificate")}
                >
                  <input
                    type="file"
                    ref={(el) => (fileInputsRef.current["documents.ugcCertificate"] = el)}
                    className="hidden-file-input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "documents.ugcCertificate")}
                  />
                  <span>{fileLabel(formData.documents.ugcCertificate)}</span>
                </div>
              </div>
              <div>
                <label className="form-label">Rating</label>
                <div
                  className="file-upload-box"
                  onClick={() => triggerFileInput("documents.rating")}
                >
                  <input
                    type="file"
                    ref={(el) => (fileInputsRef.current["documents.rating"] = el)}
                    className="hidden-file-input"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "documents.rating")}
                  />
                  <span>{fileLabel(formData.documents.rating)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 - MoU Upload */}
          <div className="section-card">
            <h2 className="section-title">MoU Upload</h2>
            <p>
              <a href="#" className="auth-link">Download MoU Template</a>
            </p>
            <div>
              <label className="form-label">Upload MoU</label>
              <div
                className="file-upload-box"
                onClick={() => triggerFileInput("mou")}
              >
                <input
                  type="file"
                  ref={(el) => (fileInputsRef.current["mou"] = el)}
                  className="hidden-file-input"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, "mou")}
                />
                <span>{fileLabel(formData.mou)}</span>
              </div>
            </div>
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? "Registering…" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}