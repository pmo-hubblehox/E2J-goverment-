import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const QUOTE = {
  text: 'The future of work is changing, and education must change with it.',
  author: 'Bill Gates',
  role: 'Co-founder, Microsoft',
};

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    const map: Record<string, string> = {
      STUDENT: '/student',
      INSTITUTE: '/institute',
      VERIFIER: '/verifier',
      COUNSELLOR: '/counsellor',
      HEAD_COUNSELLOR: '/head-counsellor',
      INDUSTRY_PARTNER: '/industry-partner',
      BOS_MEMBER: '/bos',
    };
    return <Navigate to={map[user.role] ?? '/login/student'} replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Left — background photo with gradient scrim */}
      <div
        style={{
          flex: '0 0 50%',
          position: 'relative',
          backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '48px',
        }}
        className="hidden lg:flex"
      >
        {/* Standard gradient overlay (§1 --overlay-image) */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '420px' }}>
          {/* H4 quote text: 34px / 400 / capitalize */}
          <p style={{
            color: '#fff', fontSize: '34px', fontWeight: 400,
            lineHeight: 1.2, textTransform: 'capitalize',
          }}>
            "{QUOTE.text}"
          </p>
          {/* H5 author: 24px / 400 / capitalize */}
          <p style={{
            color: '#fff', fontWeight: 400, marginTop: '16px',
            fontSize: '24px', textTransform: 'capitalize',
          }}>
            {QUOTE.author}
          </p>
          {/* Caption role: 12px / capitalize */}
          <p style={{
            color: 'rgba(255,255,255,0.7)', fontSize: '12px',
            marginTop: '4px', textTransform: 'capitalize',
          }}>
            {QUOTE.role}
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div style={{
        flex: 1,
        background: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        minHeight: '100vh',
      }}>
        <Outlet />
      </div>
    </div>
  );
}
