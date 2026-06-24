import React from "react";
import "../styles/InstituteRegister.css";

export default function Stepper({ steps, activeStep = 0 }) {
  return (
    <div className="stepper-container">
      {steps.map((label, index) => (
        <div key={label} className="stepper-item">
          <div
            className={`stepper-dot ${index === activeStep ? "active" : index < activeStep ? "completed" : ""}`}
          >
            {index + 1}
          </div>
          <div className="stepper-label">{label}</div>
          {index < steps.length - 1 && <div className="stepper-connector" />}
        </div>
      ))}
    </div>
  );
}
