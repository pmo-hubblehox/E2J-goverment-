import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import api from '../../services/api';

const card: React.CSSProperties = { width: '100%', maxWidth: '608px', background: '#fff', borderRadius: '10px', boxShadow: '4px 4px 7.5px rgba(76,78,100,0.15)', padding: '24px' };
const primaryBtn: React.CSSProperties = { width: '100%', height: '40px', background: '#3F41D1', border: 'none', borderRadius: '100px', color: '#fff', fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' as const, cursor: 'pointer' };

export default function OtpPage() {
  const { state } = useLocation() as { state: { email?: string; role?: string; demoOtp?: string } };
  const email = state?.email ?? '';
  const role = state?.role ?? 'student';
  const navigate = useNavigate();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useState(59);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string>(state?.demoOtp ?? '');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handleValidate = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter all 6 digits'); return; }
    setLoading(true); setError('');
    try {
      await api.post(`/auth/${role}/register/verify-otp`, { email, otp: code });
      navigate('/register/create-password', { state: { email, otp: code, role } });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setSeconds(59); setOtp(['', '', '', '', '', '']); setError('');
    try {
      const res = await api.post(`/auth/${role}/register/otp`, { email });
      setDemoOtp(res.data?.data ?? '');
    } catch { /* ignore */ }
    inputRefs.current[0]?.focus();
  };

  const filled = otp.filter(Boolean).length;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div style={card}>
      {/* Back */}
      <button onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#666666', display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <ChevronLeft size={22} />
      </button>

      {/* Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        <img src="/logo-full.png.png" alt="HubbleHox" style={{ height: '52px', objectFit: 'contain' }} />
      </div>
      <p style={{ textAlign: 'center', fontSize: '13px', fontStyle: 'italic', color: '#64748B', margin: '0 0 20px', lineHeight: '1.6' }}>
        "The future of work is changing, and education must change with it" — Bill Gates
      </p>

      {/* Title */}
      <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#212121', textAlign: 'center', margin: '0 0 8px', textTransform: 'capitalize' }}>
        Verify Your Email Address
      </h2>
      <p style={{ fontSize: '14px', color: '#666666', textAlign: 'center', margin: '0 0 4px' }}>
        Enter 6 Digit Code Sent On
      </p>
      <p style={{ fontSize: '14px', color: '#212121', fontWeight: 500, textAlign: 'center', margin: '0 0 24px' }}>
        {email}
      </p>

      {/* Demo OTP banner */}
      {demoOtp && (
        <div style={{ background: '#FFF7ED', border: '1px dashed #FB923C', borderRadius: '10px', padding: '10px 16px', marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#9A3412', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Demo Mode — OTP
          </p>
          <p style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#EA580C', letterSpacing: '6px' }}>
            {demoOtp}
          </p>
        </div>
      )}

      {/* OTP boxes — 56px height, 4px radius, standard border */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '12px' }}>
        {otp.map((d, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className="auth-field"
            style={{
              width: '56px', height: '56px',
              border: `1px solid ${d ? '#3F41D1' : '#A3A3A3'}`,
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '20px', fontWeight: 600,
              color: '#212121', outline: 'none', background: '#fff',
            }}
          />
        ))}
      </div>

      {/* Timer + count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '0 2px' }}>
        <span style={{ fontSize: '13px', color: '#22C55E', fontWeight: 500 }}>
          {seconds > 0 ? `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}` : ''}
        </span>
        <span style={{ fontSize: '13px', color: '#A3A3A3' }}>{filled}/6</span>
      </div>

      {error && <p style={{ fontSize: '13px', color: '#E6393E', textAlign: 'center', marginBottom: '12px' }}>{error}</p>}

      {/* Resend — text button §3 */}
      <p style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button onClick={resend} disabled={seconds > 0} className="auth-btn-text"
          style={{ color: seconds > 0 ? '#A3A3A3' : '#3F41D1' }}>
          Resend OTP
        </button>
      </p>

      {/* Validate — primary button §3 */}
      <button onClick={handleValidate} disabled={loading || filled < 6}
        className="auth-btn-primary" style={primaryBtn}>
        {loading ? 'Validating…' : 'Validate OTP'}
      </button>
    </div>
  );
}
