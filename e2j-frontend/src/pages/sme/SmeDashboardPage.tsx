import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const PRIMARY = '#3F41D1';
const TEXT    = '#1E293B';
const SUB     = '#64748B';
const BORDER  = '#E2E8F0';
const BG      = '#F8FAFC';

interface Workshop {
  id: number;
  posterName: string;
  title: string;
  description: string;
  mode: string;
  sessionDate: string;
  sessionTime: string;
  durationMinutes: number | null;
  city: string;
  venueAddress: string;
  meetingLink: string;
  totalSeats: number;
  seatsConfirmed: number;
  status: string;
  rating: number | null;
}

interface RosterRow { studentName: string; studentEmail: string; status: string; }
interface Review { id: number; studentName: string; trainerRating: number; venueRating: number | null; overallRating: number; comment: string; createdAt: string; }

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Pending Approval', color: '#92400E', bg: '#FEF3C7' },
  APPROVED: { label: 'Live',             color: '#15803D', bg: '#DCFCE7' },
  REJECTED: { label: 'Rejected',         color: '#B91C1C', bg: '#FEE2E2' },
};

export default function SmeDashboardPage() {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Workshop | null>(null);
  const [tab, setTab] = useState<'roster' | 'feedback'>('roster');
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    api.get('/sme/workshops')
      .then(res => setWorkshops(res.data?.data ?? []))
      .catch(() => setWorkshops([]))
      .finally(() => setLoading(false));
  }, []);

  const openWorkshop = (w: Workshop) => {
    setSelected(w); setTab('roster'); setLoadingDetail(true);
    Promise.all([
      api.get(`/sme/workshops/${w.id}/roster`).then(r => r.data?.data ?? []).catch(() => []),
      api.get(`/sme/workshops/${w.id}/reviews`).then(r => r.data?.data ?? []).catch(() => []),
    ]).then(([r, rv]) => { setRoster(r); setReviews(rv); }).finally(() => setLoadingDetail(false));
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>E</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: TEXT }}>SME Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: SUB }}>{user?.name}</span>
          <button onClick={() => { clearAuth(); navigate('/'); }} style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', color: TEXT }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>
        {selected ? (
          <div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: PRIMARY, fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
              ← Back to my trainings
            </button>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: TEXT }}>{selected.title}</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: SUB }}>
              {selected.posterName} · {selected.mode === 'ONLINE' ? 'Online' : selected.city} · {selected.sessionDate} {selected.sessionTime}{selected.durationMinutes ? ` (${selected.durationMinutes} min)` : ''}
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button onClick={() => setTab('roster')}
                style={{ padding: '8px 18px', borderRadius: '100px', border: `1px solid ${tab === 'roster' ? PRIMARY : BORDER}`, background: tab === 'roster' ? PRIMARY : '#fff', color: tab === 'roster' ? '#fff' : TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Roster ({roster.length})
              </button>
              <button onClick={() => setTab('feedback')}
                style={{ padding: '8px 18px', borderRadius: '100px', border: `1px solid ${tab === 'feedback' ? PRIMARY : BORDER}`, background: tab === 'feedback' ? PRIMARY : '#fff', color: tab === 'feedback' ? '#fff' : TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Feedback ({reviews.length})
              </button>
            </div>

            {loadingDetail ? (
              <p style={{ fontSize: '13px', color: SUB }}>Loading…</p>
            ) : tab === 'roster' ? (
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
                {roster.length === 0 ? (
                  <p style={{ padding: '24px', fontSize: '13px', color: SUB, textAlign: 'center' }}>No students enrolled yet.</p>
                ) : roster.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < roster.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{r.studentName}</div>
                      <div style={{ fontSize: '12px', color: SUB }}>{r.studentEmail}</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: r.status === 'CONFIRMED' ? '#DCFCE7' : '#FEF3C7', color: r.status === 'CONFIRMED' ? '#15803D' : '#92400E' }}>
                      {r.status === 'CONFIRMED' ? 'Confirmed' : 'Waitlisted'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.length === 0 ? (
                  <p style={{ fontSize: '13px', color: SUB, textAlign: 'center', padding: '24px' }}>No feedback yet.</p>
                ) : reviews.map(r => (
                  <div key={r.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{r.studentName}</span>
                      <span style={{ fontSize: '12px', color: SUB }}>Trainer: {r.trainerRating}/5{r.venueRating != null ? ` · Venue: ${r.venueRating}/5` : ''} · Overall: {r.overallRating}/5</span>
                    </div>
                    {r.comment && <p style={{ margin: 0, fontSize: '13px', color: TEXT, lineHeight: 1.6 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: TEXT }}>My Trainings</h2>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: SUB }}>Workshops assigned to you as trainer.</p>

            {loading ? (
              <p style={{ fontSize: '13px', color: SUB }}>Loading…</p>
            ) : workshops.length === 0 ? (
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '32px', textAlign: 'center', color: SUB, fontSize: '13px' }}>
                No trainings assigned yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {workshops.map(w => {
                  const st = STATUS_STYLE[w.status] ?? STATUS_STYLE.PENDING;
                  return (
                    <div key={w.id} onClick={() => openWorkshop(w)}
                      style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px 20px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{w.title}</div>
                          <div style={{ fontSize: '12px', color: SUB, marginTop: '2px' }}>{w.posterName}</div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: SUB }}>
                        <span>{w.mode === 'ONLINE' ? 'Online' : w.city}</span>
                        <span>{w.sessionDate} {w.sessionTime}{w.durationMinutes ? ` · ${w.durationMinutes} min` : ''}</span>
                        <span>{w.seatsConfirmed}/{w.totalSeats} seats filled</span>
                        {w.rating != null && <span>★ {w.rating}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
