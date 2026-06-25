import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

const card: React.CSSProperties = { width: '100%', maxWidth: '608px', background: '#fff', borderRadius: '10px', boxShadow: '4px 4px 7.5px rgba(76,78,100,0.15)', padding: '24px' };
const fieldInput: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, height: '56px', border: '1px solid #A3A3A3', borderRadius: '4px', padding: '0 16px', fontSize: '16px', color: '#212121', outline: 'none', background: '#fff' };
const fieldLabel: React.CSSProperties = { position: 'absolute' as const, top: '-9px', left: '12px', background: '#fff', padding: '0 4px', fontSize: '12px', color: '#666666', textTransform: 'capitalize' as const };
const primaryBtn: React.CSSProperties = { width: '100%', height: '40px', background: '#3F41D1', border: 'none', borderRadius: '100px', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' };
const errMsg: React.CSSProperties = { fontSize: '13px', color: '#E6393E', margin: '4px 0 0' };

function CriteriaRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: ok ? '#16A34A' : '#A3A3A3' }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="7" fill={ok ? '#16A34A' : '#E2E8F0'} />
        <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </div>
  );
}

type Step = 'email' | 'otp' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useState(59);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const checks = {
    len: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    num: /[0-9]/.test(pw),
    special: /[@?!/,.\-_#$%&*]/.test(pw),
  };
  const allPwValid = Object.values(checks).every(Boolean) && pw === pw2 && pw2.length > 0;

  useEffect(() => {
    if (step !== 'otp' || seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, seconds]);

  useEffect(() => {
    if (step === 'otp') setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [step]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const otpFilled = otp.filter(Boolean).length;
  const otpCode = otp.join('');

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };
  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  // Step 1 — send OTP
  const handleSendOtp = async () => {
    if (!email.trim()) { setError('Enter your registered email.'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/forgot-password/otp', { email });
      setDemoOtp(res.data?.data ?? '');
      setSeconds(59);
      setStep('otp');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No account found with this email.');
    } finally { setLoading(false); }
  };

  // Step 2 — verify OTP
  const handleVerifyOtp = async () => {
    if (otpFilled < 6) { setError('Enter all 6 digits.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password/verify-otp', { email, otp: otpCode });
      setStep('reset');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Invalid OTP. Try again.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setOtp(['', '', '', '', '', '']); setError('');
    try {
      const res = await api.post('/auth/forgot-password/otp', { email });
      setDemoOtp(res.data?.data ?? '');
      setSeconds(59);
    } catch { /* ignore */ }
  };

  // Step 3 — reset password
  const handleReset = async () => {
    if (!allPwValid) return;
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password/reset', { email, otp: otpCode, password: pw });
      setStep('done');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to reset password.');
    } finally { setLoading(false); }
  };

  const logo = (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        <img src="/logo-full.png.png" alt="HubbleHox" style={{ height: '52px', objectFit: 'contain' }} />
      </div>
    </>
  );

  const backBtn = (
    <button onClick={() => step === 'email' ? navigate(-1) : setStep(step === 'otp' ? 'email' : 'otp')}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#666666', display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
      <ChevronLeft size={22} />
    </button>
  );

  if (step === 'done') return (
    <div style={card}>
      {logo}
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCFCE7', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M8 16l5 5 11-11" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#15803D', margin: '0 0 8px' }}>Password Reset!</h2>
        <p style={{ fontSize: '14px', color: '#666', margin: '0 0 24px' }}>Your password has been updated. You can now sign in.</p>
        <button onClick={() => navigate(-1)} style={primaryBtn}>Back To Sign In</button>
      </div>
    </div>
  );

  if (step === 'reset') return (
    <div style={card}>
      {backBtn}{logo}
      <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#212121', textAlign: 'center', margin: '0 0 8px' }}>Create New Password</h2>
      <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', margin: '0 0 24px' }}>Enter your new password below</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ position: 'relative' }}>
          <input type={show1 ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)}
            placeholder="••••••••" className="auth-field"
            style={{ ...fieldInput, paddingRight: '44px' }} />
          <label style={fieldLabel}>New Password</label>
          <button type="button" onClick={() => setShow1(s => !s)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A3A3A3', padding: 0, display: 'flex' }}>
            {show1 ? <Eye size={17} /> : <EyeOff size={17} />}
          </button>
        </div>
        <div style={{ position: 'relative' }}>
          <input type={show2 ? 'text' : 'password'} value={pw2} onChange={e => setPw2(e.target.value)}
            placeholder="••••••••" className="auth-field"
            style={{ ...fieldInput, paddingRight: '44px', borderColor: pw2 && pw !== pw2 ? '#E6393E' : '#A3A3A3' }} />
          <label style={fieldLabel}>Confirm New Password</label>
          <button type="button" onClick={() => setShow2(s => !s)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A3A3A3', padding: 0, display: 'flex' }}>
            {show2 ? <Eye size={17} /> : <EyeOff size={17} />}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
          <CriteriaRow ok={checks.len}     label="Min 8 Chars" />
          <CriteriaRow ok={checks.num}     label="One Number" />
          <CriteriaRow ok={checks.upper}   label="One Uppercase" />
          <CriteriaRow ok={checks.special} label="One Special Char" />
        </div>
        {error && <p style={errMsg}>{error}</p>}
        <button onClick={handleReset} disabled={!allPwValid || loading} style={primaryBtn}>
          {loading ? 'Saving…' : 'Reset Password'}
        </button>
      </div>
    </div>
  );

  if (step === 'otp') return (
    <div style={card}>
      {backBtn}{logo}
      <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#212121', textAlign: 'center', margin: '0 0 8px' }}>Verify Your Email</h2>
      <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', margin: '0 0 4px' }}>Enter 6-digit code sent to</p>
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#212121', textAlign: 'center', margin: '0 0 20px' }}>{email}</p>

      {demoOtp && (
        <div style={{ background: '#FFF7ED', border: '1px dashed #FB923C', borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#9A3412', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Demo Mode — OTP</p>
          <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#EA580C', letterSpacing: '6px' }}>{demoOtp}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '12px' }}>
        {otp.map((d, i) => (
          <input key={i} ref={el => { inputRefs.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKey(i, e)}
            className="auth-field"
            style={{ width: '56px', height: '56px', border: `1px solid ${d ? '#3F41D1' : '#A3A3A3'}`, borderRadius: '4px', textAlign: 'center', fontSize: '20px', fontWeight: 600, color: '#212121', outline: 'none', background: '#fff' }} />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '0 2px' }}>
        <span style={{ fontSize: '13px', color: '#22C55E', fontWeight: 500 }}>
          {seconds > 0 ? `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}` : ''}
        </span>
        <span style={{ fontSize: '13px', color: '#A3A3A3' }}>{otpFilled}/6</span>
      </div>

      {error && <p style={{ ...errMsg, textAlign: 'center', marginBottom: '12px' }}>{error}</p>}

      <p style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={handleResend} disabled={seconds > 0} className="auth-btn-text"
          style={{ color: seconds > 0 ? '#A3A3A3' : '#3F41D1', background: 'none', border: 'none', cursor: seconds > 0 ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
          Resend OTP
        </button>
      </p>

      <button onClick={handleVerifyOtp} disabled={loading || otpFilled < 6} className="auth-btn-primary" style={primaryBtn}>
        {loading ? 'Verifying…' : 'Verify OTP'}
      </button>
    </div>
  );

  // Step 1 — email
  return (
    <div style={card}>
      {backBtn}{logo}
      <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#212121', margin: '0 0 8px', textAlign: 'center', textTransform: 'capitalize' }}>Forgot Password?</h2>
      <p style={{ fontSize: '14px', color: '#666666', textAlign: 'center', margin: '0 0 24px' }}>
        Enter your registered email and we'll send a reset OTP
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            placeholder="Enter your email address" className="auth-field"
            style={{ ...fieldInput, borderColor: error ? '#E6393E' : '#A3A3A3' }}
            onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
          />
          <label style={fieldLabel}>Email Address <span style={{ color: '#E6393E' }}>*</span></label>
          {error && <p style={errMsg}>{error}</p>}
        </div>
        <button onClick={handleSendOtp} disabled={loading} className="auth-btn-primary" style={primaryBtn}>
          {loading ? 'Sending…' : 'Send Reset OTP'}
        </button>
      </div>
      <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: '24px' }}>
        <button onClick={() => navigate(-1)} className="auth-btn-text" style={{ color: '#3F41D1', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back To Sign In
        </button>
      </p>
    </div>
  );
}
