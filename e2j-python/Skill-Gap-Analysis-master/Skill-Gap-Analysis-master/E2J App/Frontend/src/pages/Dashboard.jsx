import React, { useEffect, useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const userName = localStorage.getItem("userName") || "Student";
  const userRole = localStorage.getItem("userRole") || "Student";
  const navigate = useNavigate();
  const [profileCompleted, setProfileCompleted] = useState(
    localStorage.getItem("profileCompleted") === "true"
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/profile/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(({ profile }) => {
        if (profile?.profileCompleted) {
          localStorage.setItem("profileCompleted", "true");
          setProfileCompleted(true);
          if (profile.firstName) {
            const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
            localStorage.setItem("userName", fullName);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <DashboardLayout title="Home" userName={userName} userRole={userRole}>
      <div className="dashboard-welcome">
        <h2>Welcome Back, {userName}!</h2>
        <p className="dashboard-intro">Your personalized dashboard will appear here.</p>
        {!profileCompleted && (
          <div style={{
            marginTop: 24,
            padding: "20px 24px",
            background: "rgba(91, 92, 226, 0.06)",
            border: "1px solid rgba(91, 92, 226, 0.2)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "#1F2937" }}>Complete Your Profile</p>
              <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: "0.9rem" }}>Fill in your profile to unlock personalized job recommendations and opportunities.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              style={{
                background: "#5B5CE2",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.9rem",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              Fill Profile →
            </button>
          </div>
        )}
        <div className="dashboard-widgets" />
      </div>
    </DashboardLayout>
  );
}
