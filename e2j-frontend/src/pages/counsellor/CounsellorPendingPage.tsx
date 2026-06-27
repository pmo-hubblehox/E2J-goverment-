import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, LogOut, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function CounsellorPendingPage() {
  const { clearAuth } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { rejected?: boolean; reason?: string } | null };

  const isRejected = state?.rejected === true;
  const reason = state?.reason ?? '';

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
      <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', padding: '56px 48px', maxWidth: '540px', width: '100%', textAlign: 'center' }}>

        {isRejected ? (
          <>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <XCircle size={38} color="#DC2626" strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', margin: '0 0 12px' }}>Profile Rejected</h1>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.7, margin: '0 0 24px' }}>
              Your profile was reviewed and requires corrections before approval.
            </p>
            {reason && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '16px 18px', marginBottom: '28px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertTriangle size={15} color="#DC2626" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#DC2626' }}>Reason for Rejection</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#7F1D1D', lineHeight: 1.7 }}>{reason}</p>
              </div>
            )}
            <button
              onClick={() => navigate('/counsellor/onboarding')}
              style={{ width: '100%', padding: '13px', background: '#4338CA', border: 'none', borderRadius: '24px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '12px' }}>
              Fix & Resubmit Profile
            </button>
          </>
        ) : (
          <>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Clock size={38} color="#CA8A04" strokeWidth={1.8} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1E293B', margin: '0 0 12px' }}>Profile Under Review</h1>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.7, margin: '0 0 32px' }}>
              Your profile has been submitted successfully and is currently being reviewed by the Head of Counsellors.
              You will be notified once your account is approved. This typically takes 1–2 business days.
            </p>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '14px 18px', marginBottom: '32px', textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#15803D', fontWeight: 500 }}>What happens next?</p>
              <ul style={{ margin: '8px 0 0', padding: '0 0 0 18px', fontSize: '13px', color: '#374151', lineHeight: 1.8 }}>
                <li>Head of Counsellors reviews your submitted profile</li>
                <li>If approved, you'll gain full access to the platform</li>
                <li>If any details need correction, you'll be notified</li>
              </ul>
            </div>
          </>
        )}

        <button
          onClick={() => { clearAuth(); navigate('/'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto', background: 'none', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '10px 28px', fontSize: '14px', color: '#64748B', cursor: 'pointer' }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
      <p style={{ marginTop: '24px', fontSize: '12px', color: '#94A3B8' }}>© 2024, Powered By <span style={{ color: '#4338CA', fontWeight: 600 }}>HubbleHox</span></p>
    </div>
  );
}
