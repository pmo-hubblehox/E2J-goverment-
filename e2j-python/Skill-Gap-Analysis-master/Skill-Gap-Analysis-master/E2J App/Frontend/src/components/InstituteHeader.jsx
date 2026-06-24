import React from "react";

export default function InstituteHeader({ userName = "" }) {
  return (
    <header className="institute-header">
      <div className="header-right">
        <button className="icon-button" aria-label="Notifications">
          <img src="/assets/icons/notification.svg" alt="Notifications" className="header-icon" />
        </button>
        <div className="user-profile">
          <div className="user-avatar">{userName ? userName.slice(0, 2).toUpperCase() : ""}</div>
          <div className="user-details">
            <div className="user-name">Hi, {userName || ""}</div>
            <div className="user-role">CIO</div>
          </div>
        </div>
      </div>
    </header>
  );
}
