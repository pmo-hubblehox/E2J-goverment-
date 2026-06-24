import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import WeekCalendar from '../../components/WeekCalendar';
import type { CalEvent } from '../../components/WeekCalendar';

const PRIMARY = '#3F41D1';
const BORDER  = '#E2E8F0';
const TEXT    = '#1E293B';
const SUB     = '#64748B';
const BG      = '#F8FAFC';

interface Slot { id: number; venueId: number; venueName: string; companyName: string; venueType: string; venueLocation: string; capacity: number; amenities: string; date: string; startTime: string; endTime: string; status: string; notes: string; }
interface Booking { id: number; slotId: number; venueName: string; companyName: string; venueType: string; venueLocation: string; date: string; slotStartTime: string; slotEndTime: string; requestedStartTime: string; requestedEndTime: string; instituteName: string; purpose: string; status: string; rejectionReason: string; requestedAt: string; respondedAt: string; }

type ViewMode = 'list' | 'calendar';


export default function InstituteLabBookingPage() {
  const [slots, setSlots]       = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState<ViewMode>('list');
  const [tab, setTab]           = useState<'available' | 'mybookings'>('available');
  const [bookModal, setBookModal]   = useState<Slot | null>(null);
  const [purpose, setPurpose]       = useState('');
  const [reqFrom, setReqFrom]       = useState('');
  const [reqTo, setReqTo]           = useState('');
  const [booking, setBooking]       = useState(false);
  const [bookError, setBookError]   = useState('');
  const today = new Date();

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    Promise.all([
      api.get('/institute/lab-slots'),
      api.get('/institute/lab-bookings'),
    ]).then(([s, b]) => {
      setSlots(s.data?.data ?? []);
      setBookings(b.data?.data ?? []);
    }).finally(() => setLoading(false));
  }

  function openBookModal(slot: Slot) {
    setBookModal(slot);
    setPurpose('');
    setReqFrom(slot.startTime.slice(0, 5));
    setReqTo(slot.endTime.slice(0, 5));
    setBookError('');
  }

  async function submitBooking() {
    if (!bookModal) return;
    if (!reqFrom || !reqTo) { setBookError('Please select your required time range.'); return; }
    if (reqFrom >= reqTo) { setBookError('Start time must be before end time.'); return; }
    if (reqFrom < bookModal.startTime.slice(0, 5) || reqTo > bookModal.endTime.slice(0, 5)) {
      setBookError(`Time must be within ${fmtTime(bookModal.startTime)} – ${fmtTime(bookModal.endTime)}.`); return;
    }
    setBooking(true);
    setBookError('');
    try {
      await api.post(`/institute/lab-slots/${bookModal.id}/book`, { purpose, requestedStartTime: reqFrom, requestedEndTime: reqTo });
      setBookModal(null);
      load();
    } catch (e: any) {
      setBookError(e?.response?.data?.message ?? 'Failed to send booking request.');
    } finally { setBooking(false); }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, [string, string]> = {
      PENDING:  ['#FEF3C7', '#92400E'],
      ACCEPTED: ['#DCFCE7', '#15803D'],
      REJECTED: ['#FEE2E2', '#DC2626'],
    };
    const [bg, color] = map[s] ?? ['#F1F5F9', SUB];
    return <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: bg, color }}>{s}</span>;
  };

  const displayedSlots = slots;

  function fmtTime(t: string) { return t.slice(0,5); }
  function typeLabel(t: string) { return t.replace('_', ' '); }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: TEXT }}>Book Industry Lab / Classroom</h2>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: SUB }}>Browse available venues from industry partners and submit booking requests</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: '20px' }}>
        {([['available', 'Available Slots'], ['mybookings', 'My Bookings']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '10px 20px', fontSize: '13px', fontWeight: tab === key ? 700 : 500, color: tab === key ? PRIMARY : SUB, background: 'none', border: 'none', borderBottom: tab === key ? `2px solid ${PRIMARY}` : '2px solid transparent', cursor: 'pointer', marginBottom: '-1px' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: SUB, fontSize: '13px' }}>Loading…</p> : tab === 'available' ? (
        <>
          {/* View toggle + calendar nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['list', 'calendar'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: '7px 16px', borderRadius: '8px', border: `1px solid ${view === v ? PRIMARY : BORDER}`, background: view === v ? '#EEF2FF' : '#fff', color: view === v ? PRIMARY : SUB, fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {v === 'list' ? '☰ List' : '📅 Calendar'}
                </button>
              ))}
            </div>
          </div>

          {view === 'calendar' && (
            <div style={{ marginBottom: '20px' }}>
              <WeekCalendar
                events={slots.map((s): CalEvent => ({
                  id: s.id,
                  date: s.date,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  title: s.companyName ? `${s.companyName} – ${s.venueName}` : s.venueName,
                  subtitle: `${s.venueType.replace('_', ' ')}${s.venueLocation ? ' · ' + s.venueLocation : ''}`,
                  color: '#DCFCE7',
                  textColor: '#16A34A',
                  onClick: () => openBookModal(s),
                }))}
              />
            </div>
          )}

          {/* Slot list — only shown in list view */}
          {view === 'list' && (
            displayedSlots.length === 0
              ? <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}` }}>
                  <Building2 size={40} color={BORDER} style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: SUB, fontSize: '14px', margin: 0 }}>No available slots from industry partners.</p>
                </div>
              : <>{displayedSlots.map(slot => (
                  <div key={slot.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building2 size={22} color={PRIMARY} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        {slot.companyName && <span style={{ fontSize: '12px', color: SUB, fontWeight: 600 }}>{slot.companyName}</span>}
                        {slot.companyName && <span style={{ color: BORDER }}>–</span>}
                        <span style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{slot.venueName}</span>
                        <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: '#EEF2FF', color: PRIMARY }}>{typeLabel(slot.venueType)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: SUB, display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} />{slot.date}</span>
                        <span style={{ fontSize: '12px', color: SUB, display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} />{fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}</span>
                        {slot.venueLocation && <span style={{ fontSize: '12px', color: SUB, display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} />{slot.venueLocation}</span>}
                        {slot.capacity && <span style={{ fontSize: '12px', color: SUB, display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} />{slot.capacity} capacity</span>}
                      </div>
                      {slot.amenities && <div style={{ fontSize: '11px', color: SUB, marginTop: '4px' }}>Amenities: {slot.amenities}</div>}
                      {slot.notes && <div style={{ fontSize: '11px', color: SUB, marginTop: '2px' }}>Note: {slot.notes}</div>}
                    </div>
                    <button onClick={() => openBookModal(slot)}
                      style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                      Book Slot
                    </button>
                  </div>
                ))}</>
          )}
        </>
      ) : (
        /* My Bookings */
        <>
          {bookings.length === 0
            ? <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}` }}>
                <p style={{ color: SUB, fontSize: '14px', margin: 0 }}>No booking requests yet.</p>
              </div>
            : bookings.map(b => (
              <div key={b.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {b.companyName && <span style={{ fontSize: '12px', color: SUB, fontWeight: 600 }}>{b.companyName} –</span>}
                      <span style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{b.venueName}</span>
                      {statusBadge(b.status)}
                    </div>
                    <span style={{ fontSize: '12px', color: SUB }}>{typeLabel(b.venueType)}{b.venueLocation ? ` · ${b.venueLocation}` : ''}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: SUB }}>Requested: {new Date(b.requestedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div style={{ background: BG, borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: SUB, marginBottom: '2px' }}>DATE</div>
                    <div style={{ fontSize: '13px', color: TEXT }}>{b.date}</div>
                  </div>
                  <div style={{ background: BG, borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: SUB, marginBottom: '2px' }}>BOOKED TIME</div>
                    <div style={{ fontSize: '13px', color: TEXT, fontWeight: 600 }}>
                      {b.requestedStartTime ? `${fmtTime(b.requestedStartTime)} – ${fmtTime(b.requestedEndTime)}` : `${fmtTime(b.slotStartTime)} – ${fmtTime(b.slotEndTime)}`}
                    </div>
                    {b.requestedStartTime && (
                      <div style={{ fontSize: '10px', color: SUB, marginTop: '2px' }}>Slot: {fmtTime(b.slotStartTime)}–{fmtTime(b.slotEndTime)}</div>
                    )}
                  </div>
                  <div style={{ background: BG, borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: SUB, marginBottom: '2px' }}>PURPOSE</div>
                    <div style={{ fontSize: '13px', color: TEXT }}>{b.purpose || '—'}</div>
                  </div>
                </div>
                {b.status === 'REJECTED' && b.rejectionReason && (
                  <div style={{ marginTop: '10px', background: '#FEF2F2', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#7F1D1D' }}>
                    <strong>Rejection reason:</strong> {b.rejectionReason}
                  </div>
                )}
                {b.status === 'ACCEPTED' && (
                  <div style={{ marginTop: '10px', background: '#F0FDF4', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#15803D' }}>
                    Your booking is confirmed. The slot has been reserved for you.
                  </div>
                )}
              </div>
            ))
          }
        </>
      )}

      {/* Book modal */}
      {bookModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '480px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: TEXT }}>Book Slot</h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: SUB }}>{bookModal.companyName ? `${bookModal.companyName} – ` : ''}{bookModal.venueName} · {bookModal.date}</p>

            {/* Slot window info */}
            <div style={{ background: '#EEF2FF', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={16} color={PRIMARY} />
              <div>
                <div style={{ fontSize: '11px', color: PRIMARY, fontWeight: 600 }}>AVAILABLE WINDOW</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{fmtTime(bookModal.startTime)} – {fmtTime(bookModal.endTime)}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '11px', color: SUB }}>Pick your required time within this window</div>
            </div>

            {/* Time range pickers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '4px' }}>From *</label>
                <input type="time" value={reqFrom}
                  min={bookModal.startTime.slice(0, 5)} max={bookModal.endTime.slice(0, 5)}
                  onChange={e => {
                    const v = e.target.value;
                    const min = bookModal.startTime.slice(0, 5);
                    const max = bookModal.endTime.slice(0, 5);
                    if (v < min) setReqFrom(min);
                    else if (v > max) setReqFrom(max);
                    else setReqFrom(v);
                  }}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${reqFrom ? PRIMARY : BORDER}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '4px' }}>To *</label>
                <input type="time" value={reqTo}
                  min={bookModal.startTime.slice(0, 5)} max={bookModal.endTime.slice(0, 5)}
                  onChange={e => {
                    const v = e.target.value;
                    const min = bookModal.startTime.slice(0, 5);
                    const max = bookModal.endTime.slice(0, 5);
                    if (v < min) setReqTo(min);
                    else if (v > max) setReqTo(max);
                    else setReqTo(v);
                  }}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${reqTo ? PRIMARY : BORDER}`, borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>
            {reqFrom && reqTo && reqFrom < reqTo && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontSize: '12px', color: '#15803D', fontWeight: 600 }}>
                Duration: {(() => { const [fh,fm] = reqFrom.split(':').map(Number); const [th,tm] = reqTo.split(':').map(Number); const d = (th*60+tm)-(fh*60+fm); return `${Math.floor(d/60)}h ${d%60}m`; })()}
              </div>
            )}

            <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '6px' }}>Purpose of booking</label>
            <textarea value={purpose} onChange={e => setPurpose(e.target.value)} rows={2}
              placeholder="e.g. Workshop on AI/ML for final year students"
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px' }} />

            {bookError && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>{bookError}</div>}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setBookModal(null)}
                style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitBooking} disabled={booking || !reqFrom || !reqTo}
                style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: (!reqFrom || !reqTo) ? 0.6 : 1 }}>
                {booking ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
