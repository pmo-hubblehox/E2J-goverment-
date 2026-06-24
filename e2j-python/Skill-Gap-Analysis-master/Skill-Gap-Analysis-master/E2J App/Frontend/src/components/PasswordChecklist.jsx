import React from "react";

export default function PasswordChecklist({ rules }) {
  const items = [
    { key: "length", label: "Min 8 Chars" },
    { key: "uppercase", label: "One Uppercase" },
    { key: "number", label: "One Number" },
    { key: "specialChar", label: "One Special Character" },
  ];

  return (
    <div className="password-checklist">
      {items.map(({ key, label }) => {
        const pass = !!rules[key];
        return (
          <div key={key} className={`check-item ${pass ? "pass" : "fail"}`}>
            <span>{pass ? "✓" : "○"}</span>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
