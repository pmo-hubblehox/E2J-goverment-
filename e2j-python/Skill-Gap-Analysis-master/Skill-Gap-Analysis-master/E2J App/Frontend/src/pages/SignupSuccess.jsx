import React from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

export default function SignupSuccess() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <h1>Thank You For Signing Up!</h1>
      <p>Your account has been created successfully.</p>
      <button className="button" onClick={() => navigate("/login")}>OK</button>
    </AuthLayout>
  );
}
