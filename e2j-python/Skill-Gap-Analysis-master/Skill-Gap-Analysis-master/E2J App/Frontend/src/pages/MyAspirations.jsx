import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { createAspirations, getAspirations } from "../services/aspirationsService";
import { startAiAnalysis, suggestPositions } from "../services/aiAnalysisService";
import { getProfile } from "../services/profileService";
import "../styles/aspirations.css";
import introImg from "../assets/images/aspirations/first time user-background.svg";
import goalPlanImg from "../assets/images/aspirations/goal-plan.svg";
import goalLevelUpImg from "../assets/images/aspirations/goal-level-up.svg";
import goalExploreImg from "../assets/images/aspirations/goal-explore.svg";
import profileThumbImg from "../assets/images/aspirations/aspirations-profile thumbnail.svg";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STEPS = [
  { id: 1, label: "Your Goal" },
  { id: 2, label: "Role Areas" },
  { id: 3, label: "Suggested Roles" },
];

const GOALS = [
  {
    id: "career",
    title: "Plan My Career Path",
    description:
      "Discover The Right Career Roles For Your Background And Learn What Skills You'll Need To Get There",
    icon: goalPlanImg,
  },
  {
    id: "skills",
    title: "Level Up My Skills",
    description:
      "Strengthen The Skills That Matter The Most For Your Current Or Desired Role And Advance Your Career Growth",
    icon: goalLevelUpImg,
  },
  {
    id: "explore",
    title: "Explore & Discover Interests",
    description:
      "Explore Topics, Tools Or Technologies Beyond Your Current Domain To Expand Your Knowledge And Interests",
    icon: goalExploreImg,
  },
];

const MAX_ROLE_SUGGESTIONS = 10;
const FIXED_ANALYSIS_MODE = "Course Recommendation";
const FIXED_NUM_SAMPLE_JOBS = 10;

function normalizeText(value) {
  return typeof value === "string"? value.trim() : "";
}

function deriveSuggestionField(profile, aiContext) {
  const education = Array.isArray(profile?.education)? profile.education[0] : null;
  const values = [
    aiContext?.instituteStudent?.program,
    aiContext?.instituteStudent?.specialization,
    education?.degree,
    education?.specialization,
  ]
   .map(normalizeText)
   .filter(Boolean);
  return values.join(" ");
}

function normalizeRoleSuggestions(response) {
  const candidates = Array.isArray(response)
   ? response
    : Array.isArray(response?.positions)
     ? response.positions
      : Array.isArray(response?.roles)
       ? response.roles
        : Array.isArray(response?.suggestions)
         ? response.suggestions
          : [];
  return [...new Set(candidates.map((item) => {
    if (typeof item === "string") return item.trim();
    if (typeof item?.title === "string") return item.title.trim();
    if (typeof item?.position === "string") return item.position.trim();
    if (typeof item?.name === "string") return item.name.trim();
    return "";
  }).filter(Boolean))].slice(0, MAX_ROLE_SUGGESTIONS);
}

function getProgressStep(formState) {
  if (!formState.goal) return 1;
  if (!formState.roleAreas.length) return 2;
  return 3;
}

// ── Stepper component ─────────────────────────────────────────────────────────
function Stepper({ step }) {
  return (
    <div className="asp-stepper" role="list" aria-label="Aspirations progress">
      {STEPS.map((s, idx) => {
        const isCompleted = step > s.id;
        const isCurrent = step === s.id;
        const isLast = idx === STEPS.length - 1;
        return (
          <React.Fragment key={s.id}>
            <div
              className={`asp-step ${isCompleted? "completed" : isCurrent? "current" : "upcoming"}`}
              role="listitem"
              aria-current={isCurrent? "step" : undefined}
            >
              <div className="asp-step-node">
                {isCompleted? (
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                    <path
                      d="M1 5L4.5 8.5L11 1.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  s.id
                )}
              </div>
              <span className="asp-step-label">{s.label}</span>
            </div>
            {!isLast && (
              <div
                className={`asp-step-line ${isCompleted? "solid" : "dashed"}`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Profile card component ────────────────────────────────────────────────────
function AspHeader({ profile, userName }) {
  const displayName = profile
   ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") || userName
    : userName;
  const hasCompletedProfile = Boolean(profile?.profileCompleted);
  const edu = hasCompletedProfile? profile?.education?.[0] : null;

  return (
    <section className="asp-profile-card" aria-label="Student academic summary">
      <div className="asp-profile-top">
        <img src={profileThumbImg} alt="" className="asp-profile-avatar" aria-hidden="true" />
        <div className="asp-profile-info">
          <div className="asp-profile-name">{displayName}</div>
          <div className="asp-profile-meta" aria-hidden="true">&nbsp;</div>
        </div>
      </div>
      <div className="asp-profile-divider" aria-hidden="true" />
      {edu? (
        <div className="asp-profile-details">
          <span>
            <strong>Program :</strong> {edu.degree || "--"}
          </span>
          <span>
            <strong>Honors :</strong> {edu.specialization || "--"}
          </span>
          <span>
            <strong>Year :</strong>{" "}
            {edu.currentlyPursuing? "Currently Pursuing" : edu.yearOfPassing || "--"}
          </span>
        </div>
      ) : (
        <div className="asp-profile-no-info">
          Complete your profile to view academic details.
        </div>
      )}
    </section>
  );
}

// ── Existing Aspirations Card ─────────────────────────────────────────────────
function ExistingAspirationsCard({ aspirations, onViewReport, onRetake, saving }) {
  const goalLabel = GOALS.find((g) => g.id === aspirations?.goal)?.title || aspirations?.goal || "--";
  const goalIcon = GOALS.find((g) => g.id === aspirations?.goal)?.icon || null;
  const isFinished = aspirations?.aiStatus === "finished" && aspirations?.aiResult;
  const isFailed = aspirations?.aiStatus === "failed";
  const isPending = aspirations?.aiStatus === "pending" || aspirations?.aiStatus === "processing";

  return (
    <div className="asp-existing-card">
      <div className="asp-existing-header">
      </div>

      <div className="asp-existing-summary">
        {goalIcon && (
          <div className="asp-existing-goal-icon">
            <img src={goalIcon} alt="" aria-hidden="true" />
          </div>
        )}
        <div className="asp-existing-details">
          <div className="asp-existing-row">
            <span className="asp-existing-label">Goal</span>
            <span className="asp-existing-value">{goalLabel}</span>
          </div>
          <div className="asp-existing-row">
            <span className="asp-existing-label">Role</span>
            <span className="asp-existing-value">{aspirations?.roleMatch || "--"}</span>
          </div>
          <div className="asp-existing-row">
            <span className="asp-existing-label">Analysis Status</span>
            <span className={`asp-existing-status asp-existing-status--${aspirations?.aiStatus || "unknown"}`}>
              {isFinished
               ? "Ready"
                : isFailed
                 ? "Failed"
                  : isPending
                   ? "Processing..."
                    : aspirations?.aiStatus || "Unknown"}
            </span>
          </div>
        </div>
      </div>

      <div className="asp-existing-actions">
        {isFinished && aspirations?.aiTaskId? (
          <button
            type="button"
            className="asp-btn-primary"
            onClick={onViewReport}
          >
            View Report
          </button>
        ) : isPending && aspirations?.aiTaskId? (
          <button
            type="button"
            className="asp-btn-primary"
            onClick={onViewReport}
          >
            Check Report Status
          </button>
        ) : (
          <button
            type="button"
            className="asp-btn-primary"
            onClick={onRetake}
          >
            Start New Analysis
          </button>
        )}
      </div>
    </div>
  );
}

function AspFlowWithHistory({ profile, existingAspirations,...props }) {
  return (
    <div className="asp-flow-with-history">
      {/* Show existing report summary if it exists */}
      {existingAspirations && (
        <div className="asp-existing-mini-card">
          <div className="asp-existing-mini-header">
            <h3>Your Previous Report</h3>
            <span className="asp-existing-mini-badge">
              {existingAspirations.aiStatus === "finished"? "Complete" : "In Progress"}
            </span>
          </div>
          <div className="asp-existing-mini-details">
            <span>Goal: {GOALS.find(g => g.id === existingAspirations.goal)?.title}</span>
            <span>Role: {existingAspirations?.roleMatch || "--"}</span>
          </div>
        </div>
      )}

      {/* Continue with the flow */}
      <AspFlowForm profile={profile} existingAspirations={existingAspirations} {...props} />
    </div>
  );
}

function ExistingReportsList({ aspirations, onViewReport, onRetake }) {
  // Handle both single object and array
  const reports = Array.isArray(aspirations)? aspirations : [aspirations].filter(Boolean);

  return (
    <div className="asp-reports-container">

      {/* Header */}
      <div className="asp-reports-header">
        <div className="asp-reports-header-left">
          <h2>Your Skill Readiness Reports</h2>
          <p>
            You have {reports.length} report{reports.length!== 1? "s" : ""}
          </p>
        </div>

        <button
          type="button"
          className="asp-btn-primary"
          onClick={onRetake}
        >
          + Start New Analysis
        </button>
      </div>

      {/* Cards Grid */}
      <div className="asp-reports-grid">
        {reports.map((asp, idx) => (
          <ExistingAspirationsCard
            key={asp.id || asp._id || asp.analysisId || idx}
            aspirations={asp}
            onViewReport={() => onViewReport(asp)}
            onRetake={onRetake}
          />
        ))}
      </div>

    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MyAspirations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userRole = localStorage.getItem("userRole") || "Student";
  const forceEditMode = searchParams.get("edit") === "1";

  const [screen, setScreen] = useState("loading"); // "loading" | "existing" | "intro" | "flow"
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    goal: "",
    roleAreas: [],
    roleMatch: "",
    curriculumChoice: "",
    analysisMode: FIXED_ANALYSIS_MODE,
    numSampleJobs: String(FIXED_NUM_SAMPLE_JOBS),
  });

  const [profile, setProfile] = useState(null);
  const [aiContext, setAiContext] = useState(null);
  const [existingAspirations, setExistingAspirations] = useState([]);
  const [roleSuggestions, setRoleSuggestions] = useState([]);
  const [roleSuggestionsLoading, setRoleSuggestionsLoading] = useState(false);
  const [roleSuggestionsError, setRoleSuggestionsError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [manualRoleInput, setManualRoleInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadRoleSuggestions = async (profileData, nextAiContext) => {
      const field = deriveSuggestionField(profileData, nextAiContext);
      if (!field) {
        setRoleSuggestions([]);
        setRoleSuggestionsError("Unable to fetch role suggestions");
        return;
      }
      setRoleSuggestionsLoading(true);
      setRoleSuggestionsError("");
      try {
        const response = await suggestPositions(field);
        const suggestions = normalizeRoleSuggestions(response);
        if (!suggestions.length) {
          setRoleSuggestions([]);
          setRoleSuggestionsError("Unable to fetch role suggestions");
          return;
        }
        setRoleSuggestions(suggestions);
      } catch (suggestionError) {
        console.error("Failed to fetch role suggestions:", suggestionError);
        setRoleSuggestions([]);
        setRoleSuggestionsError("Unable to fetch role suggestions");
      } finally {
        setRoleSuggestionsLoading(false);
      }
    };

    const init = async () => {
      setLoading(true);
      let aspirationsList = [];

      try {
        const res = await getAspirations();
        aspirationsList = Array.isArray(res?.aspirations)? res.aspirations : [];
        setExistingAspirations(aspirationsList);
      } catch (err) {
        console.error("Failed to load aspirations:", err);
      }

      try {
        const profileResponse = await getProfile();
        const profileData = profileResponse?.profile || null;
        const nextAiContext = profileResponse?.aiContext || null;
        setProfile(profileData);
        setAiContext(nextAiContext);
        if (profileData?.firstName) {
          localStorage.setItem("userName", profileData.firstName);
        }
        await loadRoleSuggestions(profileData, nextAiContext);
      } catch (profileError) {
        console.error("Failed to load profile for aspirations:", profileError);
        setRoleSuggestions([]);
        setRoleSuggestionsError("Unable to fetch role suggestions");
      }

      setLoading(false);

      if (aspirationsList.length > 0 &&!forceEditMode) {
        setScreen("existing");
      } else {
        setScreen("intro");
      }
    };

    init();
  }, [forceEditMode]);

  const headerUserName = profile?.firstName || localStorage.getItem("userName") || "Student";

  const visibleRoleSuggestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = query
     ? roleSuggestions.filter((role) => role.toLowerCase().includes(query))
      : roleSuggestions;
    return filtered.slice(0, MAX_ROLE_SUGGESTIONS);
  }, [roleSuggestions, searchTerm]);

  useEffect(() => {
    if (!form.roleMatch) return;
    const stillValid = form.roleAreas.includes(form.roleMatch);
    if (!stillValid) setForm((prev) => ({...prev, roleMatch: "" }));
  }, [form.roleAreas, form.roleMatch]);

  const updateForm = (patch) => {
    setForm((prev) => ({...prev,...patch }));
    setError("");
    setSuccessMessage("");
  };

  const toggleRoleArea = (value) => {
    setForm((prev) => {
      const next = prev.roleAreas.includes(value)
       ? prev.roleAreas.filter((r) => r!== value)
        : [...prev.roleAreas, value];
      return {
       ...prev,
        roleAreas: next,
        roleMatch: next.includes(prev.roleMatch)? prev.roleMatch : "",
      };
    });
    setError("");
    setSuccessMessage("");
  };

  const addManualRole = () => {
    const manualRole = manualRoleInput.trim();
    if (!manualRole) return;
    if (!form.roleAreas.includes(manualRole)) {
      setForm((prev) => ({...prev, roleAreas: [...prev.roleAreas, manualRole] }));
    }
    setManualRoleInput("");
    setError("");
    setSuccessMessage("");
  };

  const validate = () => {
    if (step === 1 &&!form.goal) {
      setError("Please select a goal to continue.");
      return false;
    }
    if (step === 2 &&!form.roleAreas.length) {
      setError(roleSuggestionsError? "Please enter at least one role." : "Please select at least one role.");
      return false;
    }
    if (step === 3 &&!form.roleMatch) {
      setError("Please select a role.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    setStep((s) => Math.min(s + 1, STEPS.length));
    setError("");
    setSuccessMessage("");
  };

  const handleBack = () => {
    if (step === 1) return;
    setStep((s) => s - 1);
    setError("");
    setSuccessMessage("");
  };

  const handleCancel = () => navigate("/dashboard");

  const handleViewReport = () => {
    if (existingAspirations[0]?.aiTaskId) {
      navigate(`/dashboard/aspirations/loading?taskId=${encodeURIComponent(existingAspirations[0]?.aiTaskId)}`);
      return;
    }
    navigate("/dashboard/aspirations/report");
  };

  const handleRetake = () => {
    setForm({
      goal: "",
      roleAreas: [],
      roleMatch: "",
      curriculumChoice: "",
      analysisMode: FIXED_ANALYSIS_MODE,
      numSampleJobs: String(FIXED_NUM_SAMPLE_JOBS),
    });
    setStep(1);
    setScreen("flow");
  };

  const handleViewReportFromFlow = async () => {
    if (!validate()) return;
    setSaving(true);
    setError("");
    try {
      const profileResponse = await getProfile();
      const latestProfile = profileResponse?.profile || null;
      const derivedCurriculumChoice = profileResponse?.aiContext?.curriculumChoice || form.curriculumChoice || "";
      setProfile(latestProfile);
      setAiContext(profileResponse?.aiContext || aiContext);

      const payload = {
       ...form,
        curriculumChoice: derivedCurriculumChoice,
        analysisMode: FIXED_ANALYSIS_MODE,
        numSampleJobs: FIXED_NUM_SAMPLE_JOBS,
        certifications: [],
      };

      // 1. Create aspiration - backend generates analysisId
      const createResult = await createAspirations(payload);
      const newAspiration = createResult?.aspiration || createResult;

      if (!newAspiration?.analysisId) {
        throw new Error("Backend didn't return analysisId");
      }

      // Update local state
      setExistingAspirations((prev) => {
        const current = Array.isArray(prev)? prev : [prev].filter(Boolean);
        const exists = current.some((a) => a.analysisId === newAspiration.analysisId);
        return exists? current : [newAspiration,...current];
      });

      // 2. Start AI analysis using analysisId from backend
      const analysis = await startAiAnalysis({
        analysisId: newAspiration.analysisId, // <-- analysisId added here
        job_designation: form.roleMatch,
        analysis_mode: FIXED_ANALYSIS_MODE,
        num_sample_jobs: FIXED_NUM_SAMPLE_JOBS,
      });

      if (!analysis?.task_id) {
        throw new Error("AI service didn't return task_id");
      }

      // 3. Save aiTaskId back to aspiration
      await fetch(`${API_BASE_URL}/aspirations/${newAspiration.analysisId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ aiTaskId: analysis.task_id, aiStatus: "running" }),
      });

      navigate(`/dashboard/aspirations/loading?taskId=${encodeURIComponent(analysis.task_id)}`);
      return;

    } catch (err) {
      console.error("Failed to start aspirations AI analysis:", err);
      setError("Failed to create aspirations. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading || screen === "loading") {
    return (
      <DashboardLayout title="My Aspirations" userName={headerUserName} userRole={userRole}>
        <div className="asp-loading">Loading your aspirations...</div>
      </DashboardLayout>
    );
  }

  // ── Existing Aspirations Screen ────────────────────────────────────────────
  if (screen === "existing") {
    return (
      <DashboardLayout title="My Aspirations" userName={headerUserName} userRole={userRole}>
        <ExistingReportsList
          aspirations={existingAspirations}
          onViewReport={(asp) => {
            if (asp?.aiTaskId) {
              navigate(`/dashboard/aspirations/loading?taskId=${encodeURIComponent(asp.aiTaskId)}`);
            } else {
              navigate("/dashboard/aspirations/report");
            }
          }}
          onRetake={handleRetake}
        />
      </DashboardLayout>
    );
  }

  // ── Intro screen ────────────────────────────────────────────────────────────
  if (screen === "intro") {
    return (
      <DashboardLayout title="My Aspirations" userName={headerUserName} userRole={userRole}>
        <div className="asp-intro">
          <div className="asp-intro-content">
            {existingAspirations.length > 0? (
              <>
                <ExistingAspirationsCard
                  aspirations={existingAspirations[0]}
                  onViewReport={handleViewReport}
                  onRetake={handleRetake}
                  saving={saving}
                />
                <button
                  type="button"
                  className="asp-intro-btn"
                  onClick={handleRetake}
                >
                  Start New Analysis
                </button>
              </>
            ) : (
              <>
                <img
                  src={introImg}
                  alt="Student exploring career paths"
                  className="asp-intro-image"
                />
                <p className="asp-intro-text">
                  Discover Your Strengths, Identify Your Skill Gaps, And
                  <br />
                  Get Ready For Your Dream Career.
                </p>
                <button
                  type="button"
                  className="asp-intro-btn"
                  onClick={() => setScreen("flow")}
                >
                  Let's Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Flow screen ─────────────────────────────────────────────────────────────
  const latest = existingAspirations[0];
  return (
    <div className="asp-standalone">
      <div className="asp-flow">
        {existingAspirations.length > 0 && (
          <div className="asp-previous-report-banner">
            <span>
              📋 Previous: {GOALS.find(g => g.id === latest?.goal)?.title}
              {latest?.roleMatch && ` — ${latest?.roleMatch}`}
            </span>
            <button
              type="button"
              className="asp-banner-link"
              onClick={() => setScreen("existing")}
            >
              View Report
            </button>
          </div>
        )}

        <AspHeader profile={profile} userName={headerUserName} />
        <Stepper step={step} />

        {error && <div className="asp-message asp-message--error">{error}</div>}
        {successMessage && (
          <div className="asp-message asp-message--success">{successMessage}</div>
        )}

        <div className="asp-panel">
          {step === 1 && (
            <>
              <h3 className="asp-panel-title">What's Your Goal?</h3>
              <div className="asp-goal-grid">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`asp-goal-card${form.goal === g.id? " selected" : ""}`}
                    onClick={() => updateForm({ goal: g.id })}
                  >
                    <div className="asp-goal-icon-area">
                      <img src={g.icon} alt="" className="asp-goal-icon" aria-hidden="true" />
                    </div>
                    <div className="asp-goal-body">
                      <div className="asp-goal-title">{g.title}</div>
                      <div className="asp-goal-desc">{g.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="asp-panel-title">Role Areas</h3>
              <div className="asp-search-wrap">
                <svg
                  className="asp-search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="7" cy="7" r="5.5" stroke="#9CA3AF" strokeWidth="1.5" />
                  <path
                    d="M11.5 11.5L14 14"
                    stroke="#9CA3AF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  type="text"
                  className="asp-search"
                  placeholder="Search suggested roles"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search suggested roles"
                />
              </div>

              <p className="asp-role-hint">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="7" cy="7" r="6.5" stroke="#9CA3AF" strokeWidth="1" />
                  <path d="M7 6.5V10" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="7" cy="4.5" r="0.75" fill="#9CA3AF" />
                </svg>
                Select one or more role areas to filter the suggested roles.
              </p>

              {roleSuggestionsError? (
                <div className="asp-manual-role-wrap">
                  <div className="asp-inline-inputRow">
                    <input
                      type="text"
                      className="asp-inline-textInput"
                      placeholder="Enter a role manually"
                      value={manualRoleInput}
                      onChange={(e) => setManualRoleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addManualRole();
                        }
                      }}
                    />
                    <button type="button" className="asp-inline-button" onClick={addManualRole}>
                      Add Role
                    </button>
                  </div>
                </div>
              ) : (
                <div className="asp-chip-grid">
                  {visibleRoleSuggestions.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`asp-chip${form.roleAreas.includes(role)? " selected" : ""}`}
                      onClick={() => toggleRoleArea(role)}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}

              {!roleSuggestionsLoading &&!roleSuggestionsError &&!visibleRoleSuggestions.length? (
                <p className="asp-empty-copy">No suggested roles match your search.</p>
              ) : null}

              {form.roleAreas.length? (
                <div className="asp-selected-roles">
                  <div className="asp-panel-subtitle">Selected Roles</div>
                  <div className="asp-chip-grid">
                    {form.roleAreas.map((role) => (
                      <button
                        key={`selected-${role}`}
                        type="button"
                        className="asp-chip selected"
                        onClick={() => toggleRoleArea(role)}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="asp-panel-title">Suggested Roles</h3>
              <p className="asp-panel-subtitle">
                Select a role to generate your Skill Readiness Report
              </p>
              <div className="asp-match-grid">
                {form.roleAreas.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`asp-match-card${form.roleMatch === role? " selected" : ""}`}
                    onClick={() => updateForm({ roleMatch: role })}
                  >
                    <div className="asp-match-title">{role}</div>
                    <div className="asp-match-label">Suggested Role</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="asp-footer">
          <button type="button" className="asp-btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <div className="asp-footer-right">
            <button
              type="button"
              className="asp-btn-back"
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </button>
            {step < STEPS.length? (
              <button type="button" className="asp-btn-next" onClick={handleNext}>
                Next
              </button>
            ) : (
              <button
                type="button"
                className={`asp-btn-next${!form.roleMatch? " asp-btn-next--disabled" : ""}`}
                onClick={handleViewReportFromFlow}
                disabled={saving ||!form.roleMatch}
              >
                {saving? "Saving..." : "View Report"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}