import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import OTPInput from "../components/OTPInput";
import { sendOtp, verifyOtp } from "../services/authService";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const searchParams = new URLSearchParams(location.search);
  const queryMode = searchParams.get("mode");
  const mode = location.state?.mode || queryMode || "signup";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer <= 0) return undefined;

    const id = window.setInterval(() => {
      setTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(id);
  }, [timer]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    if (otp.length !== 6) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({ email, otp });
      navigate(mode === "forgot" ? "/reset-password?mode=forgot" : "/create-password?mode=signup", { state: { email, mode } });
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setError("");
    setStatus("");
    setLoading(true);

    try {
      await sendOtp({ email, flow: mode === "forgot" ? "forgot" : "signup" });
      setStatus("OTP resent to your email.");
      setTimer(60);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [timer]);

  return (
    <AuthLayout>
      <h1>{mode === "forgot" ? "Verify OTP" : "Verify Your Email Address"}</h1>
      <p>
        Enter the 6 digit code sent to
        <br />
        <strong>{email}</strong>
      </p>

      {error && <div className="status-message error" role="alert">{error}</div>}
      {status && <div className="status-message success" role="status">{status}</div>}

      <form onSubmit={handleSubmit}>
        <OTPInput value={otp} onChange={setOtp} disabled={loading} />

        <div className="otp-footer">
          <div aria-live="polite" aria-atomic="true">Resend code in {formattedTime}</div>
          <button type="button" onClick={handleResend} disabled={timer > 0 || loading}>
            Resend OTP
          </button>
        </div>

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Validating…" : "Validate OTP"}
        </button>
      </form>
    </AuthLayout>
  );
}
