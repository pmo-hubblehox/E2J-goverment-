import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

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

const card: React.CSSProperties = { width: '100%', maxWidth: '608px', background: '#fff', borderRadius: '10px', boxShadow: '4px 4px 7.5px rgba(76,78,100,0.15)', padding: '24px' };
const fieldInput: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, height: '56px', border: '1px solid #A3A3A3', borderRadius: '4px', padding: '0 44px 0 16px', fontSize: '16px', letterSpacing: '0.32px', color: '#212121', outline: 'none', background: '#fff' };
const fieldLabel: React.CSSProperties = { position: 'absolute' as const, top: '-9px', left: '12px', background: '#fff', padding: '0 4px', fontSize: '12px', color: '#666666', textTransform: 'capitalize' as const };
const primaryBtn: React.CSSProperties = { width: '100%', height: '40px', background: '#3F41D1', border: 'none', borderRadius: '100px', color: '#fff', fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' as const, cursor: 'pointer' };

export default function CreatePasswordPage() {
  const { state } = useLocation() as { state: { email?: string; otp?: string; role?: string } };
  const role = state?.role ?? 'student';
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const checks = {
    len:     pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    num:     /[0-9]/.test(pw),
    special: /[@?!/,.\-_#$%&*]/.test(pw),
  };
  const allValid = Object.values(checks).every(Boolean) && pw === pw2 && pw2.length > 0;

  const handleSubmit = async () => {
    if (!allValid) return;
    setLoading(true); setError('');
    try {
      const res = await api.post(`/auth/${role}/register/set-password`, {
        email: state?.email, otp: state?.otp, password: pw,
      });
      const data = res.data?.data;
      const dest = role === 'institute' ? '/institute/onboarding'
                 : role === 'counsellor' ? '/counsellor/onboarding'
                 : role === 'industry' ? '/industry-partner/onboarding'
                 : '/login/student';
      if (data?.token && data?.user) setAuth(data.user, data.token);
      navigate(dest, { replace: true });
      return;
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to set password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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

        {/* Title */}
        <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#212121', textAlign: 'center', margin: '0 0 8px', textTransform: 'capitalize' }}>
          Create New Password
        </h2>
        <p style={{ fontSize: '14px', color: '#666666', textAlign: 'center', margin: '0 0 24px' }}>
          Enter New Password
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* New password */}
          <div style={{ position: 'relative' }}>
            <input type={show1 ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)}
              placeholder="••••••••" className="auth-field" style={fieldInput} />
            <label style={fieldLabel}>Enter New Password</label>
            <button type="button" onClick={() => setShow1(s => !s)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A3A3A3', padding: 0, display: 'flex' }}>
              {show1 ? <Eye size={17} /> : <EyeOff size={17} />}
            </button>
          </div>

          {/* Confirm password */}
          <div style={{ position: 'relative' }}>
            <input type={show2 ? 'text' : 'password'} value={pw2} onChange={e => setPw2(e.target.value)}
              placeholder="••••••••" className="auth-field"
              style={{ ...fieldInput, borderColor: pw2 && pw !== pw2 ? '#E6393E' : '#A3A3A3' }} />
            <label style={fieldLabel}>Confirm New Password</label>
            <button type="button" onClick={() => setShow2(s => !s)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A3A3A3', padding: 0, display: 'flex' }}>
              {show2 ? <Eye size={17} /> : <EyeOff size={17} />}
            </button>
          </div>

          {/* Password criteria — §5 validation checklist */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
            <CriteriaRow ok={checks.len}     label="Min 8 Chars" />
            <CriteriaRow ok={checks.num}     label="One Number" />
            <CriteriaRow ok={checks.upper}   label="One Uppercase" />
            <CriteriaRow ok={checks.special} label="One Special Char" />
          </div>

          {error && <p style={{ fontSize: '13px', color: '#E6393E', margin: 0 }}>{error}</p>}

          {/* Primary button §3 */}
          <button onClick={handleSubmit} disabled={!allValid || loading}
            className="auth-btn-primary" style={primaryBtn}>
            {loading ? 'Setting Password…' : 'Set Password'}
          </button>
        </div>
      </div>
    </>
  );
}
