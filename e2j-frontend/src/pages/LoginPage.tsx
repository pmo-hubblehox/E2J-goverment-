import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { AuthUser, ApiResponse } from '../types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;
interface LoginResponse { token: string; user: AuthUser; }

// ── Auth shared styles (§3 button / §4 input / §7 card) ─────────────────────
const card: React.CSSProperties = {
  width: '100%', maxWidth: '608px',
  background: '#fff', borderRadius: '10px',
  boxShadow: '4px 4px 7.5px rgba(76,78,100,0.15)',
  padding: '24px',
};
const fieldWrap: React.CSSProperties = { position: 'relative' };
const fieldInput: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box' as const,
  height: '56px', border: '1px solid #A3A3A3', borderRadius: '4px',
  padding: '0 16px', fontSize: '16px', letterSpacing: '0.32px',
  color: '#212121', outline: 'none', background: '#fff',
};
const fieldLabel: React.CSSProperties = {
  position: 'absolute' as const, top: '-9px', left: '12px',
  background: '#fff', padding: '0 4px',
  fontSize: '12px', color: '#666666', textTransform: 'capitalize' as const,
};
const errMsg: React.CSSProperties = { fontSize: '13px', color: '#E6393E', margin: '4px 0 0' };
const primaryBtn: React.CSSProperties = {
  width: '100%', height: '40px',
  background: '#3F41D1', border: 'none', borderRadius: '100px',
  color: '#fff', fontSize: '14px', fontWeight: 500,
  textTransform: 'capitalize' as const, cursor: 'pointer',
};

export default function LoginPage() {
  const { role } = useParams<{ role: string }>();
  const isInstitute      = role === 'institute';
  const isCounsellor     = role === 'counsellor';
  const isHeadCounsellor = role === 'head-counsellor';
  const isIndustry       = role === 'industry';
  const isVerifier       = role === 'verifier';
  const isBos            = role === 'bos';
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const endpoint = isInstitute      ? '/auth/institute/login'
        : isCounsellor     ? '/auth/counsellor/login'
        : isHeadCounsellor ? '/auth/counsellor/login'
        : isIndustry       ? '/auth/industry/login'
        : isVerifier       ? '/auth/verifier/login'
        : isBos            ? '/auth/bos/login'
        : '/auth/login';
      const res = await api.post<ApiResponse<LoginResponse>>(endpoint, data);
      const { token, user } = res.data.data;
      setAuth(user, token);
      if (user.role === 'BOS_MEMBER') { navigate('/bos'); return; }
      if (user.role === 'COUNSELLOR') {
        try {
          const statusRes = await api.get('/counsellor/onboarding/status');
          const { onboardingCompleted } = statusRes.data.data;
          if (onboardingCompleted) { navigate('/counsellor'); return; }
          navigate('/counsellor/onboarding');
        } catch {
          navigate('/counsellor/onboarding');
        }
        return;
      }
      if (user.role === 'HEAD_COUNSELLOR') { navigate('/head-counsellor'); return; }
      if (user.role === 'INDUSTRY_PARTNER') {
        try {
          const statusRes = await api.get('/industry-partner/onboarding/status');
          const { applicationStatus } = statusRes.data.data;
          if (applicationStatus === 'APPROVED') navigate('/industry-portal');
          else if (applicationStatus === 'SUBMITTED' || applicationStatus === 'UNDER_REVIEW') navigate('/industry-partner');
          else navigate('/industry-partner/onboarding'); // DRAFT or REJECTED → back to onboarding
        } catch {
          navigate('/industry-partner/onboarding');
        }
        return;
      }
      const map: Record<string, string> = {
        STUDENT: '/student',
        INSTITUTE: '/institute',
        VERIFIER: '/verifier',
        BOS_MEMBER: '/bos',
      };
      navigate(map[user.role] ?? '/');
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? 'Invalid email or password');
    }
  };

  const titleText = isInstitute      ? 'Institute Admin Sign In'
    : isCounsellor     ? 'Counsellor Sign In'
    : isHeadCounsellor ? 'Head Counsellor Sign In'
    : isIndustry       ? 'Industry Partner Sign In'
    : isVerifier       ? 'Verifier Sign In'
    : isBos            ? 'BOS Member Sign In'
    : 'Student Sign In';

  return (
    <div style={card}>
      {/* Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        <img src="/logo-full.png.png" alt="HubbleHox" style={{ height: '52px', objectFit: 'contain' }} />
      </div>

      {/* Title — H6: 20px / 500 / capitalize */}
      <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#212121', margin: '0 0 24px', textTransform: 'capitalize' }}>
        {titleText}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Email field */}
        <div style={fieldWrap}>
          <input
            type="email" autoComplete="email"
            placeholder="Abc123@Gmail.Com"
            className="auth-field"
            style={{ ...fieldInput, borderColor: errors.email ? '#E6393E' : '#A3A3A3' }}
            {...register('email')}
          />
          <label style={fieldLabel}>
            Enter Registered Email Id <span style={{ color: '#E6393E', marginLeft: '2px' }}>*</span>
          </label>
          {errors.email && <p style={errMsg}>{errors.email.message}</p>}
        </div>

        {/* Password field */}
        <div>
          <div style={fieldWrap}>
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••"
              className="auth-field"
              style={{ ...fieldInput, paddingRight: '44px', borderColor: errors.password ? '#E6393E' : '#A3A3A3' }}
              {...register('password')}
            />
            <label style={fieldLabel}>
              Enter Password <span style={{ color: '#E6393E', marginLeft: '2px' }}>*</span>
            </label>
            <button
              type="button" onClick={() => setShowPw(s => !s)}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A3A3A3', padding: 0, display: 'flex' }}
            >
              {showPw ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            {errors.password && <p style={errMsg}>{errors.password.message}</p>}
          </div>

          {/* Forgot password — text button §3 */}
          <div style={{ textAlign: 'right', marginTop: '8px' }}>
            <Link to="/forgot-password"
              style={{ fontSize: '14px', color: '#3F41D1', fontWeight: 500, textDecoration: 'none', textTransform: 'capitalize' }}>
              Forgot Password?
            </Link>
          </div>
        </div>

        {/* Server error */}
        {serverError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px' }}>
            <p style={{ fontSize: '13px', color: '#E6393E', margin: 0 }}>{serverError}</p>
          </div>
        )}

        {/* Primary submit button §3 */}
        <button
          type="submit" disabled={isSubmitting}
          className="auth-btn-primary"
          style={primaryBtn}
        >
          {isSubmitting ? 'Signing In…' : 'Sign In'}
        </button>

      </form>
    </div>
  );
}
