import React from "react";
import AuthLayout from "../components/AuthLayout";
import Stepper from "../components/Stepper";

export default function InstitutePayments() {
  const steps = ["Institute Information", "Services", "Payments"];

  return (
    <AuthLayout>
      <Stepper steps={steps} activeStep={2} />
      <h1>Payments</h1>
      <p>Coming Soon</p>
    </AuthLayout>
  );
}
