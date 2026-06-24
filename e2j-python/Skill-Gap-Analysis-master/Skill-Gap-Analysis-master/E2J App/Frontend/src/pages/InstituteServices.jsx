import React from "react";
import AuthLayout from "../components/AuthLayout";
import Stepper from "../components/Stepper";

export default function InstituteServices() {
  const steps = ["Institute Information", "Services", "Payments"];

  return (
    <AuthLayout>
      <Stepper steps={steps} activeStep={1} />
      <h1>Services</h1>
      <p>Coming Soon</p>
    </AuthLayout>
  );
}
