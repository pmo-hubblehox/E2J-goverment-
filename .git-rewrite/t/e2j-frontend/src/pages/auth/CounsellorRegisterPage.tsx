import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

const card: React.CSSProperties = { width: '100%', maxWidth: '608px', background: '#fff', borderRadius: '10px', boxShadow: '4px 4px 7.5px rgba(76,78,100,0.15)', padding: '24px' };
const fieldInput: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, height: '56px', border: '1px solid #A3A3A3', borderRadius: '4px', padding: '0 16px', fontSize: '16px', letterSpacing: '0.32px', color: '#212121', outline: 'none', background: '#fff' };
const fieldLabel: React.CSSProperties = { position: 'absolute' as const, top: '-9px', left: '12px', background: '#fff', padding: '0 4px', fontSize: '12px', color: '#666666', textTransform: 'capitalize' as const };
const primaryBtn: React.CSSProperties = { width: '100%', height: '40px', background: '#3F41D1', border: 'none', borderRadius: '100px', color: '#fff', fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' as const, cursor: 'pointer' };

export default function CounsellorRegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email }: FormData) => {
    setServerError('');
    try {
      const res = await api.post('/auth/counsellor/register/otp', { email });
      navigate('/register/otp', { state: { email, role: 'counsellor', demoOtp: res.data?.data } });
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? 'Failed to send OTP. Try again.');
    }
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        <img src="/logo-full.png.png" alt="HubbleHox" style={{ height: '52px', objectFit: 'contain' }} />
      </div>
      <p style={{ textAlign: 'center', fontSize: '13px', fontStyle: 'italic', color: '#64748B', margin: '0 0 20px', lineHeight: '1.6' }}>
        "The future of work is changing, and education must change with it" — Bill Gates
      </p>
      <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#212121', margin: '0 0 24px', textTransform: 'capitalize' }}>
        Counsellor Registration
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <input type="email" autoComplete="email" placeholder="manisha.joshi@gmail.com"
            className="auth-field"
            style={{ ...fieldInput, borderColor: errors.email ? '#E6393E' : '#A3A3A3' }}
            {...register('email')} />
          <label style={fieldLabel}>
            Enter Registered Email Id <span style={{ color: '#E6393E', marginLeft: '2px' }}>*</span>
          </label>
          {errors.email && <p style={{ fontSize: '13px', color: '#E6393E', margin: '4px 0 0' }}>{errors.email.message}</p>}
        </div>

        {serverError && <p style={{ fontSize: '13px', color: '#E6393E', margin: 0 }}>{serverError}</p>}

        <button type="submit" disabled={isSubmitting} className="auth-btn-primary" style={primaryBtn}>
          {isSubmitting ? 'Sending OTP…' : 'Generate OTP'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#666666', margin: 0 }}>
          Already Have An Account?{' '}
          <Link to="/login/counsellor" style={{ color: '#3F41D1', fontWeight: 500, textDecoration: 'none', textTransform: 'capitalize' }}>Sign In</Link>
        </p>
      </form>
    </div>
  );
}
