import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Plus, Calendar, List, X, Star, ExternalLink, ChevronLeft, ChevronRight, Pencil, FileText } from 'lucide-react';

const CATEGORY_NAMES: Record<string, string> = {
  R: 'Realistic', I: 'Investigative', A: 'Artistic',
  S: 'Social',    E: 'Enterprising',  C: 'Conventional',
};
const CATEGORY_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
  R: { bar: '#3B82F6', text: '#1D4ED8', bg: '#EFF6FF' },
  I: { bar: '#3F41D1', text: '#3730A3', bg: '#EEF2FF' },
  A: { bar: '#A855F7', text: '#7E22CE', bg: '#FDF4FF' },
  S: { bar: '#22C55E', text: '#15803D', bg: '#F0FDF4' },
  E: { bar: '#F97316', text: '#C2410C', bg: '#FFF7ED' },
  C: { bar: '#94A3B8', text: '#475569', bg: '#F8FAFC' },
};

type SessionStatus = 'AVAILABLE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

interface AvailSession {
  id: number;
  dateFrom: string;
  dateTo: string;
  days: string[];
  timeSlots: string[];
  feeAmount: number;
  feeType: string;
  status: SessionStatus;
  recurWeeks: number;
}

interface StudentBooking {
  id: number;
  studentName: string;
  studentEmail: string;
  sessionDate: string;
  sessionTime: string;
  feeAmount: number;
  status: string;
  meetLink: string;
  createdAt: string;
  psychometricReport?: {
    id: number;
    topInterests: string;
    topCareerMatch: string;
    totalScore: number;
    scores: Record<string, number>;
    recommendedPaths: string[];
    createdAt: string;
  };
}

// ── Psychometric Report Modal ─────────────────────────────────────────────────
function PsychometricReportModal({ booking, onClose }: { booking: StudentBooking; onClose: () => void }) {
  const r = booking.psychometricReport!;
  const scores = r.scores ?? {};
  const maxScore = Math.max(...Object.values(scores), 1);
  const paths: string[] = r.recommendedPaths ?? [];
  const PRIMARY = '#3F41D1';
  const BORDER  = '#E2E8F0';
  const TEXT    = '#1E293B';
  const SUB     = '#64748B';

  const [comment, setComment]   = useState('');
  const [sending, setSending]   = useState(false);
  const [sendMsg, setSendMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  // Sort scores descending
  const sortedScores = Object.entries(scores).sort(([, a], [, b]) => (b as number) - (a as number));
  const top1 = sortedScores[0]?.[0];
  const top2 = sortedScores[1]?.[0];
  const totalPossible = Object.keys(scores).length * 25;
  const pct = totalPossible > 0 ? Math.round((r.totalScore / totalPossible) * 100) : 0;

  const handleSend = async () => {
    if (!comment.trim()) { setSendMsg({ ok: false, text: 'Please write a comment before sending.' }); return; }
    setSending(true);
    setSendMsg(null);
    try {
      await api.post(`/counsellor/bookings/${booking.id}/report-comment`, {
        comment,
        studentEmail: booking.studentEmail,
        studentName: booking.studentName,
      });
      setSendMsg({ ok: true, text: `Report with your comments sent to ${booking.studentEmail}` });
    } catch {
      setSendMsg({ ok: false, text: 'Failed to send. Please try again.' });
    } finally { setSending(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto', padding: '28px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: TEXT }}>Psychometric Assessment Report</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: SUB }}>
              {booking.studentName} · {booking.studentEmail} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, marginLeft: '16px' }}><X size={20} /></button>
        </div>

        {/* Summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Strongest Interest', value: r.topInterests?.split(',')[0]?.trim() ?? '—', color: PRIMARY },
            { label: 'Top Career Match',   value: r.topCareerMatch ?? '—',                       color: '#16A34A' },
            { label: 'Overall Score',      value: `${r.totalScore} / ${totalPossible}`,          color: '#EA580C' },
            { label: 'Score %',            value: `${pct}%`,                                     color: pct >= 60 ? '#16A34A' : pct >= 40 ? '#F59E0B' : '#EF4444' },
          ].map(c => (
            <div key={c.label} style={{ background: '#F8FAFC', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '5px' }}>{c.label}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Score interpretation */}
        <div style={{ background: '#EEF2FF', borderRadius: '10px', padding: '14px 16px', marginBottom: '22px', fontSize: '13px', color: TEXT, lineHeight: 1.6 }}>
          <strong>Counsellor Insight:</strong> {booking.studentName.split(' ')[0]}'s strongest interest areas are <strong>{CATEGORY_NAMES[top1] ?? top1}</strong> and <strong>{CATEGORY_NAMES[top2] ?? top2}</strong>.
          {pct >= 60 ? ' Their overall score indicates strong self-awareness — recommendations are highly reliable.' :
           pct >= 40 ? ' Their score suggests moderate self-awareness. Career guidance can help refine the direction.' :
                       ' Their interests are still forming — counselling is especially valuable at this stage.'}
        </div>

        {/* Interest Scores */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Interest Profile
            <span style={{ fontSize: '11px', color: SUB, fontWeight: 400 }}>Holland RIASEC Model</span>
          </div>
          {sortedScores.map(([cat, score]) => {
            const col = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['C'];
            const pctBar = Math.round(((score as number) / maxScore) * 100);
            return (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: col.text }}>{cat}</span>
                </div>
                <div style={{ width: '110px', fontSize: '12px', fontWeight: 600, color: TEXT, flexShrink: 0 }}>{CATEGORY_NAMES[cat] ?? cat}</div>
                <div style={{ flex: 1, background: '#F1F5F9', borderRadius: '100px', height: '9px', overflow: 'hidden' }}>
                  <div style={{ width: `${pctBar}%`, height: '9px', borderRadius: '100px', background: col.bar, transition: 'width 0.4s' }} />
                </div>
                <div style={{ width: '30px', textAlign: 'right' as const, fontSize: '12px', fontWeight: 700, color: col.bar, flexShrink: 0 }}>{score as number}</div>
                {(cat === top1 || cat === top2) && (
                  <span style={{ fontSize: '10px', color: col.text, background: col.bg, padding: '2px 7px', borderRadius: '10px', fontWeight: 700, flexShrink: 0 }}>
                    {cat === top1 ? 'Top' : '2nd'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Recommended Paths */}
        {paths.length > 0 && (
          <div style={{ marginBottom: '22px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '12px' }}>Recommended Career Paths</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {paths.map((p, i) => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: i === 0 ? '#EEF2FF' : '#F8FAFC', border: `1px solid ${i === 0 ? '#C7D2FE' : BORDER}`, borderRadius: '10px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: i === 0 ? PRIMARY : '#94A3B8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ fontSize: '13px', fontWeight: i === 0 ? 700 : 500, color: i === 0 ? PRIMARY : TEXT }}>{p}</span>
                  {i === 0 && <span style={{ marginLeft: 'auto', fontSize: '10px', color: PRIMARY, fontWeight: 700, background: '#fff', padding: '2px 8px', borderRadius: '100px', border: `1px solid #C7D2FE`, flexShrink: 0 }}>Top Match</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Counsellor Comment Section ── */}
        <div style={{ borderTop: `2px solid ${BORDER}`, paddingTop: '22px', marginTop: '4px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '6px' }}>Add Your Comments</div>
          <p style={{ margin: '0 0 12px', fontSize: '12px', color: SUB }}>
            Write personalised feedback or guidance for {booking.studentName.split(' ')[0]}. This will be emailed to them at <strong>{booking.studentEmail}</strong>.
          </p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={`e.g. Based on your results, I recommend focusing on roles in ${CATEGORY_NAMES[top1] ?? 'your top interest area'}. Your score suggests you thrive in analytical and structured environments...`}
            rows={5}
            style={{ width: '100%', boxSizing: 'border-box' as const, border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: TEXT, resize: 'vertical' as const, outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
          />

          {sendMsg && (
            <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, background: sendMsg.ok ? '#DCFCE7' : '#FEF2F2', color: sendMsg.ok ? '#16A34A' : '#DC2626', border: `1px solid ${sendMsg.ok ? '#86EFAC' : '#FECACA'}` }}>
              {sendMsg.ok ? '✓ ' : '⚠ '}{sendMsg.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
            <button onClick={onClose} style={{ padding: '10px 24px', border: `1px solid ${BORDER}`, borderRadius: '24px', background: '#fff', fontSize: '13px', color: SUB, cursor: 'pointer' }}>
              Close
            </button>
            <button onClick={handleSend} disabled={sending}
              style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: sending ? '#94A3B8' : PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {sending ? 'Sending…' : 'Send Report to Student'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

const STATUS_COLOR: Record<SessionStatus, { bg: string; text: string }> = {
  AVAILABLE:  { bg: '#DCFCE7', text: '#15803D' },
  UPCOMING:   { bg: '#EEF2FF', text: '#4F46E5' },
  COMPLETED:  { bg: '#F1F5F9', text: '#475569' },
  CANCELLED:  { bg: '#FEF2F2', text: '#DC2626' },
};

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21];
const DAY_CHIPS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Parse start hour from slot string like "20:00-21:30" or "09:00"
function slotStartHour(t: string): number {
  const start = t.split('-')[0].trim();
  return parseInt(start.split(':')[0], 10);
}

function fmtHour(h: number) {
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
}

// ── Add Availability Modal ────────────────────────────────────────────────────
interface Slot { from: string; to: string }

function AddAvailabilityModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [recurWeeks, setRecurWeeks] = useState('1');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [slotFrom, setSlotFrom] = useState('');
  const [slotTo, setSlotTo] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [fee, setFee] = useState('');
  const [feeType, setFeeType] = useState('Per Session');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const toggleDay = (d: string) => setSelectedDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  const addSlot = () => { if (slotFrom && slotTo) { setSlots(p => [...p, { from: slotFrom, to: slotTo }]); setSlotFrom(''); setSlotTo(''); } };
  const removeSlot = (i: number) => setSlots(p => p.filter((_, idx) => idx !== i));

  const inSt: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#1E293B', outline: 'none', background: '#fff' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>Add Availability</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inSt} />
            <label style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>Date From *</label>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inSt} />
            <label style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>Date To *</label>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <input type="number" min="1" value={recurWeeks} onChange={e => setRecurWeeks(e.target.value)} style={inSt} />
          <label style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>Recurring Weeks *</label>
        </div>

        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 8px' }}>Select Days *</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {DAY_CHIPS.map(d => (
            <button key={d} onClick={() => toggleDay(d)}
              style={{ padding: '5px 14px', borderRadius: '20px', border: `1.5px solid ${selectedDays.includes(d) ? '#4F46E5' : '#E2E8F0'}`, background: selectedDays.includes(d) ? '#EEF2FF' : '#fff', color: selectedDays.includes(d) ? '#4F46E5' : '#64748B', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
              {d}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 8px' }}>Time Slots</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
          <input type="time" value={slotFrom} onChange={e => setSlotFrom(e.target.value)} style={{ ...inSt, flex: 1 }} />
          <span style={{ color: '#94A3B8', fontSize: '13px' }}>–</span>
          <input type="time" value={slotTo} onChange={e => setSlotTo(e.target.value)} style={{ ...inSt, flex: 1 }} />
          <button onClick={addSlot} style={{ padding: '10px 14px', background: '#4338CA', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
            + Add
          </button>
        </div>
        {slots.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {slots.map((s, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#EEF2FF', color: '#4F46E5', borderRadius: '16px', padding: '4px 10px', fontSize: '12px', fontWeight: 500 }}>
                {s.from}–{s.to}
                <button onClick={() => removeSlot(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#4F46E5', display: 'flex', alignItems: 'center' }}><X size={11} /></button>
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input type="number" value={fee} onChange={e => setFee(e.target.value)} style={inSt} placeholder="500" />
            <label style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>Fees Amount (₹) *</label>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <select value={feeType} onChange={e => setFeeType(e.target.value)} style={{ ...inSt, appearance: 'none' as const }}>
              <option>Per Session</option>
              <option>Per Hour</option>
            </select>
            <label style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>Fees Type *</label>
          </div>
        </div>

        {modalError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#DC2626' }}>
            {modalError}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={async () => {
            if (!dateFrom || !dateTo) { setModalError('Please select date range.'); return; }
            if (selectedDays.length === 0) { setModalError('Please select at least one day.'); return; }
            if (slots.length === 0) { setModalError('Please add at least one time slot.'); return; }
            setModalError('');
            setSaving(true);
            try {
              await api.post('/counsellor/sessions/availability', {
                dateFrom, dateTo,
                recurWeeks: Number(recurWeeks) || 1,
                days: selectedDays,
                timeSlots: slots.map(s => `${s.from}-${s.to}`),
                feeAmount: fee ? Number(fee) : null,
                feeType,
                status: 'AVAILABLE',
              });
              onSaved();
              onClose();
            } catch (e: any) {
              setModalError(e?.response?.data?.message ?? 'Failed to save. Please try again.');
            } finally { setSaving(false); }
          }} disabled={saving}
            style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: '#4338CA', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Availability Modal ───────────────────────────────────────────────────
function EditAvailabilityModal({
  session, bookings, onClose, onSaved,
}: {
  session: AvailSession;
  bookings: StudentBooking[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<'AVAILABLE' | 'CANCELLED'>(
    session.status === 'CANCELLED' ? 'CANCELLED' : 'AVAILABLE'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Check if any active booking falls within this session's schedule
  const bookedSlots = bookings.filter(b => {
    if (b.status === 'CANCELLED') return false;
    const bDate = new Date(b.sessionDate);
    const fromDate = new Date(session.dateFrom);
    const toDate = new Date(session.dateTo);
    if (bDate < fromDate || bDate > toDate) return false;
    const dayShort = bDate.toLocaleDateString('en-US', { weekday: 'short' });
    if (!session.days.map(d => d.toLowerCase()).includes(dayShort.toLowerCase())) return false;
    return session.timeSlots.includes(b.sessionTime);
  });

  const hasBookings = bookedSlots.length > 0;

  const inSt: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#1E293B', outline: 'none', background: '#fff' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '460px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>Edit Availability</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
        </div>

        {/* Session summary */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', marginBottom: '20px', fontSize: '13px', color: '#1E293B' }}>
          <div style={{ marginBottom: '6px' }}><strong>Date:</strong> {session.dateFrom} → {session.dateTo}</div>
          <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
            <strong>Days:</strong>
            {session.days.map(d => (
              <span key={d} style={{ background: '#EEF2FF', color: '#4F46E5', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{d}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
            <strong>Slots:</strong>
            {session.timeSlots.map(t => (
              <span key={t} style={{ background: '#F1F5F9', color: '#475569', borderRadius: '10px', padding: '2px 8px', fontSize: '11px' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Booked slots warning */}
        {hasBookings && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: '#92400E' }}>
            <strong>⚠ Cannot mark as Unavailable</strong> — {bookedSlots.length} booking(s) already confirmed for this availability:
            <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
              {bookedSlots.map(b => (
                <li key={b.id}>{b.studentName} — {b.sessionDate} {b.sessionTime}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <select value={status} onChange={e => setStatus(e.target.value as 'AVAILABLE' | 'CANCELLED')}
            disabled={hasBookings && status === 'AVAILABLE'}
            style={{ ...inSt, appearance: 'none' as const, cursor: hasBookings ? 'not-allowed' : 'default', background: hasBookings ? '#F8FAFC' : '#fff' }}>
            <option value="AVAILABLE">Available</option>
            <option value="CANCELLED" disabled={hasBookings}>Unavailable</option>
          </select>
          <label style={{ position: 'absolute', top: '-9px', left: '10px', background: hasBookings ? '#F8FAFC' : '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>Status</label>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#DC2626' }}>{error}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={async () => {
            if (status === 'CANCELLED' && hasBookings) {
              setError('Cannot mark unavailable — active bookings exist for this slot.');
              return;
            }
            setSaving(true); setError('');
            try {
              await api.put(`/counsellor/sessions/${session.id}/status`, { status });
              onSaved(); onClose();
            } catch (e: any) {
              setError(e?.response?.data?.message ?? 'Failed to update. Please try again.');
            } finally { setSaving(false); }
          }} disabled={saving}
            style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: '#4338CA', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BookedSessionPage() {
  const [view, setView] = useState<'calendar' | 'list' | 'bookings'>('bookings');
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<AvailSession | null>(null);
  const [viewingReport, setViewingReport] = useState<StudentBooking | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [sessions, setSessions] = useState<AvailSession[]>([]);
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const loadSessions = useCallback(() => {
    api.get('/counsellor/sessions')
      .then(r => {
        const raw = r.data?.data?.content ?? r.data?.data ?? [];
        setSessions(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setSessions([]));
  }, []);

  const loadBookings = useCallback(() => {
    setLoadingBookings(true);
    api.get('/counsellor/bookings')
      .then(r => setBookings(r.data?.data ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false));
  }, []);

  const reload = useCallback(() => { loadSessions(); loadBookings(); }, [loadSessions, loadBookings]);
  useEffect(() => { reload(); }, [reload]);

  // ── Calendar event expansion ─────────────────────────────────────────────
  const calendarEvents = (() => {
    const events: { date: string; time: string; label: string; booked: boolean; studentName?: string }[] = [];

    for (const s of sessions) {
      if (s.status === 'CANCELLED') continue;
      if (!s.dateFrom || !s.dateTo || !s.days?.length || !s.timeSlots?.length) continue;
      const from = new Date(s.dateFrom);
      const to   = new Date(s.dateTo);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
        if (!s.days.map(x => x.toLowerCase()).includes(dayShort.toLowerCase())) continue;
        const dateStr = d.toISOString().split('T')[0];
        for (const t of s.timeSlots) {
          const booking = bookings.find(b =>
            b.sessionDate === dateStr && b.sessionTime === t && b.status !== 'CANCELLED'
          );
          events.push({
            date: dateStr,
            time: t,
            label: booking ? booking.studentName : 'Available',
            booked: !!booking,
            studentName: booking?.studentName,
          });
        }
      }
    }
    return events;
  })();

  // ── Week navigation ──────────────────────────────────────────────────────
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7); // Monday-first
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const weekLabel = `${startOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${endOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
          {([
            { key: 'bookings', icon: <Star size={14} />, label: 'Student Bookings', badge: bookings.filter(b => b.status !== 'CANCELLED').length },
            { key: 'calendar', icon: <Calendar size={14} />, label: 'Calendar', badge: 0 },
            { key: 'list',     icon: <List size={14} />, label: 'Availability', badge: 0 },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setView(tab.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: view === tab.key ? '#fff' : 'transparent', color: view === tab.key ? '#1E293B' : '#64748B', boxShadow: view === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', whiteSpace: 'nowrap' }}>
              {tab.icon} {tab.label}
              {tab.badge > 0 && <span style={{ background: '#4F46E5', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '11px', marginLeft: '2px' }}>{tab.badge}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#4338CA', border: 'none', borderRadius: '24px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Add Availability
        </button>
      </div>

      {/* ── Student Bookings tab ── */}
      {view === 'bookings' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {loadingBookings ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>Loading bookings…</div>
          ) : bookings.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No student bookings yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Student', 'Email', 'Date', 'Time', 'Fee', 'Meet Link', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748B', fontWeight: 500, fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1E293B' }}>{b.studentName}</td>
                    <td style={{ padding: '12px 14px', color: '#64748B' }}>{b.studentEmail}</td>
                    <td style={{ padding: '12px 14px', color: '#64748B' }}>{b.sessionDate}</td>
                    <td style={{ padding: '12px 14px', color: '#64748B' }}>{b.sessionTime}</td>
                    <td style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600 }}>{b.feeAmount ? `₹${b.feeAmount.toLocaleString()}` : 'Free'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {b.meetLink
                        ? <a href={b.meetLink} target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '12px' }}>Join <ExternalLink size={11} /></a>
                        : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: b.status === 'CONFIRMED' ? '#DCFCE7' : b.status === 'COMPLETED' ? '#EEF2FF' : '#FEF2F2', color: b.status === 'CONFIRMED' ? '#16A34A' : b.status === 'COMPLETED' ? '#4F46E5' : '#DC2626' }}>{b.status}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {b.psychometricReport && (
                        <button onClick={() => setViewingReport(b)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#EEF2FF', border: 'none', borderRadius: '6px', color: '#3F41D1', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <FileText size={11} /> View Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Calendar tab ── */}
      {view === 'calendar' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
            <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><ChevronLeft size={18} /></button>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{weekLabel}</span>
            <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><ChevronRight size={18} /></button>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'auto' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 2, background: '#F8FAFC' }}>
              <div style={{ padding: '12px' }} />
              {WEEK_DAYS.map((d, i) => {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div key={d} style={{ padding: '10px 8px', textAlign: 'center', borderLeft: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{d}</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: isToday ? '#4F46E5' : '#1E293B', width: '28px', height: '28px', borderRadius: '50%', background: isToday ? '#EEF2FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px auto 0' }}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hour rows */}
            {HOURS.map(hour => (
              <div key={hour} style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', borderBottom: '1px solid #F1F5F9', minHeight: '56px' }}>
                <div style={{ padding: '8px 10px', fontSize: '11px', color: '#94A3B8', textAlign: 'right', paddingTop: '10px', whiteSpace: 'nowrap' }}>
                  {fmtHour(hour)}
                </div>
                {WEEK_DAYS.map((_, dayIdx) => {
                  const cellDate = new Date(startOfWeek);
                  cellDate.setDate(startOfWeek.getDate() + dayIdx);
                  const dateStr = cellDate.toISOString().split('T')[0];
                  const cellEvents = calendarEvents.filter(e => e.date === dateStr && slotStartHour(e.time) === hour);
                  return (
                    <div key={dayIdx} style={{ borderLeft: '1px solid #F1F5F9', padding: '4px', minHeight: '56px' }}>
                      {cellEvents.map((e, i) => (
                        <div key={i} title={e.booked ? `Booked by ${e.studentName}` : 'Available slot'}
                          style={{ background: e.booked ? '#EEF2FF' : '#DCFCE7', borderLeft: `3px solid ${e.booked ? '#4F46E5' : '#16A34A'}`, borderRadius: '4px', padding: '4px 6px', fontSize: '11px', marginBottom: '2px', cursor: 'default' }}>
                          <div style={{ fontWeight: 700, color: e.booked ? '#3730A3' : '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.booked ? e.studentName : 'Available'}
                          </div>
                          <div style={{ fontSize: '10px', color: e.booked ? '#4F46E5' : '#16A34A', marginTop: '1px' }}>
                            {e.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#DCFCE7', borderLeft: '3px solid #16A34A', display: 'inline-block' }} /> Available slot
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#EEF2FF', borderLeft: '3px solid #4F46E5', display: 'inline-block' }} /> Booked by student
            </span>
          </div>
        </>
      )}

      {/* ── Availability list tab ── */}
      {view === 'list' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {sessions.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No availability added yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Date Range', 'Days', 'Time Slots', 'Fee', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748B', fontWeight: 500, fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => {
                  const activeBookings = bookings.filter(b => {
                    if (b.status === 'CANCELLED') return false;
                    const bDate = new Date(b.sessionDate);
                    const from = new Date(s.dateFrom);
                    const to = new Date(s.dateTo);
                    if (bDate < from || bDate > to) return false;
                    const day = bDate.toLocaleDateString('en-US', { weekday: 'short' });
                    return s.days.map(d => d.toLowerCase()).includes(day.toLowerCase()) && s.timeSlots.includes(b.sessionTime);
                  });
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.dateFrom} → {s.dateTo}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(s.days ?? []).map(d => (
                            <span key={d} style={{ background: '#EEF2FF', color: '#4F46E5', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{d}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(s.timeSlots ?? []).map(t => (
                            <span key={t} style={{ background: '#F1F5F9', color: '#475569', borderRadius: '10px', padding: '2px 8px', fontSize: '11px' }}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {s.feeAmount ? `₹${s.feeAmount.toLocaleString()} ${s.feeType ?? ''}` : 'Free'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: STATUS_COLOR[s.status]?.bg ?? '#F1F5F9', color: STATUS_COLOR[s.status]?.text ?? '#475569', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                          {s.status === 'CANCELLED' ? 'UNAVAILABLE' : s.status}
                        </span>
                        {activeBookings.length > 0 && (
                          <span style={{ marginLeft: '6px', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 600 }}>
                            {activeBookings.length} booked
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button onClick={() => setEditingSession(s)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#EEF2FF', border: 'none', borderRadius: '6px', color: '#4F46E5', padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <Pencil size={12} /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && <AddAvailabilityModal onClose={() => setShowModal(false)} onSaved={reload} />}
      {viewingReport && <PsychometricReportModal booking={viewingReport} onClose={() => setViewingReport(null)} />}
      {editingSession && (
        <EditAvailabilityModal
          session={editingSession}
          bookings={bookings}
          onClose={() => setEditingSession(null)}
          onSaved={() => { setEditingSession(null); reload(); }}
        />
      )}
    </div>
  );
}
