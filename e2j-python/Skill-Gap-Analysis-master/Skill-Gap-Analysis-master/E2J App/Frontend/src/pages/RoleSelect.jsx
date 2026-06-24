import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

export default function RoleSelect() {
  const navigate = useNavigate();

  const cards = [
    { title: "Student", subtitle: "Access student features", path: "/login" },
    { title: "Institute", subtitle: "Access institute portal", path: "/login/institute" },
  ];

  return (
    <div className="auth-layout role-select-layout">
      <main className="right-panel role-select-panel">
        <div className="auth-card role-select-card">
          <h1 className="auth-title">Select Your Role</h1>
          <p className="auth-subtitle">Choose how you want to access the system</p>

          <div className="role-card-grid">
            {cards.map((card) => (
              <button
                key={card.title}
                className="role-card"
                onClick={() => navigate(card.path)}
                type="button"
              >
                <h3>{card.title}</h3>
                <p>{card.subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}