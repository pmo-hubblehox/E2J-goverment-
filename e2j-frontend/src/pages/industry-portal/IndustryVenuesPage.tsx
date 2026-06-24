import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Check, X, Calendar, Clock, MapPin, Users, Building2, List } from 'lucide-react';
import api from '../../services/api';
import WeekCalendar from '../../components/WeekCalendar';
import type { CalEvent } from '../../components/WeekCalendar';

const PRIMARY = '#3F41D1';
const BORDER  = '#E2E8F0';
const TEXT    = '#1E293B';
const SUB     = '#64748B';
const BG      = '#F8FAFC';

const VENUE_TYPES = ['LAB', 'CLASSROOM', 'CONFERENCE_ROOM', 'WORKSHOP'];


interface Venue { id: number; name: string; venueType: string; capacity: number; location: string; address: string; description: string; amenities: string; active: boolean; createdAt: string; }
interface AcceptedBooking { id: number; instituteName: string; requestedStartTime: string; requestedEndTime: string; purpose: string; }
interface Slot { id: number; venueId: number; venueName: string; date: string; startTime: string; endTime: string; status: string; notes: string; hasAcceptedBookings: boolean; acceptedBookings: AcceptedBooking[]; }
interface BookingReq { id: number; slotId: number; venueName: string; venueType: string; venueLocation: string; date: string; slotStartTime: string; slotEndTime: string; requestedStartTime: string; requestedEndTime: string; instituteName: string; purpose: string; status: string; rejectionReason: string; requestedAt: string; respondedAt: string; }

type Tab = 'venues' | 'requests';

export default function IndustryVenuesPage() {
  const [tab, setTab]               = useState<Tab>('venues');
  const [venues, setVenues]         = useState<Venue[]>([]);
  const [requests, setRequests]     = useState<BookingReq[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expandedVenue, setExpandedVenue] = useState<number | null>(null);
  const [venueSlots, setVenueSlots] = useState<Record<number, Slot[]>>({});
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [showAddSlot, setShowAddSlot]   = useState<number | null>(null);
  const [rejectModal, setRejectModal]   = useState<{ id: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [venueForm, setVenueForm] = useState({ name: '', venueType: 'LAB', capacity: '', location: '', address: '', description: '', amenities: '' });
  const [slotForm, setSlotForm]   = useState({ date: '', startTime: '', endTime: '', notes: '' });
  const [saving, setSaving]   = useState(false);
  const [reqFilter, setReqFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [slotView, setSlotView] = useState<Record<number, 'list' | 'calendar'>>({});

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    Promise.all([
      api.get('/industry/venues'),
      api.get('/industry/booking-requests'),
    ]).then(([v, r]) => {
      setVenues(v.data?.data ?? []);
      setRequests(r.data?.data ?? []);
    }).finally(() => setLoading(false));
  }

  function loadSlots(venueId: number) {
    api.get(`/industry/venues/${venueId}/slots`)
      .then(r => setVenueSlots(prev => ({ ...prev, [venueId]: r.data?.data ?? [] })));
  }

  function toggleVenue(id: number) {
    if (expandedVenue === id) { setExpandedVenue(null); return; }
    setExpandedVenue(id);
    if (!venueSlots[id]) loadSlots(id);
  }

  async function addVenue() {
    if (!venueForm.name.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/industry/venues', { ...venueForm, capacity: Number(venueForm.capacity) || null });
      const newId = res.data?.data?.id;
      setShowAddVenue(false);
      setVenueForm({ name: '', venueType: 'LAB', capacity: '', location: '', address: '', description: '', amenities: '' });
      await new Promise<void>(resolve => {
        Promise.all([api.get('/industry/venues'), api.get('/industry/booking-requests')])
          .then(([v, r]) => { setVenues(v.data?.data ?? []); setRequests(r.data?.data ?? []); resolve(); })
          .finally(() => setLoading(false));
      });
      // Auto-expand new venue and open slot form
      if (newId) { setExpandedVenue(newId); setVenueSlots(p => ({ ...p, [newId]: [] })); setShowAddSlot(newId); }
    } finally { setSaving(false); }
  }

  async function deleteVenue(id: number) {
    if (!confirm('Delete this venue and all its slots?')) return;
    await api.delete(`/industry/venues/${id}`);
    load();
  }

  async function addSlot(venueId: number) {
    if (!slotForm.date || !slotForm.startTime || !slotForm.endTime) return;
    setSaving(true);
    try {
      await api.post(`/industry/venues/${venueId}/slots`, slotForm);
      setShowAddSlot(null);
      setSlotForm({ date: '', startTime: '', endTime: '', notes: '' });
      loadSlots(venueId);
    } finally { setSaving(false); }
  }

  async function deleteSlot(venueId: number, slotId: number) {
    await api.delete(`/industry/slots/${slotId}`);
    loadSlots(venueId);
  }

  async function acceptRequest(id: number) {
    await api.post(`/industry/booking-requests/${id}/accept`);
    load();
  }

  async function rejectRequest() {
    if (!rejectModal || !rejectReason.trim()) return;
    await api.post(`/industry/booking-requests/${rejectModal.id}/reject`, { reason: rejectReason });
    setRejectModal(null);
    setRejectReason('');
    load();
  }

  const statusBadge = (s: string) => {
    const map: Record<string, [string, string]> = {
      AVAILABLE: ['#DCFCE7', '#15803D'],
      PENDING:   ['#FEF3C7', '#92400E'],
      BOOKED:    ['#FEE2E2', '#DC2626'],
    };
    const [bg, color] = map[s] ?? ['#F1F5F9', SUB];
    return <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: bg, color }}>{s}</span>;
  };

  const reqBadge = (s: string) => {
    const map: Record<string, [string, string]> = {
      PENDING:  ['#FEF3C7', '#92400E'],
      ACCEPTED: ['#DCFCE7', '#15803D'],
      REJECTED: ['#FEE2E2', '#DC2626'],
    };
    const [bg, color] = map[s] ?? ['#F1F5F9', SUB];
    return <span style={{ padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: bg, color }}>{s}</span>;
  };

  const filteredReqs = requests.filter(r => reqFilter === 'ALL' || r.status === reqFilter);
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: TEXT }}>Venue Management</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: SUB }}>Manage your labs & classrooms and handle booking requests from institutes</p>
        </div>
        {tab === 'venues' && (
          <button onClick={() => setShowAddVenue(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={15} /> Add Venue
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: '20px', gap: '0' }}>
        {([['venues', 'My Venues'], ['requests', `Booking Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}`]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '10px 20px', fontSize: '13px', fontWeight: tab === key ? 700 : 500, color: tab === key ? PRIMARY : SUB, background: 'none', border: 'none', borderBottom: tab === key ? `2px solid ${PRIMARY}` : '2px solid transparent', cursor: 'pointer', marginBottom: '-1px' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: SUB, fontSize: '13px' }}>Loading…</p> : tab === 'venues' ? (
        <>
          {venues.length === 0 && !showAddVenue && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: `1px dashed ${BORDER}` }}>
              <Building2 size={48} color="#C7D2FE" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ color: TEXT, fontSize: '15px', fontWeight: 700, margin: '0 0 6px' }}>No venues yet</p>
              <p style={{ color: SUB, fontSize: '13px', margin: '0 0 20px' }}>Add a lab or classroom, then add date/time slots for institutes to book.</p>
              <button onClick={() => setShowAddVenue(true)}
                style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                + Add Your First Venue
              </button>
            </div>
          )}

          {venues.map(venue => (
            <div key={venue.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', marginBottom: '12px', overflow: 'hidden' }}>
              {/* Venue header */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => toggleVenue(venue.id)}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={20} color={PRIMARY} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{venue.name}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: '#EEF2FF', color: PRIMARY }}>{venue.venueType.replace('_', ' ')}</span>
                    {!venue.active && <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, background: '#FEE2E2', color: '#DC2626' }}>INACTIVE</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                    {venue.capacity && <span style={{ fontSize: '12px', color: SUB, display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} />{venue.capacity} capacity</span>}
                    {venue.location && <span style={{ fontSize: '12px', color: SUB, display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} />{venue.location}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={e => { e.stopPropagation(); deleteVenue(venue.id); }}
                    style={{ padding: '6px', borderRadius: '8px', border: `1px solid #FECACA`, background: '#FEF2F2', cursor: 'pointer', display: 'flex' }}>
                    <Trash2 size={14} color="#DC2626" />
                  </button>
                  {expandedVenue === venue.id ? <ChevronUp size={16} color={SUB} /> : <ChevronDown size={16} color={SUB} />}
                </div>
              </div>

              {/* Expanded — slots */}
              {expandedVenue === venue.id && (
                <div style={{ borderTop: `1px solid ${BORDER}`, padding: '16px 20px', background: BG }}>
                  {(venue.description || venue.amenities) && (
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      {venue.description && <span style={{ fontSize: '12px', color: SUB }}>{venue.description}</span>}
                      {venue.amenities && <span style={{ fontSize: '12px', color: SUB }}>🔧 {venue.amenities}</span>}
                    </div>
                  )}

                  {/* Slot toolbar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>Availability Slots</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {/* List / Calendar toggle */}
                      <div style={{ display: 'flex', border: `1px solid ${BORDER}`, borderRadius: '8px', overflow: 'hidden' }}>
                        <button onClick={() => setSlotView(p => ({ ...p, [venue.id]: 'list' }))}
                          style={{ padding: '5px 10px', border: 'none', background: (slotView[venue.id] ?? 'list') === 'list' ? PRIMARY : '#fff', color: (slotView[venue.id] ?? 'list') === 'list' ? '#fff' : SUB, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                          <List size={13} /> List
                        </button>
                        <button onClick={() => { setSlotView(p => ({ ...p, [venue.id]: 'calendar' })); }}
                          style={{ padding: '5px 10px', border: 'none', borderLeft: `1px solid ${BORDER}`, background: slotView[venue.id] === 'calendar' ? PRIMARY : '#fff', color: slotView[venue.id] === 'calendar' ? '#fff' : SUB, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                          <Calendar size={13} /> Calendar
                        </button>
                      </div>
                      <button onClick={() => { setShowAddSlot(showAddSlot === venue.id ? null : venue.id); setSlotForm({ date: '', startTime: '', endTime: '', notes: '' }); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        <Plus size={13} /> Add Slot
                      </button>
                    </div>
                  </div>

                  {/* Add slot form */}
                  {showAddSlot === venue.id && (
                    <div style={{ background: '#fff', border: `2px solid ${PRIMARY}`, borderRadius: '10px', padding: '16px', marginBottom: '14px' }}>
                      <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: PRIMARY }}>📅 New Availability Slot</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '4px' }}>Date *</label>
                          <input type="date" value={slotForm.date} onChange={e => setSlotForm(p => ({ ...p, date: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${slotForm.date ? PRIMARY : BORDER}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '4px' }}>Start Time *</label>
                          <input type="time" value={slotForm.startTime} onChange={e => setSlotForm(p => ({ ...p, startTime: e.target.value }))}
                            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${slotForm.startTime ? PRIMARY : BORDER}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '4px' }}>End Time *</label>
                          <input type="time" value={slotForm.endTime} onChange={e => setSlotForm(p => ({ ...p, endTime: e.target.value }))}
                            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${slotForm.endTime ? PRIMARY : BORDER}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                      </div>
                      <input placeholder="Notes (optional)" value={slotForm.notes} onChange={e => setSlotForm(p => ({ ...p, notes: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' }} />
                      {(!slotForm.date || !slotForm.startTime || !slotForm.endTime) && (
                        <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#EF4444' }}>* Date, start time, and end time are required</p>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => addSlot(venue.id)} disabled={saving || !slotForm.date || !slotForm.startTime || !slotForm.endTime}
                          style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: (!slotForm.date || !slotForm.startTime || !slotForm.endTime) ? 0.5 : 1 }}>
                          {saving ? 'Saving…' : 'Add Slot'}
                        </button>
                        <button onClick={() => setShowAddSlot(null)}
                          style={{ padding: '8px 20px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Slot list/calendar view */}
                  {(venueSlots[venue.id] ?? []).length === 0
                    ? <p style={{ fontSize: '12px', color: SUB, textAlign: 'center', padding: '24px 0', background: '#fff', borderRadius: '8px', border: `1px dashed ${BORDER}` }}>No slots added yet. Click <strong>Add Slot</strong> above to add availability.</p>
                    : slotView[venue.id] === 'calendar'
                      ? <div style={{ margin: '0 -20px -16px' }}><WeekCalendar
                          events={(venueSlots[venue.id] ?? []).map((s): CalEvent => ({
                            id: s.id,
                            date: s.date,
                            startTime: s.startTime,
                            endTime: s.endTime,
                            title: s.status === 'BOOKED' ? 'Fully Booked' : s.status === 'AVAILABLE' ? 'Available' : s.status,
                            subtitle: s.notes || undefined,
                            color: s.status === 'AVAILABLE' ? '#DCFCE7' : s.status === 'BOOKED' ? '#FEE2E2' : '#FEF9C3',
                            textColor: s.status === 'AVAILABLE' ? '#16A34A' : s.status === 'BOOKED' ? '#DC2626' : '#D97706',
                            subBlocks: (s.acceptedBookings ?? []).map(b => ({
                              startTime: b.requestedStartTime,
                              endTime: b.requestedEndTime,
                              label: b.instituteName,
                            })),
                          }))}
                        /></div>
                      : (venueSlots[venue.id] ?? []).map(slot => (
                        <div key={slot.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', marginBottom: '8px', overflow: 'hidden' }}>
                          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#EEF2FF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: '10px', color: PRIMARY, fontWeight: 700, lineHeight: 1 }}>{new Date(slot.date).toLocaleString('en', { month: 'short' }).toUpperCase()}</span>
                              <span style={{ fontSize: '15px', color: PRIMARY, fontWeight: 800, lineHeight: 1.1 }}>{new Date(slot.date).getDate()}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', color: TEXT, fontWeight: 600 }}>{new Date(slot.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                              <div style={{ fontSize: '12px', color: SUB, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <Clock size={11} /> {slot.startTime} – {slot.endTime}
                                {slot.notes && <span style={{ marginLeft: '8px' }}>· {slot.notes}</span>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {statusBadge(slot.status)}
                              {!slot.hasAcceptedBookings && (
                                <button onClick={() => deleteSlot(venue.id, slot.id)}
                                  style={{ padding: '4px', borderRadius: '6px', border: `1px solid #FECACA`, background: '#FEF2F2', cursor: 'pointer', display: 'flex' }}>
                                  <Trash2 size={12} color="#DC2626" />
                                </button>
                              )}
                            </div>
                          </div>
                          {(slot.acceptedBookings ?? []).map(b => (
                            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 14px 6px 64px', background: '#FEF2F2', borderTop: '1px solid #FECACA' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626', flexShrink: 0 }} />
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626' }}>BLOCKED</span>
                              <span style={{ fontSize: '12px', color: '#7F1D1D', fontWeight: 600 }}>{b.requestedStartTime?.slice(0,5)} – {b.requestedEndTime?.slice(0,5)}</span>
                              <span style={{ fontSize: '11px', color: '#991B1B' }}>· {b.instituteName}</span>
                              {b.purpose && <span style={{ fontSize: '11px', color: '#B45309', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{b.purpose}</span>}
                            </div>
                          ))}
                        </div>
                      ))
                  }
                </div>
              )}
            </div>
          ))}

          {/* Add venue form */}
          {showAddVenue && (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px', marginTop: '12px' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: TEXT }}>Add New Venue</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '4px' }}>Venue Name *</label>
                  <input value={venueForm.name} onChange={e => setVenueForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. AI Research Lab"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '4px' }}>Type *</label>
                  <select value={venueForm.venueType} onChange={e => setVenueForm(p => ({ ...p, venueType: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}>
                    {VENUE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '4px' }}>Capacity</label>
                  <input type="number" value={venueForm.capacity} onChange={e => setVenueForm(p => ({ ...p, capacity: e.target.value }))} placeholder="e.g. 30"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '4px' }}>Location / Building</label>
                  <input value={venueForm.location} onChange={e => setVenueForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Block A, Floor 2"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '4px' }}>Full Address</label>
                  <input value={venueForm.address} onChange={e => setVenueForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '4px' }}>Amenities (comma-separated)</label>
                  <input value={venueForm.amenities} onChange={e => setVenueForm(p => ({ ...p, amenities: e.target.value }))} placeholder="e.g. WiFi, Projector, AC, 30 computers"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '4px' }}>Description</label>
                  <textarea value={venueForm.description} onChange={e => setVenueForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Brief description"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={addVenue} disabled={saving}
                  style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? 'Saving…' : 'Add Venue'}
                </button>
                <button onClick={() => setShowAddVenue(false)}
                  style={{ padding: '9px 22px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Booking Requests tab */
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map(f => (
              <button key={f} onClick={() => setReqFilter(f)}
                style={{ padding: '6px 16px', borderRadius: '100px', border: `1px solid ${reqFilter === f ? PRIMARY : BORDER}`, background: reqFilter === f ? PRIMARY : '#fff', color: reqFilter === f ? '#fff' : SUB, fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
                {f}
              </button>
            ))}
          </div>

          {filteredReqs.length === 0
            ? <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}` }}>
                <p style={{ color: SUB, fontSize: '14px', margin: 0 }}>No booking requests found.</p>
              </div>
            : filteredReqs.map(req => (
              <div key={req.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>{req.instituteName}</span>
                      {reqBadge(req.status)}
                    </div>
                    <span style={{ fontSize: '12px', color: SUB }}>{req.venueName} · {req.venueType.replace('_', ' ')}</span>
                  </div>
                  {req.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => acceptRequest(req.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#DCFCE7', color: '#15803D', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                        <Check size={13} /> Accept
                      </button>
                      <button onClick={() => { setRejectModal({ id: req.id }); setRejectReason(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#FEE2E2', color: '#DC2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                        <X size={13} /> Reject
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div style={{ background: BG, borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: SUB, marginBottom: '2px' }}>DATE</div>
                    <div style={{ fontSize: '13px', color: TEXT }}>{req.date}</div>
                  </div>
                  <div style={{ background: BG, borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: SUB, marginBottom: '2px' }}>REQUESTED TIME</div>
                    <div style={{ fontSize: '13px', color: TEXT, fontWeight: 600 }}>
                      {req.requestedStartTime ? `${req.requestedStartTime.slice(0,5)} – ${req.requestedEndTime.slice(0,5)}` : `${req.slotStartTime} – ${req.slotEndTime}`}
                    </div>
                    <div style={{ fontSize: '10px', color: SUB, marginTop: '1px' }}>Slot: {req.slotStartTime} – {req.slotEndTime}</div>
                  </div>
                  <div style={{ background: BG, borderRadius: '8px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: SUB, marginBottom: '2px' }}>PURPOSE</div>
                    <div style={{ fontSize: '13px', color: TEXT }}>{req.purpose || '—'}</div>
                  </div>
                </div>
                {req.rejectionReason && (
                  <div style={{ marginTop: '10px', background: '#FEF2F2', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#7F1D1D' }}>
                    <strong>Rejection reason:</strong> {req.rejectionReason}
                  </div>
                )}
                {req.respondedAt && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: SUB }}>Responded: {new Date(req.respondedAt).toLocaleString('en-IN')}</div>
                )}
              </div>
            ))
          }
        </>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '440px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: TEXT }}>Reject Booking Request</h3>
            <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, display: 'block', marginBottom: '6px' }}>Reason for rejection *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="Explain why you're rejecting this request…"
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectModal(null)}
                style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={rejectRequest} disabled={!rejectReason.trim()}
                style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: rejectReason.trim() ? 1 : 0.5 }}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
