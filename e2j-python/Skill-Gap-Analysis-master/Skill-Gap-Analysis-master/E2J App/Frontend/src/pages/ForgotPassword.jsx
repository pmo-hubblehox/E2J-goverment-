import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";
import { sendOtp } from "../services/authService";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await sendOtp({ email: email.trim(), flow: "forgot" });
      navigate(`/verify-otp?mode=forgot`, { state: { email: email.trim(), mode: "forgot" } });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1>Forgot Password</h1>
      <p>Enter your email to receive a password reset OTP.</p>

      {error && <div className="status-message error" role="alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <InputField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Sending OTP…" : "Send OTP"}
        </button>
      </form>

      <div className="small-link">
        Remembered your password? <Link to="/login">Sign In</Link>
      </div>
    </AuthLayout>
  );
}
