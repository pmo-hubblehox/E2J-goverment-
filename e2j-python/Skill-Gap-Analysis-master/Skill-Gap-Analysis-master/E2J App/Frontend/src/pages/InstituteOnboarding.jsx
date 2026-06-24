import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Download, Trash2, Edit2, X } from "lucide-react";
import Papa from "papaparse";
import { getPrograms, getStudents, submitOnboarding } from "../services/instituteService";
import "./InstituteOnboarding.css";

const createEmptyProgramForm = () => ({
  id: "",
  name: "",
  majors: "",
  duration: "",
  fees: "",
  intake: "",
  deadline: "",
  brochureFile: null,
  brochureFileName: "",
  syllabusFile: null,
  syllabusFileName: "",
  creditStructureFile: null,
  creditStructureFileName: "",
  timetableFile: null,
  timetableFileName: "",
});

const PROGRAM_DOCUMENT_FIELDS = [
  {
    key: "brochure",
    label: "Brochure",
    fileKey: "brochureFile",
    fileNameKey: "brochureFileName",
  },
  {
    key: "syllabus",
    label: "Program Syllabus",
    fileKey: "syllabusFile",
    fileNameKey: "syllabusFileName",
  },
  {
    key: "creditStructure",
    label: "Program Credit Structure",
    fileKey: "creditStructureFile",
    fileNameKey: "creditStructureFileName",
  },
  {
    key: "timetable",
    label: "Program Timetable",
    fileKey: "timetableFile",
    fileNameKey: "timetableFileName",
  },
];

function getProgramDocumentSummary(program) {
  return PROGRAM_DOCUMENT_FIELDS
    .map(({ label, fileNameKey }) =>
      program[fileNameKey] ? `${label}: ${program[fileNameKey]}` : ""
    )
    .filter(Boolean)
    .join(", ");
}

export default function InstituteOnboarding() {
  const INSTITUTE_COMPLETED_KEY = "instituteProfileCompleted";
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.pathname === "/institute/profile";
  const [step, setStep] = useState(1);
  const [programs, setPrograms] = useState([]);
  const [students, setStudents] = useState([]);
  const [file, setFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);

  // Program Form State
  const [programForm, setProgramForm] = useState(createEmptyProgramForm);

  // Student Form State
  const [studentForm, setStudentForm] = useState({
    id: "",
    name: "",
    program: "",
    specialization: "",
    email: "",
    contact: "",
    address: "",
  });

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    let isMounted = true;

    const mapProgram = (program, index) => ({
      id: program.programId || `P${index + 1}`,
      name: program.name || "",
      majors: Array.isArray(program.majors)
        ? program.majors.join(", ")
        : program.majors || "",
      duration: program.duration ?? "",
      fees: program.fees || "",
      intake: program.intake ?? "",
      deadline: program.deadline
        ? new Date(program.deadline).toISOString().split("T")[0]
        : "",
      brochureFile: null,
      brochureFileName: program.brochureFileName || "",
      syllabusFile: null,
      syllabusFileName: program.syllabusFileName || "",
      creditStructureFile: null,
      creditStructureFileName: program.creditStructureFileName || "",
      timetableFile: null,
      timetableFileName: program.timetableFileName || "",
    });

    const mapStudent = (student, index) => ({
      id: student.studentId || `S${index + 1}`,
      name: student.name || "",
      program: student.program || "",
      specialization: student.specialization || "",
      email: student.email || "",
      contact: student.phone || student.contact || "",
      address: student.address || "",
    });

    const fetchExistingOnboarding = async () => {
      try {
        setLoading(true);
        setError(null);

        const [programsResponse, studentsResponse] = await Promise.all([
          getPrograms(),
          getStudents(),
        ]);

        const incomingPrograms = Array.isArray(programsResponse)
          ? programsResponse
          : programsResponse?.data || [];
        const incomingStudents = Array.isArray(studentsResponse)
          ? studentsResponse
          : studentsResponse?.data || [];

        if (!isMounted) {
          return;
        }

        setPrograms(incomingPrograms.map(mapProgram));
        setStudents(incomingStudents.map(mapStudent));

        if (incomingPrograms.length > 0 && incomingStudents.length > 0) {
          setStep(2);
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("instituteToken");
          navigate("/login/institute", { replace: true });
          return;
        }

        setError("Failed to load existing profile data. Please try again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchExistingOnboarding();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, navigate]);

  // Filtered Programs
  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Program Actions
  const handleAddProgram = () => {
    setEditingProgramId(null);
    setProgramForm(createEmptyProgramForm());
    setShowProgramModal(true);
  };

  const handleEditProgram = (id) => {
    const program = programs.find((p) => p.id === id);
    if (program) {
      setProgramForm({
        ...program,
        brochureFile: program.brochureFile || null,
        brochureFileName: program.brochureFileName || "",
        syllabusFile: program.syllabusFile || null,
        syllabusFileName: program.syllabusFileName || "",
        creditStructureFile: program.creditStructureFile || null,
        creditStructureFileName: program.creditStructureFileName || "",
        timetableFile: program.timetableFile || null,
        timetableFileName: program.timetableFileName || "",
      });
      setEditingProgramId(id);
      setShowProgramModal(true);
    }
  };

  const handleProgramFileUpload = (fileKey, fileNameKey, label) => (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      alert(`Please upload a valid PDF file for ${label.toLowerCase()}.`);
      e.target.value = "";
      return;
    }

    setProgramForm((prev) => ({
      ...prev,
      [fileKey]: selectedFile,
      [fileNameKey]: selectedFile.name,
    }));
  };

  const handleSaveProgram = () => {
    if (
      !programForm.name ||
      !programForm.majors ||
      !programForm.duration ||
      !programForm.fees
    ) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingProgramId) {
      // Update existing program
      setPrograms(
        programs.map((p) =>
          p.id === editingProgramId ? { ...programForm } : p
        )
      );
    } else {
      // Add new program
      const newId = `P${programs.length + 1}`;
      setPrograms([...programs, { ...programForm, id: newId }]);
    }

    setShowProgramModal(false);
    setProgramForm(createEmptyProgramForm());
  };

  const handleDeleteProgram = (id) => {
    if (window.confirm("Are you sure you want to delete this program?")) {
      setPrograms(programs.filter((p) => p.id !== id));
    }
  };

  const handleDownloadPrograms = () => {
    // Create CSV content
    const headers = [
      "Program Id",
      "Name Of Program",
      "Majors",
      "Duration (Years)",
      "Total Fees",
      "Intake Capacity",
      "Deadline",
      "Brochure",
      "Program Syllabus",
      "Program Credit Structure",
      "Program Timetable",
    ];
    const rows = programs.map((p) => [
      p.id,
      p.name,
      p.majors,
      p.duration,
      p.fees,
      p.intake,
      p.deadline,
      p.brochureFileName || "",
      p.syllabusFileName || "",
      p.creditStructureFileName || "",
      p.timetableFileName || "",
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.join(",") + "\n";
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "programs.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Student Actions
  const handleOpenUploadModal = () => {
    setShowUploadModal(true);
  };

  const handleOpenStudentModal = () => {
    setEditingStudentId(null);
    setStudentForm({
      id: "",
      name: "",
      program: "",
      specialization: "",
      email: "",
      contact: "",
      address: "",
    });
    setShowStudentModal(true);
  };

  const handleEditStudent = (id) => {
    const student = students.find((s) => s.id === id);
    if (student) {
      setStudentForm(student);
      setEditingStudentId(id);
      setShowStudentModal(true);
    }
  };

  const handleSaveStudent = () => {
    if (
      !studentForm.name ||
      !studentForm.program ||
      !studentForm.email ||
      !studentForm.contact
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentForm.email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (editingStudentId) {
      // Update existing student
      setStudents(
        students.map((s) =>
          s.id === editingStudentId ? { ...studentForm } : s
        )
      );
    } else {
      // Add new student
      const newId = `S${students.length + 1}`;
      setStudents([...students, { ...studentForm, id: newId }]);
    }

    setShowStudentModal(false);
    setStudentForm({
      id: "",
      name: "",
      program: "",
      specialization: "",
      email: "",
      contact: "",
      address: "",
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const fileExtension = selectedFile.name.split(".").pop().toLowerCase();

      if (!"csv".includes(fileExtension)) {
        setError("Please upload a CSV file (.csv)");
        return;
      }

      // Reset error when new file is selected
      setError(null);

      setFile({
        name: selectedFile.name,
        size: (selectedFile.size / (1024 * 1024)).toFixed(2),
        file: selectedFile,
      });

      // Parse CSV immediately on file selection
      handleFileUpload(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleFileUpload = (fileObj) => {
    Papa.parse(fileObj, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        console.log("Parsed CSV:", results.data);

        // Map CSV fields to student structure
        const formattedData = results.data
          .map((row, index) => {
            // Find the correct field names (case-insensitive)
            const getFieldValue = (row, fieldNames) => {
              for (const key in row) {
                if (
                  fieldNames.some(
                    (name) => key.toLowerCase().includes(name.toLowerCase())
                  )
                ) {
                  return row[key];
                }
              }
              return "";
            };

            return {
              id: `S${index + 1}`,
              name: getFieldValue(row, ["Student Name", "Name"]) || "",
              program: getFieldValue(row, ["Program", "Course"]) || "",
              specialization:
                getFieldValue(row, [
                  "Area Of Specialization",
                  "Specialization",
                ]) || "",
              email: getFieldValue(row, ["Email Address", "Email"]) || "",
              contact:
                getFieldValue(row, [
                  "Contact Number",
                  "Contact",
                  "Phone",
                  "Mobile",
                ]) || "",
              address: getFieldValue(row, ["Address"]) || "",
            };
          })
          // Filter out rows with missing required fields
          .filter((student) => student.name && student.program && student.email && student.contact);

        if (formattedData.length === 0) {
          setError("No valid student records found. Please check your CSV file.");
          return;
        }

        setStudents(formattedData);
        setFile(null);
        alert(`✓ Successfully loaded ${formattedData.length} student(s)! Click Submit to add them.`);
      },
      error: function (err) {
        console.error("CSV Parse Error:", err);
        setError(`Error parsing CSV: ${err.message}`);
      },
    });
  };

  const handleSubmitUpload = async () => {
    if (students.length === 0) {
      setError("Please add students before submitting");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Submitting students:", students);

      // OPTIONAL: Send data to backend for bulk upload
      // Example: await axios.post("/api/institute/students/bulk", students);

      // Close modal
      setShowUploadModal(false);

      // Clear state
      setFile(null);
      setStudents([]);

      // Set completion flag as this is a final step in onboarding
      localStorage.setItem(INSTITUTE_COMPLETED_KEY, "true");

      // Show success message and redirect immediately
      alert("✓ Students added successfully! Redirecting to institute home...");

      // Force redirect with a slight delay to ensure state updates complete
      setTimeout(() => {
        navigate("/institute/home", { replace: true });
      }, 500);
    } catch (error) {
      console.error("Submit error:", error);
      setError("Failed to submit students. Please try again.");
      alert("Error: Failed to submit students");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      setStudents(students.filter((s) => s.id !== id));
    }
  };



  const handleNextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleDownloadTemplate = (e) => {
    e.preventDefault();
    
    const templateHeaders = ["Student Name", "Program", "Specialization", "Email", "Contact Number", "Address"];
    
    // Only include headers - NO DEFAULT DATA
    let csvContent = templateHeaders.join(",") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student_template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmitForm = async () => {
    if (step === 1) {
      if (programs.length === 0) {
        alert("Please add at least one program before continuing.");
        return;
      }
      handleNextStep();
    } else if (step === 2) {
      if (students.length === 0) {
        alert("Please add students before submitting.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await submitOnboarding({ programs, students });
        console.log("Onboarding submitted successfully:", response);
        alert("✓ Onboarding completed successfully! Redirecting to institute home...");

        // Mark profile as completed in localStorage (persist across refreshes)
        localStorage.setItem(INSTITUTE_COMPLETED_KEY, "true");

        // If backend returns status, also update localStorage from backend (prefers backend source)
        if (response?.data?.profileCompleted === true) {
          localStorage.setItem(INSTITUTE_COMPLETED_KEY, "true");
        }

        // Clear form after successful submission
        setPrograms([]);
        setStudents([]);
        setStep(1);

        // Redirect to institute homepage after successful submission
        setTimeout(() => {
          navigate("/institute/home", { replace: true });
        }, 500);
      } catch (err) {
        console.error("Error submitting onboarding:", err);
        const errorMessage =
          err.response?.data?.message || "Failed to submit onboarding. Please try again.";
        setError(errorMessage);
        alert(`Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="institute-onboarding-page">
      <div className="institute-onboarding-container">
        {/* Top Section */}
        <div className="institute-onboarding-header">
          <h1 className="institute-onboarding-title">Institute Registration</h1>
          <p className="institute-onboarding-subtitle">
            Kindly fill in the required information below to complete your
            onboarding...
          </p>
        </div>

        {/* Stepper */}
        <div className="institute-stepper">
          {/* Step 1 */}
          <div className="institute-stepper-item">
            <div className={`institute-stepper-circle active`}>
              <span className="stepper-icon">✓</span>
            </div>
            <span className="institute-stepper-label active">
              Program Details
            </span>
          </div>

          {/* Connector Line */}
          <div className="institute-stepper-connector"></div>

          {/* Step 2 */}
          <div className="institute-stepper-item">
            <div
              className={`institute-stepper-circle ${
                step >= 2 ? "active" : "inactive"
              }`}
            >
              <span className="stepper-text">2</span>
            </div>
            <span
              className={`institute-stepper-label ${
                step >= 2 ? "active" : "inactive"
              }`}
            >
              Student Details
            </span>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="institute-card-container">
          {/* STEP 1 - Program Details */}
          {step === 1 && (
            <div className="institute-step-content">
              {/* Top Controls */}
              <div className="institute-controls-bar">
                <div className="institute-controls-group">
                  <div className="institute-search-container">
                    <Search className="search-icon" size={18} />
                    <input
                      type="text"
                      className="institute-search-input"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <button
                    className="institute-icon-button"
                    onClick={handleDownloadPrograms}
                    title="Download Programs"
                  >
                    <Download size={20} />
                  </button>

                  <div
                    className="institute-filter-container"
                    style={{ position: "relative" }}
                  >
                    <button
                      className="institute-filter-button"
                      onClick={() => setFilterOpen(!filterOpen)}
                    >
                      Filter
                    </button>
                    {filterOpen && (
                      <div className="institute-filter-menu">
                        <div
                          className="institute-filter-option"
                          onClick={() => {
                            setSelectedFilter("all");
                            setFilterOpen(false);
                          }}
                        >
                          All Programs
                        </div>
                        <div
                          className="institute-filter-option"
                          onClick={() => {
                            setSelectedFilter("recent");
                            setFilterOpen(false);
                          }}
                        >
                          Recent
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="institute-add-button"
                    onClick={handleAddProgram}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Program Table */}
              <div className="institute-table-wrapper">
                <table className="institute-table">
                  <thead>
                    <tr className="institute-table-header">
                      <th>Program Id</th>
                      <th>Name Of Program</th>
                      <th>Majors</th>
                      <th>Duration (Years)</th>
                      <th>Total Fees</th>
                      <th>Intake Capacity</th>
                      <th>Deadline</th>
                      <th>Program Documents</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrograms.length > 0 ? (
                      filteredPrograms.map((program) => (
                        <tr key={program.id} className="institute-table-row">
                          <td>{program.id}</td>
                          <td>{program.name}</td>
                          <td>{program.majors}</td>
                          <td>{program.duration}</td>
                          <td>{program.fees}</td>
                          <td>{program.intake}</td>
                          <td>{program.deadline}</td>
                          <td>{getProgramDocumentSummary(program) || "—"}</td>
                          <td className="institute-table-actions">
                            <button
                              className="action-btn edit-btn"
                              onClick={() => handleEditProgram(program.id)}
                              title="Edit Program"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteProgram(program.id)}
                              title="Delete Program"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="institute-table-empty">
                          No programs added yet. Click "+ Add" to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Action Bar */}
              <div className="institute-action-bar">
                <button className="institute-back-button" disabled>
                  Back
                </button>
                <button
                  className="institute-next-button"
                  onClick={handleSubmitForm}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 - Student Details */}
          {step === 2 && (
            <div className="institute-step-content">
              {students.length === 0 ? (
                // Empty State
                <div className="institute-empty-state">
                  <img
                    src="/assets/add-students.png"
                    alt="Add Students"
                    className="institute-empty-illustration"
                  />
                  <p className="institute-empty-text">
                    Please Add Students To Complete The Registration
                    Process
                  </p>
                  <div className="institute-empty-actions">
                    <button
                      className="institute-add-students-button"
                      onClick={handleOpenStudentModal}
                    >
                      ✏️ Add Manually
                    </button>
                    <button
                      className="institute-add-students-button"
                      onClick={handleOpenUploadModal}
                    >
                      📤 Upload Bulk
                    </button>
                  </div>
                </div>
              ) : (
                // Student Table
                <div>
                  <div className="institute-controls-bar">
                    <div className="institute-controls-group">
                      <button
                        className="institute-add-button"
                        onClick={handleOpenStudentModal}
                      >
                        ✏️ Add Manually
                      </button>
                      <button
                        className="institute-add-button"
                        onClick={handleOpenUploadModal}
                      >
                        📤 Upload Bulk
                      </button>
                    </div>
                  </div>

                  <div className="institute-table-wrapper">
                    <table className="institute-table">
                      <thead>
                        <tr className="institute-table-header">
                          <th>Student Id</th>
                          <th>Student Name</th>
                          <th>Program</th>
                          <th>Area Of Specialization</th>
                          <th>Email Address</th>
                          <th>Contact Number</th>
                          <th>Address</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="institute-table-row">
                            <td>{student.id}</td>
                            <td>{student.name}</td>
                            <td>{student.program}</td>
                            <td>{student.specialization}</td>
                            <td>{student.email}</td>
                            <td>{student.contact}</td>
                            <td>{student.address}</td>
                            <td className="institute-table-actions">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEditStudent(student.id)}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() =>
                                  handleDeleteStudent(student.id)
                                }
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="institute-action-bar">
                <button
                  className="institute-back-button"
                  onClick={handleBackStep}
                >
                  Back
                </button>
                <button
                  className="institute-next-button"
                  onClick={handleSubmitForm}
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Program Modal */}
      {showProgramModal && (
        <div className="institute-modal-overlay">
          <div className="institute-modal">
            <div className="institute-modal-header">
              <h2 className="institute-modal-title">
                {editingProgramId ? "Edit Program" : "Add New Program"}
              </h2>
              <button
                className="institute-modal-close"
                onClick={() => setShowProgramModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="institute-modal-content">
              <div className="institute-form-group">
                <label className="institute-form-label">Program Name*</label>
                <input
                  type="text"
                  className="institute-form-input"
                  placeholder="Enter program name"
                  value={programForm.name}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, name: e.target.value })
                  }
                />
              </div>

              <div className="institute-form-group">
                <label className="institute-form-label">Number of Majors*</label>
                <input
                  type="number"
                  className="institute-form-input"
                  placeholder="e.g. 3"
                  value={programForm.majors}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, majors: e.target.value })
                  }
                />
              </div>

              <div className="institute-form-group">
                <label className="institute-form-label">Duration (Years)*</label>
                <input
                  type="number"
                  className="institute-form-input"
                  placeholder="e.g. 4"
                  value={programForm.duration}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, duration: e.target.value })
                  }
                />
              </div>

              <div className="institute-form-group">
                <label className="institute-form-label">Total Fees*</label>
                <input
                  type="text"
                  className="institute-form-input"
                  placeholder="e.g. $50,000"
                  value={programForm.fees}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, fees: e.target.value })
                  }
                />
              </div>

              <div className="institute-form-group">
                <label className="institute-form-label">Intake Capacity</label>
                <input
                  type="number"
                  className="institute-form-input"
                  placeholder="e.g. 100"
                  value={programForm.intake}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, intake: e.target.value })
                  }
                />
              </div>

              <div className="institute-form-group">
                <label className="institute-form-label">Application Deadline</label>
                <input
                  type="date"
                  className="institute-form-input"
                  value={programForm.deadline}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, deadline: e.target.value })
                  }
                />
              </div>

              {PROGRAM_DOCUMENT_FIELDS.map(({ key, label, fileKey, fileNameKey }) => (
                <div key={key} className="institute-form-group">
                  <label className="institute-form-label">{label}</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="institute-form-input"
                    onChange={handleProgramFileUpload(fileKey, fileNameKey, label)}
                  />
                  {programForm[fileNameKey] && (
                    <small style={{ color: "#666", marginTop: 6, display: "inline-block" }}>
                      Selected: {programForm[fileNameKey]}
                    </small>
                  )}
                </div>
              ))}
            </div>

            <div className="institute-modal-actions">
              <button
                className="institute-modal-cancel"
                onClick={() => setShowProgramModal(false)}
              >
                Cancel
              </button>
              <button
                className="institute-modal-submit"
                onClick={handleSaveProgram}
              >
                {editingProgramId ? "Update" : "Add"} Program
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <div className="institute-modal-overlay">
          <div className="institute-modal">
            <div className="institute-modal-header">
              <h2 className="institute-modal-title">
                {editingStudentId ? "Edit Student" : "Add New Student"}
              </h2>
              <button
                className="institute-modal-close"
                onClick={() => setShowStudentModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="institute-modal-content">
              <div className="institute-form-group">
                <label className="institute-form-label">Student Name*</label>
                <input
                  type="text"
                  className="institute-form-input"
                  placeholder="Enter student name"
                  value={studentForm.name}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, name: e.target.value })
                  }
                />
              </div>

              <div className="institute-form-group">
                <label className="institute-form-label">Program*</label>
                <select
                  className="institute-form-input"
                  value={studentForm.program}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, program: e.target.value })
                  }
                >
                  <option value="">Select Program</option>
                  {programs.map((prog) => (
                    <option key={prog.id} value={prog.name}>
                      {prog.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="institute-form-group">
                <label className="institute-form-label">
                  Area Of Specialization
                </label>
                <input
                  type="text"
                  className="institute-form-input"
                  placeholder="e.g. AI/ML, Web Development"
                  value={studentForm.specialization}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      specialization: e.target.value,
                    })
                  }
                />
              </div>

              <div className="institute-form-group">
                <label className="institute-form-label">Email Address*</label>
                <input
                  type="email"
                  className="institute-form-input"
                  placeholder="student@example.com"
                  value={studentForm.email}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, email: e.target.value })
                  }
                />
              </div>

              <div className="institute-form-group">
                <label className="institute-form-label">Contact Number*</label>
                <input
                  type="tel"
                  className="institute-form-input"
                  placeholder="+1234567890"
                  value={studentForm.contact}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, contact: e.target.value })
                  }
                />
              </div>

              <div className="institute-form-group">
                <label className="institute-form-label">Address</label>
                <textarea
                  className="institute-form-input"
                  placeholder="Enter address"
                  value={studentForm.address}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, address: e.target.value })
                  }
                  rows="3"
                />
              </div>
            </div>

            <div className="institute-modal-actions">
              <button
                className="institute-modal-cancel"
                onClick={() => setShowStudentModal(false)}
              >
                Cancel
              </button>
              <button
                className="institute-modal-submit"
                onClick={handleSaveStudent}
              >
                {editingStudentId ? "Update" : "Add"} Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="institute-modal-overlay">
          <div className="institute-modal">
            <div className="institute-modal-header">
              <h2 className="institute-modal-title">Bulk Upload Data</h2>
              <button
                className="institute-modal-close"
                onClick={() => {
                  setShowUploadModal(false);
                  setFile(null);
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="institute-modal-content">
              <p className="institute-modal-subtitle">
                Upload your data through CSV file
              </p>

              {error && (
                <div className="institute-error-message">
                  ⚠️ {error}
                </div>
              )}

              {/* File Upload Area */}
              <div className="institute-file-upload-area">
                <input
                  type="file"
                  id="file-input"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                {file ? (
                  <div className="institute-file-display">
                    <div className="institute-file-info">
                      <span className="institute-file-name">{file.name}</span>
                      <span className="institute-file-size">
                        {file.size}MB
                      </span>
                    </div>
                    <button
                      className="institute-file-delete"
                      onClick={handleRemoveFile}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="file-input" className="institute-file-label">
                    <span className="institute-file-text">
                      Click to upload or drag and drop
                    </span>
                    <span className="institute-file-subtext">
                      (CSV or XLS files up to 10MB)
                    </span>
                  </label>
                )}
              </div>

              {/* Template Link */}
              <a 
                href="#" 
                className="institute-template-link"
                onClick={handleDownloadTemplate}
              >
                📥 Download Template
              </a>
            </div>

            <div className="institute-modal-actions">
              <button
                className="institute-modal-cancel"
                onClick={() => {
                  setShowUploadModal(false);
                  setFile(null);
                }}
              >
                Cancel
              </button>
              <button
                className="institute-modal-submit"
                onClick={handleSubmitUpload}
                disabled={students.length === 0 || loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}