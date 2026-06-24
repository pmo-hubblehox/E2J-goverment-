import React from "react";
import { Bell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { designTokens } from "../styles/designTokens";

export default function Header({ title = "Dashboard", userName = "User", userRole = "Guest" }) {
  const navigate = useNavigate();

  const headerStyle = {
    borderBottom: `1px solid ${designTokens.borderColor}`,
  };

  return (
    <header className="dashboard-header" style={headerStyle}>
      <div className="header-title">{title}</div>

      <div className="header-right">
        <button className="header-icon" type="button" aria-label="Notifications">
          <Bell size={20} />
        </button>

        <button
          className="header-user"
          type="button"
          onClick={() => navigate("/profile")}
          aria-label="Go to profile form"
        >
          <div className="header-avatar" aria-hidden="true">
            <User size={20} />
          </div>
          <div className="header-userText">
            <div className="header-userName">{userName}</div>
            <div className="header-userRole">{userRole}</div>
          </div>
        </button>
      </div>
    </header>
  );
}
