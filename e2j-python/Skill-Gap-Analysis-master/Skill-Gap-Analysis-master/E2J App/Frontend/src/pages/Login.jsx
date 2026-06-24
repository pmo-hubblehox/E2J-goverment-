import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";
import { login } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const data = await login({ email: email.trim(), password });
      const token = data.token;
      if (!token) {
        throw new Error("No token returned from server");
      }
      localStorage.setItem("token", token);
      localStorage.setItem("userEmail", email.trim());
      localStorage.setItem("userName", data.name || "Student");
      localStorage.setItem("userRole", "Student");
      console.log("Stored token:", token);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1>Student Sign In</h1>
      <p>Enter your registered email and password to continue.</p>

      {error && <div className="status-message error" role="alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <InputField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
        />
        <div className="small-link" style={{ textAlign: "right" }}>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="small-link">
        Don’t have an account? <Link to="/signup">Register</Link>
      </div>
    </AuthLayout>
  );
}
