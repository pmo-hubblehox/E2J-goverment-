import React from "react";

const cards = [
  { key: "program", label: "Program Management", icon: "/assets/icons/program.svg" },
  { key: "student", label: "Student Management", icon: "/assets/icons/students.svg" },
  { key: "faculty", label: "Faculty Management", icon: "/assets/icons/faculty.svg" },
  { key: "venue", label: "Venue Management", icon: "/assets/icons/venue.svg" },
];

export default function FeatureCard() {
  return (
    <aside className="feature-card-panel">
      <div className="feature-card-background">
        {cards.map((club) => (
          <div key={club.key} className="feature-row">
            <div className="feature-icon-circle">
              <img src={club.icon} alt={club.label} className="feature-icon" />
            </div>
            <span className="feature-label">{club.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
