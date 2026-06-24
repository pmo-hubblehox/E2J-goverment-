import React from "react";
import { useLocation } from "react-router-dom";

const routeTitles = {
  "/institute/home": "Home",
  "/institute/program": "Program",
  "/institute/students": "Students",
  "/institute/faculty": "Faculty",
  "/institute/venue": "Venue",
  "/institute/campus": "Campus",
  "/institute/dashboard": "Dashboard",
  "/institute/profile": "Profile",
  "/institute/reports": "Reports",
  "/institute/settings": "Settings",
};

export default function InstitutePlaceholder() {
  const location = useLocation();
  const title = routeTitles[location.pathname] || "Institute Page";

  return (
    <div className="placeholder-page">
      <h1>{title}</h1>
      <p>Under construction. Route: {location.pathname}</p>
    </div>
  );
}
