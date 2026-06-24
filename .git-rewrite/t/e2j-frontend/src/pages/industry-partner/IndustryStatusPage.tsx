import { useState, useEffect } from 'react';
import { Check, Clock, Search, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const TEXT    = '#212121';
const SUB     = '#666666';

const TIMELINE = [
  { key: 'SUBMITTED',    label: 'Application Submitted', desc: 'Your application has been received and logged.' },
  { key: 'UNDER_REVIEW', label: 'Under Review',          desc: 'Our team is reviewing your application.' },
  { key: 'APPROVED',     label: 'Approved',              desc: 'Your application has been approved.' },
];

const STATUS_ORDER: Record<string, number> = {
  DRAFT: -1, SUBMITTED: 0, UNDER_REVIEW: 1, APPROVED: 2, REJECTED: 2,
};

function StepIcon({ state }: { state: 'done' | 'active' | 'pending' }) {
  if (state === 'done')   return <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={18} color="#fff" /></div>;
  if (state === 'active') return <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Clock size={18} color="#fff" /></div>;
  return <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Search size={16} color="#A3A3A3" /></div>;
}

export default function IndustryStatusPage() {
  const [status, setStatus]     = useState<string>('');
  const [submittedAt, setSubmittedAt] = useState<string>('');
  const [rejection, setRejection]    = useState<string>('');
  const [loading, setLoading]        = useState(true);

  useEffect(() => {
    api.get('/industry-partner/application/status')
      .then(res => {
        const d = res.data?.data;
        setStatus(d?.applicationStatus ?? '');
        setSubmittedAt(d?.submittedAt ?? '');
        setRejection(d?.rejectionReason ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentIdx = STATUS_ORDER[status] ?? -1;
  const isRejected = status === 'REJECTED';

  const banner = () => {
    if (status === 'DRAFT')        return { bg: '#F5F5F5', border: '#E2E8F0', icon: AlertCircle, color: '#666666', text: 'Your application is saved as draft. Complete all sections and submit for approval.' };
    if (status === 'SUBMITTED')    return { bg: '#DBEAFE', border: '#93C5FD', icon: Clock, color: '#1D4ED8', text: 'Your application has been submitted and is awaiting review.' };
    if (status === 'UNDER_REVIEW') return { bg: '#FEF3C7', border: '#FCD34D', icon: Clock, color: '#92400E', text: 'Our team is reviewing your application. This typically takes 2–3 business days.' };
    if (status === 'APPROVED')     return { bg: '#DCFCE7', border: '#86EFAC', icon: Check, color: '#15803D', text: 'Congratulations! Your application has been approved. You now have full platform access.' };
    if (status === 'REJECTED')     return { bg: '#FEE2E2', border: '#FCA5A5', icon: AlertCircle, color: '#B91C1C', text: rejection || 'Your application was rejected. Please contact support for details.' };
    return null;
  };

  const info = banner();

  return (
    <div style={{ padding: '32px', maxWidth: '680px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: TEXT, margin: '0 0 4px', textTransform: 'capitalize' }}>Application Status</h2>
      <p style={{ fontSize: '13px', color: SUB, margin: '0 0 28px' }}>
        Track the progress of your industry partner onboarding application.
        {submittedAt && <> Submitted on <strong>{new Date(submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>.</>}
      </p>

      {loading ? (
        <p style={{ color: SUB }}>Loading…</p>
      ) : (
        <>
          {/* Timeline */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px 28px', marginBottom: '20px' }}>
            {TIMELINE.map((item, i) => {
              const order = STATUS_ORDER[item.key] ?? 0;
              const state: 'done' | 'active' | 'pending' =
                isRejected && i === TIMELINE.length - 1 ? 'pending'
                : order < currentIdx ? 'done'
                : order === currentIdx ? 'active'
                : 'pending';
              const isLast = i === TIMELINE.length - 1;
              return (
                <div key={item.key} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <StepIcon state={state} />
                    {!isLast && <div style={{ width: '2px', flex: 1, background: order < currentIdx ? '#16A34A' : '#E2E8F0', margin: '6px 0' }} />}
                  </div>
                  <div style={{ paddingBottom: isLast ? 0 : '24px' }}>
                    <p style={{ margin: '6px 0 2px', fontSize: '14px', fontWeight: 600, color: state === 'pending' ? '#A3A3A3' : TEXT }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: SUB }}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status banner */}
          {info && (() => {
            const Icon = info.icon;
            return (
              <div style={{ background: info.bg, border: `1px solid ${info.border}`, borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Icon size={16} color={info.color} style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ margin: 0, fontSize: '13px', color: info.color, lineHeight: 1.6 }}>
                  <strong style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ').toLowerCase()}</strong> — {info.text}
                </p>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
