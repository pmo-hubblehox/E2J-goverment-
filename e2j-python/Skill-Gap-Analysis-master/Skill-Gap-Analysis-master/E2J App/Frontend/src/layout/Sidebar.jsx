import React, { useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { designTokens } from "../styles/designTokens";

import homeIcon from "../assets/icons/navigation-home.svg";
import homeSelectedIcon from "../assets/icons/navigation-home-selected.svg";
import dashboardIcon from "../assets/icons/navigation-dashboard.svg";
import dashboardSelectedIcon from "../assets/icons/navigation-dashboard-selected.svg";
import aspirationIcon from "../assets/icons/navigation-my aspiration.svg";
import aspirationSelectedIcon from "../assets/icons/navigation-my aspiration-selected.svg";
import coursesIcon from "../assets/icons/navigation-courses.svg";
import coursesSelectedIcon from "../assets/icons/navigation-courses-selected.svg";
import jobsIcon from "../assets/icons/navigation-job listing.svg";
import jobsSelectedIcon from "../assets/icons/navigation-job listing-selected.svg";
import counsellingIcon from "../assets/icons/navigation-counselling.svg";
import counsellingSelectedIcon from "../assets/icons/navigation-counselling-selected.svg";
import profileIcon from "../assets/icons/navigation-profile.svg";
import logoutIcon from "../assets/icons/action-logout.svg";
import logoThumbnailIcon from "../assets/icons/logo-thumbnail.svg";

const navItems = [
  { key: "home", label: "Home", icon: homeIcon, iconSelected: homeSelectedIcon, to: "/dashboard", end: true },
  { key: "dashboard", label: "Dashboard", icon: dashboardIcon, iconSelected: dashboardSelectedIcon, to: null },
  { key: "aspirations", label: "My Aspirations", icon: aspirationIcon, iconSelected: aspirationSelectedIcon, to: "/dashboard/aspirations" },
  { key: "jobs", label: "Job Listing", icon: jobsIcon, iconSelected: jobsSelectedIcon, to: null },
  { key: "counselling", label: "Counselling", icon: counsellingIcon, iconSelected: counsellingSelectedIcon, to: null },
  { key: "profile", label: "Profile", icon: profileIcon, iconSelected: profileIcon, to: "/profile" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const routeSelectedKey = useMemo(() => {
    const { pathname } = location;
    if (pathname === "/dashboard") return "home";
    if (pathname.startsWith("/dashboard/aspirations")) return "aspirations";
    if (pathname.startsWith("/courses") || pathname.startsWith("/dashboard/courses")) return "courses";
    if (pathname === "/profile") return "profile";
    return null;
  }, [location]);

  const selectedKey = routeSelectedKey;

  const sidebarStyle = {
    background: designTokens.sidebarBackground,
    borderRight: `1px solid ${designTokens.borderColor}`,
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className="dashboard-sidebar" style={sidebarStyle} aria-label="Application sidebar">
      <div className="sidebar-logo">
        <img src={logoThumbnailIcon} alt="E2J logo" className="sidebar-logo__thumb" />
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          if (item.to) {
            return (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.end}
                className="sidebar-item"
              >
                <>
                  <div className="sidebar-icon-wrapper" aria-hidden="true">
                    <img src={selectedKey === item.key ? item.iconSelected : item.icon} alt="" />
                  </div>
                  <span className="sidebar-label">{item.label}</span>
                </>
              </NavLink>
            );
          }

          return (
            <a
              key={item.key}
              href="#"
              className="sidebar-item"
              onClick={(e) => e.preventDefault()}
              aria-disabled="true"
            >
              <div className="sidebar-icon-wrapper" aria-hidden="true">
                <img src={item.icon} alt="" />
              </div>
              <span className="sidebar-label">{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <a
          href="#"
          className="sidebar-item"
          onClick={(e) => e.preventDefault()}
          aria-disabled="true"
        >
          <div className="sidebar-icon-wrapper" aria-hidden="true">
            <img src={dashboardIcon} alt="" />
          </div>
          <span className="sidebar-label">Setting</span>
        </a>

        <button className="sidebar-item sidebar-logout" type="button" onClick={handleLogout}>
          <div className="sidebar-icon-wrapper" aria-hidden="true">
            <img src={logoutIcon} alt="" />
          </div>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
