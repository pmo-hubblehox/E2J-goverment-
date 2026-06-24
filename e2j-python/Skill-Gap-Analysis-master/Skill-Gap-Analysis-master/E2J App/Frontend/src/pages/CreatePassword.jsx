import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";
import PasswordChecklist from "../components/PasswordChecklist";
import { resetPassword, createPassword } from "../services/authService";
import { validatePasswordRules } from "../utils/passwordValidation";

export default function CreatePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const searchParams = new URLSearchParams(location.search);
  const queryMode = searchParams.get("mode");
  const mode = location.state?.mode || queryMode || (location.pathname.includes("reset") ? "forgot" : "signup");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { rules, isValid } = useMemo(() => validatePasswordRules(password), [password]);

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!isValid) {
      setError("Please meet all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "forgot") {
        await resetPassword({ email, password });
        navigate("/login");
      } else {
        await createPassword({ email, password });
        navigate("/signup-success");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1>Create New Password</h1>
      <p>Set a strong password to secure your account.</p>

      {error && <div className="status-message error" role="alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <InputField
          label="Enter New Password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter a new password"
        />
        <PasswordChecklist rules={rules} />

        <InputField
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm new password"
        />

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Setting…" : "Set Password"}
        </button>
      </form>
    </AuthLayout>
  );
}
