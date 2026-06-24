import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const navItems = [
  { key: "home", label: "Home", path: "/institute/home", icon: "/assets/icons/home.svg" },
  { key: "program", label: "Program", path: "/institute/program", icon: "/assets/icons/program.svg" },
  { key: "students", label: "Students", path: "/institute/students", icon: "/assets/icons/students.svg" },
  { key: "faculty", label: "Faculty", path: "/institute/faculty", icon: "/assets/icons/faculty.svg" },
  { key: "venue", label: "Venue", path: "/institute/venue", icon: "/assets/icons/venue.svg" },
  { key: "campus", label: "Campus", path: "/institute/campus", icon: "/assets/icons/campus.svg" },
  { key: "dashboard", label: "Dashboard", path: "/institute/dashboard", icon: "/assets/icons/dashboard.svg" },
  { key: "profile", label: "Profile", path: "/institute/profile", icon: "/assets/icons/profile.svg" },
  { key: "reports", label: "Reports", path: "/institute/reports", icon: "/assets/icons/reports.svg" },
  { key: "settings", label: "Settings", path: "/institute/settings", icon: "/assets/icons/settings.svg" },
];

export default function InstituteSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("instituteToken");
    navigate("/role-select");
  };

  return (
    <aside className="institute-sidebar">
      <div className="sidebar-logo-container">
        <img src="/assets/logo.svg" alt="Logo" className="sidebar-logo" />
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? "active" : ""}`
            }
          >
            <span className="item-icon-wrapper">
              <img src={item.icon} alt={item.label} className="item-icon" />
            </span>
            <span className="item-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <button className="sidebar-item logout" onClick={handleLogout}>
        <span className="item-icon-wrapper">
          <img src="/assets/icons/logout.svg" alt="Logout" className="item-icon" />
        </span>
        <span className="item-label">Logout</span>
      </button>
    </aside>
  );
}