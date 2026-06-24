import { useState } from 'react';
import { X, Eye, EyeOff, HelpCircle } from 'lucide-react';
import api from '../services/api';

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [cur, setCur] = useState('');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState({ cur: false, pw1: false, pw2: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handle = async () => {
    if (!cur || !pw1 || !pw2) { setError('All fields are required.'); return; }
    if (pw1 !== pw2) { setError('New passwords do not match.'); return; }
    if (pw1.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/user/change-password', { currentPassword: cur, newPassword: pw1 });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Current password is incorrect.');
    } finally { setLoading(false); }
  };

  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, height: '44px', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0 40px 0 14px', fontSize: '14px', outline: 'none', background: '#fff', color: '#1E293B' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '420px', boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Change Password</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px', display: 'flex' }}><X size={20} /></button>
        </div>
        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#DCFCE7', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M7 14l4 4 10-10" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#15803D', margin: '0 0 4px' }}>Password Updated!</p>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 20px' }}>Your password has been changed successfully.</p>
            <button onClick={onClose} style={{ padding: '10px 28px', background: '#3F41D1', border: 'none', borderRadius: '20px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Done</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Current Password', val: cur, set: setCur, key: 'cur' as const },
              { label: 'New Password', val: pw1, set: setPw1, key: 'pw1' as const },
              { label: 'Confirm New Password', val: pw2, set: setPw2, key: 'pw2' as const },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>{f.label}</label>
                <div style={{ position: 'relative' }}>
                  <input type={show[f.key] ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)} style={{ ...inp, borderColor: error && !f.val ? '#EF4444' : '#E2E8F0' }} />
                  <button type="button" onClick={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, display: 'flex' }}>
                    {show[f.key] ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
            ))}
            {error && <p style={{ fontSize: '13px', color: '#EF4444', margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button onClick={onClose} style={{ padding: '10px 20px', border: '1px solid #E2E8F0', borderRadius: '20px', background: '#fff', fontSize: '14px', cursor: 'pointer', color: '#1E293B' }}>Cancel</button>
              <button onClick={handle} disabled={loading} style={{ padding: '10px 24px', border: 'none', borderRadius: '20px', background: '#3F41D1', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Saving…' : 'Update Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function HelpCenterModal({ onClose }: { onClose: () => void }) {
  const FAQS = [
    { q: 'How do I add a new program?', a: 'Go to Programs → Program Listing and click "+ Add Program". Fill in the required details and click Upload.' },
    { q: 'How does AI curriculum generation work?', a: 'Open a program from the Curriculum page, click "Generate AI Curriculum". The AI will suggest a curriculum based on the program and major. You can then send it for BOS approval.' },
    { q: 'How do I reset my password?', a: 'Click "Change Password" from the profile menu in the top-right corner. You will need to enter your current password and then set a new one.' },
    { q: 'How do I add faculty members?', a: 'Go to Faculty Management and click "+ Add Faculty". Fill in name, expertise, availability, and delivery mode, then click Submit.' },
    { q: 'How do I send a campus drive invite?', a: 'Go to Campus Recruitment and click "Send Invite". Select an industry partner and fill in the drive details.' },
    { q: 'How do I export data?', a: 'On any listing page (Programs, Students, Faculty, etc.), click the Export or Download button in the toolbar to download a CSV file.' },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '520px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={20} color="#4F46E5" />
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Help Center</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px', display: 'flex' }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 20px' }}>Frequently asked questions to help you get started.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', margin: '0 0 6px' }}>{faq.q}</p>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', marginTop: '20px' }}>For further support, contact us at support@hubblehox.com</p>
      </div>
    </div>
  );
}
