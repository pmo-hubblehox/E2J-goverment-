import { useEffect, useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const PINK = '#E91E8C';
const BORDER = '#E2E8F0';
const TEXT = '#1E293B';
const SUB = '#64748B';

interface Workshop {
  id: number; posterName: string; trainerName: string; title: string; description: string;
  targetRoles: string[]; mode: string; sessionDate: string; sessionEndDate: string; sessionTime: string;
  city: string; state: string; venueAddress: string; venueMapUrl: string | null; meetingLink: string;
  feeAmount: number; totalSeats: number; seatsConfirmed: number;
  status: string; rating: number | null; prerequisite: string | null;
}

interface Enrollment {
  id: number; workshopId: number; workshopTitle: string; mode: string;
  sessionDate: string; sessionEndDate: string; sessionTime: string; meetingLink: string; venueAddress: string; venueMapUrl: string | null;
  status: string; waitlistPosition: number | null; feeAmount: number; createdAt: string;
}

function EnrollModal({ workshop, onClose, onDone }: { workshop: Workshop; onClose: () => void; onDone: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true); setError('');
    try {
      await api.post(`/student/workshops/${workshop.id}/enroll`, {});
      onDone();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to enroll. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: TEXT }}>Order Summary</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB }}><X size={20} /></button>
        </div>

        <div style={{ background: '#F8FAFC', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: SUB }}>Workshop</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT, textAlign: 'right' }}>{workshop.title}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: SUB }}>Date</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{workshop.sessionDate}{workshop.sessionEndDate && workshop.sessionEndDate !== workshop.sessionDate ? ` – ${workshop.sessionEndDate}` : ''}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: SUB }}>Time</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{workshop.sessionTime}</span>
          </div>
          {workshop.mode === 'IN_PERSON' && workshop.venueMapUrl && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: SUB }}>Location</span>
              <a href={workshop.venueMapUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY }}>View on map</a>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: SUB }}>Mode</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{workshop.mode === 'ONLINE' ? 'Online' : `${workshop.city}, ${workshop.state}`}</span>
          </div>
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>Total</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: PRIMARY }}>
              {workshop.feeAmount ? `₹${workshop.feeAmount.toLocaleString()}` : 'Free'}
            </span>
          </div>
        </div>

        {workshop.prerequisite && (
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9A3412', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '4px' }}>Prerequisite</div>
            <div style={{ fontSize: '13px', color: '#7C2D12', lineHeight: 1.5 }}>{workshop.prerequisite}</div>
          </div>
        )}

        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '12px', color: '#92400E' }}>
          This is a demo payment. Click "Pay Now" to confirm your enrollment.
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#DC2626', fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.7 : 1 }}>
          {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : 'Pay Now'}
        </button>
      </div>
    </div>
  );
}

const REVIEW_QUESTIONS = [
  { key: 'trainerClarity',    label: 'The trainer explained concepts clearly', inPersonOnly: false },
  { key: 'trainerEngagement', label: 'The trainer effectively answered questions and engaged participants', inPersonOnly: false },
  { key: 'venueComfort',      label: 'The venue was comfortable and well-organized', inPersonOnly: true },
  { key: 'venueAccessibility', label: 'The venue was easy to find and accessible', inPersonOnly: true },
  { key: 'venueFacilities',   label: 'The venue had all necessary facilities (seating, AV equipment, etc.)', inPersonOnly: true },
  { key: 'wouldRecommend',    label: 'Would you recommend this workshop to others?', inPersonOnly: false },
] as const;
const REVIEW_LIKERT_OPTS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

function ReviewModal({ enrollment, onClose, onDone }: { enrollment: Enrollment; onClose: () => void; onDone: () => void }) {
  const [trainerRating, setTrainerRating] = useState(0);
  const [venueRating, setVenueRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isInPerson = enrollment.mode === 'IN_PERSON';
  const questions = REVIEW_QUESTIONS.filter(q => !q.inPersonOnly || isInPerson);

  const Stars = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={22} onClick={() => onChange(n)} fill={n <= value ? '#F5A623' : 'none'} color={n <= value ? '#F5A623' : BORDER} style={{ cursor: 'pointer' }} />
      ))}
    </div>
  );

  const handleSubmit = async () => {
    if (!overallRating || !trainerRating || (isInPerson && !venueRating)) { setError('Please rate all categories.'); return; }
    if (questions.some(q => !answers[q.key])) { setError('Please answer all the feedback questions.'); return; }
    setSubmitting(true); setError('');
    try {
      await api.post(`/student/workshop-enrollments/${enrollment.id}/review`, {
        trainerRating, venueRating: isInPerson ? venueRating : null, overallRating, comment, answers,
      });
      onDone();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to submit review.');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: TEXT }}>Rate: {enrollment.workshopTitle}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB }}><X size={20} /></button>
        </div>
        {error && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '6px' }}>Trainer</label>
            <Stars value={trainerRating} onChange={setTrainerRating} />
          </div>
          {isInPerson && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '6px' }}>Venue</label>
              <Stars value={venueRating} onChange={setVenueRating} />
            </div>
          )}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '6px' }}>Overall</label>
            <Stars value={overallRating} onChange={setOverallRating} />
          </div>
          {questions.map(q => (
            <div key={q.key}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '6px' }}>{q.label}</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {REVIEW_LIKERT_OPTS.map(opt => (
                  <button key={opt} type="button" onClick={() => setAnswers(a => ({ ...a, [q.key]: opt }))}
                    style={{ padding: '5px 11px', borderRadius: '8px', border: `1.5px solid ${answers[q.key] === opt ? PRIMARY : BORDER}`, background: answers[q.key] === opt ? '#EEF2FF' : '#fff', color: answers[q.key] === opt ? PRIMARY : SUB, fontSize: '11px', fontWeight: answers[q.key] === opt ? 700 : 500, cursor: 'pointer' }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '6px' }}>Comments</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ flex: 1, padding: '11px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkshopsPage() {
  const [tab, setTab] = useState<'browse' | 'bookings'>('browse');
  const [scope, setScope] = useState<'all' | 'recommended'>('all');
  const [modeFilter, setModeFilter] = useState<'' | 'ONLINE' | 'IN_PERSON'>('');
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollTarget, setEnrollTarget] = useState<Workshop | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Enrollment | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const loadWorkshops = () => {
    setLoading(true);
    Promise.all([
      api.get('/student/workshops', { params: { ...(modeFilter ? { mode: modeFilter } : {}), scope } }).then(res => res.data?.data ?? []).catch(() => []),
      api.get('/student/workshop-enrollments').then(res => res.data?.data ?? []).catch(() => []),
    ]).then(([w, e]) => { setWorkshops(w); setEnrollments(e); })
      .finally(() => setLoading(false));
  };

  const loadEnrollments = () => {
    setLoading(true);
    api.get('/student/workshop-enrollments')
      .then(res => setEnrollments(res.data?.data ?? []))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'browse') loadWorkshops(); else loadEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, modeFilter, scope]);

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try { await api.post(`/student/workshop-enrollments/${id}/cancel`); loadEnrollments(); }
    catch { /* ignore */ } finally { setCancellingId(null); }
  };

  return (
    <div style={{ padding: '32px' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: TEXT }}>Workshops</h2>
      <p style={{ margin: '0 0 20px', fontSize: '13px', color: SUB }}>Workshops matching your career aspiration.</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['browse', 'bookings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '9px 20px', borderRadius: '100px', border: `1px solid ${tab === t ? PRIMARY : BORDER}`, background: tab === t ? PRIMARY : '#fff', color: tab === t ? '#fff' : TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            {t === 'browse' ? 'Browse' : 'My Bookings'}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {(['all', 'recommended'] as const).map(s => (
              <button key={s} onClick={() => setScope(s)}
                style={{ padding: '9px 20px', borderRadius: '100px', border: `1px solid ${scope === s ? PRIMARY : BORDER}`, background: scope === s ? PRIMARY : '#fff', color: scope === s ? '#fff' : TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {s === 'all' ? 'All' : 'Recommended'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {([['', 'All Modes'], ['ONLINE', 'Online'], ['IN_PERSON', 'In-person']] as const).map(([v, label]) => (
              <span key={v} onClick={() => setModeFilter(v)}
                style={{ padding: '7px 14px', borderRadius: '100px', border: `1px solid ${modeFilter === v ? PRIMARY : BORDER}`, background: modeFilter === v ? '#EEF2FF' : '#fff', color: modeFilter === v ? PRIMARY : SUB, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                {label}
              </span>
            ))}
          </div>

          {loading ? (
            <p style={{ fontSize: '13px', color: SUB }}>Loading…</p>
          ) : workshops.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '40px', textAlign: 'center', color: SUB, fontSize: '13px' }}>
              {scope === 'recommended' ? 'No workshops match your aspiration right now.' : 'No workshops available right now.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {workshops.map(w => {
                const existing = enrollments.find(e => e.workshopId === w.id && e.status !== 'CANCELLED');
                return (
                  <div key={w.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{w.title}</div>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '100px', background: w.mode === 'ONLINE' ? '#EEF2FF' : '#FEF3C7', color: w.mode === 'ONLINE' ? PRIMARY : '#92400E' }}>
                        {w.mode === 'ONLINE' ? 'Online' : 'In-person'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: SUB, marginBottom: '10px' }}>{w.posterName}{w.trainerName ? ` · ${w.trainerName}` : ''}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px', fontSize: '12px', color: SUB, marginBottom: '12px' }}>
                      <span>{w.mode === 'ONLINE' ? 'Online' : w.city}</span>
                      <span>{w.sessionDate}{w.sessionEndDate && w.sessionEndDate !== w.sessionDate ? ` – ${w.sessionEndDate}` : ''} {w.sessionTime}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: `1px solid ${BORDER}` }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>{w.feeAmount ? `₹${w.feeAmount}` : 'Free'}</div>
                        {w.rating != null && <div style={{ fontSize: '11px', color: SUB }}>★ {w.rating}</div>}
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: w.seatsConfirmed >= w.totalSeats ? '#B45309' : '#16A34A' }}>
                        {Math.max(w.totalSeats - w.seatsConfirmed, 0)} seats left
                      </div>
                    </div>
                    {existing ? (
                      <div style={{ width: '100%', marginTop: '12px', padding: '9px', borderRadius: '100px', textAlign: 'center', fontSize: '13px', fontWeight: 600,
                        background: existing.status === 'CONFIRMED' ? '#DCFCE7' : '#FEF3C7',
                        color: existing.status === 'CONFIRMED' ? '#15803D' : '#92400E' }}>
                        {existing.status === 'CONFIRMED' ? '✓ Already Enrolled' : `Waitlisted #${existing.waitlistPosition}`}
                      </div>
                    ) : (
                      <button onClick={() => setEnrollTarget(w)}
                        style={{ width: '100%', marginTop: '12px', padding: '9px', borderRadius: '100px', border: 'none', background: PINK, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        Enroll
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'bookings' && (
        loading ? (
          <p style={{ fontSize: '13px', color: SUB }}>Loading…</p>
        ) : enrollments.length === 0 ? (
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '40px', textAlign: 'center', color: SUB, fontSize: '13px' }}>
            No workshop bookings yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {enrollments.map(e => (
              <div key={e.id} style={{ background: '#fff', border: `1.5px solid ${e.status === 'CONFIRMED' ? '#86EFAC' : e.status === 'WAITLISTED' ? '#FCD34D' : BORDER}`, borderRadius: '12px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{e.workshopTitle}</div>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px',
                    background: e.status === 'CONFIRMED' ? '#DCFCE7' : e.status === 'WAITLISTED' ? '#FEF3C7' : '#FEE2E2',
                    color: e.status === 'CONFIRMED' ? '#15803D' : e.status === 'WAITLISTED' ? '#92400E' : '#B91C1C' }}>
                    {e.status === 'CONFIRMED' ? 'Confirmed' : e.status === 'WAITLISTED' ? `Waitlisted #${e.waitlistPosition}` : 'Cancelled'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: SUB, marginBottom: '10px' }}>{e.sessionDate}{e.sessionEndDate && e.sessionEndDate !== e.sessionDate ? ` – ${e.sessionEndDate}` : ''} {e.sessionTime}</div>
                {e.status === 'CONFIRMED' && (
                  <div style={{ fontSize: '12px', color: TEXT, marginBottom: '10px' }}>
                    {e.mode === 'ONLINE'
                      ? <>🔗 {e.meetingLink}</>
                      : <>📍 {e.venueAddress}{e.venueMapUrl && <> · <a href={e.venueMapUrl} target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY }}>View on map</a></>}</>}
                  </div>
                )}
                {e.status !== 'CANCELLED' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleCancel(e.id)} disabled={cancellingId === e.id}
                      style={{ padding: '7px 16px', borderRadius: '100px', border: '1px solid #FCA5A5', background: '#fff', color: '#B91C1C', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                      {cancellingId === e.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                    {e.status === 'CONFIRMED' && (
                      <button onClick={() => setReviewTarget(e)}
                        style={{ padding: '7px 16px', borderRadius: '100px', border: `1px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        Rate Workshop
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {enrollTarget && (
        <EnrollModal workshop={enrollTarget} onClose={() => setEnrollTarget(null)}
          onDone={() => { setEnrollTarget(null); loadWorkshops(); }} />
      )}
      {reviewTarget && (
        <ReviewModal enrollment={reviewTarget} onClose={() => setReviewTarget(null)}
          onDone={() => { setReviewTarget(null); loadEnrollments(); }} />
      )}
    </div>
  );
}
