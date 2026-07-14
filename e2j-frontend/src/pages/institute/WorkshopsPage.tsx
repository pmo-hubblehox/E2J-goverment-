import { useEffect, useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import api from '../../services/api';
import { ROLE_AREAS, ROLE_GROUPS } from '../../constants/roleAreas';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';

const PRIMARY = '#3F41D1';
const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:     { label: 'Pending Approval', color: '#92400E', bg: '#FEF3C7' },
  APPROVED:    { label: 'Live',             color: '#15803D', bg: '#DCFCE7' },
  REJECTED:    { label: 'Rejected',         color: '#B91C1C', bg: '#FEE2E2' },
  UNPUBLISHED: { label: 'Unpublished',      color: SUB,        bg: '#F1F5F9' },
};

const REVIEW_QUESTION_LABELS: Record<string, string> = {
  trainerClarity: 'Explained concepts clearly',
  trainerEngagement: 'Effectively answered questions & engaged participants',
  venueComfort: 'Venue was comfortable and well-organized',
  venueAccessibility: 'Venue was easy to find and accessible',
  venueFacilities: 'Venue had all necessary facilities',
  wouldRecommend: 'Would recommend this workshop',
};

interface Trainer { id: number; name: string; email: string; }
interface Workshop {
  id: number; title: string; description: string; targetRoles: string[]; mode: string;
  sessionDate: string; sessionEndDate: string; sessionTime: string; city: string; state: string; venueAddress: string; venueMapUrl: string | null;
  feeAmount: number; totalSeats: number; seatsConfirmed: number;
  status: string; rejectionReason: string; rating: number | null; trainerName: string; posterName: string;
  prerequisite: string | null; facultyId: number | null;
}
interface RosterStudent { id: number; name: string; studentId: string; degree: string; yearOfPassing: string; }
interface EnrollmentRow {
  id: number; studentName: string; studentEmail: string; status: string;
  waitlistPosition: number | null; formAnswer: string; enrolledVia: string; createdAt: string;
}
interface Review {
  id: number; studentName: string; trainerRating: number; venueRating: number | null; overallRating: number;
  comment: string; answers: Record<string, string> | null; createdAt: string;
}

function EnrollmentsModal({ workshop, onClose }: { workshop: Workshop; onClose: () => void }) {
  const [rows, setRows] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/institute/workshops/${workshop.id}/enrollments`)
      .then(res => setRows(res.data?.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [workshop.id]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${BORDER}` }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: TEXT }}>Enrollments — {workshop.title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB }}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
          {loading ? (
            <p style={{ fontSize: '13px', color: SUB, textAlign: 'center', padding: '24px 0' }}>Loading…</p>
          ) : rows.length === 0 ? (
            <p style={{ fontSize: '13px', color: SUB, textAlign: 'center', padding: '24px 0' }}>No students enrolled yet.</p>
          ) : rows.map(r => (
            <div key={r.id} style={{ padding: '12px 0', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{r.studentName}</div>
                  <div style={{ fontSize: '12px', color: SUB }}>{r.studentEmail}</div>
                  <div style={{ fontSize: '11px', color: SUB, marginTop: '2px' }}>{r.enrolledVia}</div>
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: r.status === 'CONFIRMED' ? '#DCFCE7' : '#FEF3C7', color: r.status === 'CONFIRMED' ? '#15803D' : '#92400E' }}>
                  {r.status === 'CONFIRMED' ? 'Confirmed' : `Waitlisted #${r.waitlistPosition}`}
                </span>
              </div>
              {r.formAnswer && <p style={{ margin: '6px 0 0', fontSize: '12px', color: TEXT, lineHeight: 1.5 }}>{r.formAnswer}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewsModal({ workshop, onClose }: { workshop: Workshop; onClose: () => void }) {
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/institute/workshops/${workshop.id}/reviews`)
      .then(res => setRows(res.data?.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [workshop.id]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${BORDER}` }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: TEXT }}>Reviews — {workshop.title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB }}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
          {loading ? (
            <p style={{ fontSize: '13px', color: SUB, textAlign: 'center', padding: '24px 0' }}>Loading…</p>
          ) : rows.length === 0 ? (
            <p style={{ fontSize: '13px', color: SUB, textAlign: 'center', padding: '24px 0' }}>No reviews yet.</p>
          ) : rows.map(r => (
            <div key={r.id} style={{ padding: '14px 0', borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{r.studentName}</span>
                <span style={{ fontSize: '12px', color: SUB }}>Trainer: {r.trainerRating}/5{r.venueRating != null ? ` · Venue: ${r.venueRating}/5` : ''} · Overall: {r.overallRating}/5</span>
              </div>
              {r.comment && <p style={{ margin: '0 0 8px', fontSize: '13px', color: TEXT, lineHeight: 1.6 }}>{r.comment}</p>}
              {r.answers && Object.keys(r.answers).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {Object.entries(r.answers).map(([k, v]) => (
                    <div key={k} style={{ fontSize: '11px', color: SUB, display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                      <span>{REVIEW_QUESTION_LABELS[k] ?? k}</span>
                      <span style={{ fontWeight: 600, color: TEXT }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', height: '42px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  );
}

function BulkEnrollModal({ workshop, onClose }: { workshop: Workshop; onClose: () => void }) {
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ totalRequested: number; confirmed: number; waitlisted: number; skipped: number } | null>(null);

  useEffect(() => {
    api.get('/institute/students', { params: { size: 200 } })
      .then(r => setRoster(r.data?.data?.content ?? []))
      .catch(() => setRoster([]));
  }, []);

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/institute/workshops/${workshop.id}/bulk-enroll`, { instituteStudentIds: Array.from(selected) });
      setResult(res.data?.data ?? null);
    } catch { /* keep modal open */ }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${BORDER}` }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: TEXT }}>Bulk Enroll — {workshop.title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB }}><X size={20} /></button>
        </div>

        {result ? (
          <div style={{ padding: '24px' }}>
            <p style={{ fontSize: '13px', color: TEXT, marginBottom: '16px' }}>
              {result.totalRequested} selected — {result.confirmed} confirmed, {result.waitlisted} waitlisted{result.skipped > 0 ? `, ${result.skipped} skipped (no matching student login)` : ''}.
            </p>
            <button onClick={onClose} style={{ width: '100%', padding: '11px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
              {roster.length === 0 ? (
                <p style={{ fontSize: '13px', color: SUB, textAlign: 'center', padding: '24px 0' }}>No students in your roster yet.</p>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selected.size === roster.length}
                    onChange={() => setSelected(selected.size === roster.length ? new Set() : new Set(roster.map(s => s.id)))} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>Select All ({roster.length})</div>
                </label>
              )}
              {roster.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}>
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{s.name}</div>
                    <div style={{ fontSize: '12px', color: SUB }}>{s.degree} · {s.yearOfPassing}</div>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${BORDER}`, display: 'flex', gap: '10px' }}>
              <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || selected.size === 0}
                style={{ flex: 1, padding: '11px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: (submitting || selected.size === 0) ? 'not-allowed' : 'pointer', opacity: (submitting || selected.size === 0) ? 0.6 : 1 }}>
                {submitting ? 'Enrolling…' : `Enroll ${selected.size} Student${selected.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [bulkTarget, setBulkTarget] = useState<Workshop | null>(null);
  const [rosterTarget, setRosterTarget] = useState<Workshop | null>(null);
  const [reviewsTarget, setReviewsTarget] = useState<Workshop | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'mine' | 'browse'>('mine');
  const [browseWorkshops, setBrowseWorkshops] = useState<Workshop[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [facultyId, setFacultyId] = useState('');
  const [mode, setMode] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionEndDate, setSessionEndDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueMapUrl, setVenueMapUrl] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [prerequisite, setPrerequisite] = useState('');

  const load = () => {
    api.get('/institute/workshops').then(res => setWorkshops(res.data?.data ?? [])).catch(() => setWorkshops([]));
    api.get('/institute/faculty', { params: { size: 200 } }).then(res => setTrainers(res.data?.data?.content ?? [])).catch(() => setTrainers([]));
  };

  const loadBrowse = () => {
    api.get('/institute/workshops/browse').then(res => setBrowseWorkshops(res.data?.data ?? [])).catch(() => setBrowseWorkshops([]));
  };

  useEffect(() => { load(); loadBrowse(); }, []);

  const resetForm = () => {
    setTitle(''); setDescription(''); setTargetRoles([]); setFacultyId(''); setMode('ONLINE');
    setSessionDate(''); setSessionEndDate(''); setSessionTime(''); setCity(''); setState(''); setVenueAddress(''); setVenueMapUrl('');
    setFeeAmount(''); setTotalSeats(''); setPrerequisite(''); setError(''); setEditId(null);
  };

  const openEdit = (w: Workshop) => {
    setTitle(w.title); setDescription(w.description ?? ''); setTargetRoles(w.targetRoles ?? []);
    setFacultyId(w.facultyId ? String(w.facultyId) : '');
    setMode(w.mode as 'ONLINE' | 'IN_PERSON');
    setSessionDate(w.sessionDate); setSessionEndDate(w.sessionEndDate ?? ''); setSessionTime(w.sessionTime);
    setCity(w.city ?? ''); setState(w.state ?? ''); setVenueAddress(w.venueAddress ?? ''); setVenueMapUrl(w.venueMapUrl ?? '');
    setFeeAmount(w.feeAmount ? String(w.feeAmount) : ''); setTotalSeats(String(w.totalSeats));
    setPrerequisite(w.prerequisite ?? '');
    setEditId(w.id); setError(''); setShowAdd(true);
  };

  const handleAdd = async () => {
    if (!title || targetRoles.length === 0 || !sessionDate || !totalSeats) {
      setError('Please fill title, target role, date, and total seats.'); return;
    }
    if (mode === 'IN_PERSON' && !city) { setError('City is required for in-person workshops.'); return; }
    setSaving(true); setError('');
    const payload = {
      title, description, targetRoles,
      facultyId: facultyId ? Number(facultyId) : null,
      mode, sessionDate, sessionEndDate: sessionEndDate || null, sessionTime: sessionTime || null,
      city: mode === 'IN_PERSON' ? city : null,
      state: mode === 'IN_PERSON' ? state : null,
      venueAddress: mode === 'IN_PERSON' ? venueAddress : null,
      venueMapUrl: mode === 'IN_PERSON' ? (venueMapUrl || null) : null,
      feeAmount: feeAmount ? Number(feeAmount) : 0,
      totalSeats: Number(totalSeats),
      prerequisite: prerequisite || null,
    };
    try {
      if (editId) await api.put(`/institute/workshops/${editId}`, payload);
      else await api.post('/institute/workshops', payload);
      setShowAdd(false); resetForm(); load();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to submit workshop.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: TEXT }}>Workshops</h2>
          <p style={{ margin: 0, fontSize: '13px', color: SUB }}>Posted workshops need Verifier approval before students can see them.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Post Workshop
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => setTab('mine')}
          style={{ padding: '9px 20px', borderRadius: '100px', border: `1px solid ${tab === 'mine' ? PRIMARY : BORDER}`, background: tab === 'mine' ? PRIMARY : '#fff', color: tab === 'mine' ? '#fff' : TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          My Postings
        </button>
        <button onClick={() => setTab('browse')}
          style={{ padding: '9px 20px', borderRadius: '100px', border: `1px solid ${tab === 'browse' ? PRIMARY : BORDER}`, background: tab === 'browse' ? PRIMARY : '#fff', color: tab === 'browse' ? '#fff' : TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Browse &amp; Enroll Students
        </button>
      </div>

      {tab === 'mine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {workshops.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '40px', textAlign: 'center', color: SUB, fontSize: '13px' }}>No workshops posted yet.</div>
          ) : workshops.map(w => {
            const st = STATUS_STYLE[w.status] ?? STATUS_STYLE.PENDING;
            return (
              <div key={w.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{w.title}</div>
                    <div style={{ fontSize: '12px', color: SUB, marginTop: '2px' }}>{(w.targetRoles ?? []).join(', ')} · {w.trainerName ?? 'No trainer assigned'}</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '100px', background: st.bg, color: st.color }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: SUB, flexWrap: 'wrap' }}>
                  <span>{w.mode === 'ONLINE' ? 'Online' : w.city}</span>
                  <span>{w.sessionDate}{w.sessionEndDate && w.sessionEndDate !== w.sessionDate ? ` – ${w.sessionEndDate}` : ''} {w.sessionTime}</span>
                  <span>{w.seatsConfirmed}/{w.totalSeats} seats filled</span>
                  <span>{w.feeAmount ? `₹${w.feeAmount}` : 'Free'}</span>
                  {w.rating != null && <span>★ {w.rating}</span>}
                </div>
                {w.status === 'REJECTED' && w.rejectionReason && (
                  <div style={{ marginTop: '10px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '12px' }}>
                    Rejection reason: {w.rejectionReason}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  {w.status === 'APPROVED' && (
                    <>
                      <button onClick={() => setBulkTarget(w)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '100px', border: `1px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        <Users size={13} /> Bulk Enroll Students
                      </button>
                      <button onClick={() => setRosterTarget(w)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        <Users size={13} /> View Enrollments
                      </button>
                      <button onClick={() => setReviewsTarget(w)}
                        style={{ padding: '8px 16px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        Reviews{w.rating != null ? ` (★ ${w.rating})` : ''}
                      </button>
                    </>
                  )}
                  <button onClick={() => openEdit(w)}
                    style={{ padding: '8px 16px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'browse' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {browseWorkshops.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '40px', textAlign: 'center', color: SUB, fontSize: '13px' }}>No approved workshops available right now.</div>
          ) : browseWorkshops.map(w => (
            <div key={w.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{w.title}</div>
                  <div style={{ fontSize: '12px', color: SUB, marginTop: '2px' }}>{(w.targetRoles ?? []).join(', ')} · {w.posterName ?? 'Unknown poster'}{w.trainerName ? ` · ${w.trainerName}` : ''}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: SUB, flexWrap: 'wrap', marginBottom: '12px' }}>
                <span>{w.mode === 'ONLINE' ? 'Online' : w.city}</span>
                <span>{w.sessionDate}{w.sessionEndDate && w.sessionEndDate !== w.sessionDate ? ` – ${w.sessionEndDate}` : ''} {w.sessionTime}</span>
                <span>{w.seatsConfirmed}/{w.totalSeats} seats filled</span>
                <span>{w.feeAmount ? `₹${w.feeAmount}` : 'Free'}</span>
                {w.rating != null && <span>★ {w.rating}</span>}
              </div>
              <button onClick={() => setBulkTarget(w)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '100px', border: `1px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <Users size={13} /> Bulk Enroll Students
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: TEXT }}>{editId ? 'Edit Workshop' : 'Post Workshop'}</h3>
              <button onClick={() => { setShowAdd(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB }}><X size={20} /></button>
            </div>
            {editId && (
              <div style={{ padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '8px', color: '#92400E', fontSize: '12px', marginBottom: '14px' }}>
                Saving changes will resubmit this workshop for Verifier approval.
              </div>
            )}
            {error && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Title"><input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} /></Field>
              <Field label="Description"><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical' as const }} /></Field>
              <Field label="Workshop Prerequisite (optional)">
                <textarea value={prerequisite} onChange={e => setPrerequisite(e.target.value)} rows={2} placeholder="e.g. Bring a laptop with Python installed"
                  style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical' as const }} />
              </Field>
              <Field label="Target Role(s)">
                <MultiSelectDropdown options={ROLE_AREAS} groups={ROLE_GROUPS} selected={targetRoles} onChange={setTargetRoles}
                  placeholder="Select target role(s)" primaryColor={PRIMARY} borderColor={BORDER} textColor={TEXT} />
              </Field>
              <Field label="Trainer (from Faculty)">
                <select value={facultyId} onChange={e => setFacultyId(e.target.value)} style={inputStyle}>
                  <option value="">No trainer</option>
                  {trainers.map(t => <option key={t.id} value={t.id} disabled={!t.email}>{t.name}{!t.email ? ' (no email on file)' : ''}</option>)}
                </select>
              </Field>
              <Field label="Mode">
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setMode('ONLINE')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1.5px solid ${mode === 'ONLINE' ? PRIMARY : BORDER}`, background: mode === 'ONLINE' ? '#EEF2FF' : '#fff', color: mode === 'ONLINE' ? PRIMARY : TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Online</button>
                  <button type="button" onClick={() => setMode('IN_PERSON')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1.5px solid ${mode === 'IN_PERSON' ? PRIMARY : BORDER}`, background: mode === 'IN_PERSON' ? '#EEF2FF' : '#fff', color: mode === 'IN_PERSON' ? PRIMARY : TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>In-person</button>
                </div>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="Start Date"><input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} style={inputStyle} /></Field>
                <Field label="End Date"><input type="date" value={sessionEndDate} onChange={e => setSessionEndDate(e.target.value)} style={inputStyle} /></Field>
              </div>
              {mode === 'IN_PERSON' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <Field label="City"><input value={city} onChange={e => setCity(e.target.value)} style={inputStyle} /></Field>
                    <Field label="State"><input value={state} onChange={e => setState(e.target.value)} style={inputStyle} /></Field>
                  </div>
                  <Field label="Venue Address"><textarea value={venueAddress} onChange={e => setVenueAddress(e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical' as const }} /></Field>
                  <Field label="Venue Google Pin Location URL"><input value={venueMapUrl} onChange={e => setVenueMapUrl(e.target.value)} placeholder="https://maps.google.com/…" style={inputStyle} /></Field>
                </>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="Fee (₹, 0 = free)"><input type="number" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} style={inputStyle} /></Field>
                <Field label="Total Seats"><input type="number" value={totalSeats} onChange={e => setTotalSeats(e.target.value)} style={inputStyle} /></Field>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => { setShowAdd(false); resetForm(); }}
                style={{ flex: 1, padding: '11px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                style={{ flex: 1, padding: '11px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Submitting…' : editId ? 'Save & Resubmit for Approval' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkTarget && <BulkEnrollModal workshop={bulkTarget} onClose={() => setBulkTarget(null)} />}
      {rosterTarget && <EnrollmentsModal workshop={rosterTarget} onClose={() => setRosterTarget(null)} />}
      {reviewsTarget && <ReviewsModal workshop={reviewsTarget} onClose={() => setReviewsTarget(null)} />}
    </div>
  );
}
