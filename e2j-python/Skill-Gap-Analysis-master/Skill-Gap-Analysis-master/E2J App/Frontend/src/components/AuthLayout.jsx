import React from "react";
import "../styles/auth.css";
import companyLogo from "../assets/icons/logo-thumbnail.svg";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <aside className="left-panel" aria-label="Inspirational quote">
        <div className="left-content">
          <blockquote>
            "The Key For Us, Number One, Has Always Been Hiring Very Smart People."
          </blockquote>
          <cite>
            <strong>Bill Gates<br />Co-Founder Of Microsoft Corporation</strong>
          </cite>
        </div>
      </aside>

      <main className="right-panel">
        <div className="auth-card">
          <div className="card-logo">
            <img src={companyLogo} alt="HubbleHox logo" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
