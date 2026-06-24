import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InstituteSidebar from "../components/InstituteSidebar";
import InstituteHeader from "../components/InstituteHeader";
import FeatureCard from "../components/FeatureCard";
import "../styles/InstituteHome.css";

export default function InstituteHome() {
  const INSTITUTE_COMPLETED_KEY = "instituteProfileCompleted";
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: "" });
  const [loading, setLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("instituteToken");
        if (!token) {
          navigate("/login/institute");
          return;
        }
        const response = await axios.get("http://localhost:5000/api/institute/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // If backend can provide completion state, use it.
        const backendProfile = response.data || { name: "" };
        setProfile(backendProfile);

        // Determine completion state: backend first, local fallback
        const completedFromBackend = backendProfile.profileCompleted === true;
        const completedFromLocal = localStorage.getItem(INSTITUTE_COMPLETED_KEY) === "true";
        const completed = completedFromBackend || completedFromLocal;
        setProfileCompleted(completed);

        if (completed) {
          localStorage.setItem(INSTITUTE_COMPLETED_KEY, "true");
        }
      } catch (error) {
        console.error(error);
        const savedName = localStorage.getItem("userName") || "";
        setProfile({ name: savedName });
        
        // Still check for completion flag even if profile fetch fails
        const completed = localStorage.getItem(INSTITUTE_COMPLETED_KEY) === "true";
        setProfileCompleted(completed);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="institute-loading">Loading...</div>;

  const userName = profile?.name || localStorage.getItem("userName") || "";

  return (
    <div className="institute-home-page">
      <InstituteSidebar />

      <div className="institute-main-area">
        <InstituteHeader userName={userName} />

        <div className="institute-home-content">
          <div className="institute-left-content">
            <h1 className="main-heading">Hey {userName || ""},</h1>
            <p className="subtext">
              {profileCompleted
                ? "Your institute profile is complete! You can now access all services."
                : "Please fill out the institute profile to get started. Once completed, you'll be able to enjoy all the services!"}
            </p>

            {!profileCompleted && (
              <button
                className="profile-cta"
                onClick={() => navigate("/institute/onboarding")}
              >
                Complete Institute Profile
              </button>
            )}

            {profileCompleted && (
              <button
                className="profile-cta"
                onClick={() => navigate("/institute/profile")}
              >
                Edit Institute Profile
              </button>
            )}

            <img
              src="/assets/institute-home-illustration.png"
              alt="Institute Illustration"
              className="main-illustration"
            />
          </div>

          <FeatureCard />
        </div>
      </div>
    </div>
  );
}