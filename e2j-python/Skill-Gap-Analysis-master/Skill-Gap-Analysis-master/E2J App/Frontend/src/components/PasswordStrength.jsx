import React from "react";

export default function PasswordStrength({ rules }) {
  const ruleMap = [
    { key: "length", label: "At least 8 characters" },
    { key: "uppercase", label: "At least one uppercase letter" },
    { key: "number", label: "At least one number" },
    { key: "specialChar", label: "At least one special character" },
  ];

  return (
    <div className="password-rules">
      {ruleMap.map(({ key, label }) => {
        const pass = !!rules[key];
        return (
          <div key={key} className={`password-rule ${pass ? "pass" : "fail"}`}>
            <span>{pass ? "✓" : "○"}</span>
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
