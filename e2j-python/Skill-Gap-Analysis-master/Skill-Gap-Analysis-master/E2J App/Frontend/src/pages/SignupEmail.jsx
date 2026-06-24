import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";
import { sendOtp } from "../services/authService";

export default function SignupEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendOtp({ email: email.trim(), flow: "signup" });
      navigate(`/verify-otp?mode=signup`, { state: { email: email.trim(), mode: "signup" } });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1>Student Registration</h1>
      <p>Enter your registered email ID to get started.</p>
      {error && <div className="status-message error" role="alert">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="Enter Registered Email ID"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Generating…" : "Generate OTP"}
        </button>
      </form>

      <div className="small-link">
        Already Have An Account? <Link to="/login">Sign In</Link>
      </div>
    </AuthLayout>
  );
}
