import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, ChevronDown, Calendar, X } from 'lucide-react';
import api from '../../services/api';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOUR_LABELS = ['10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'];
const HOUR_START = 10;
const TIME_OPTIONS = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'];

interface ResourceRow { name: string; computersAvailable: number }
const DEFAULT_ROWS: Record<TabType, ResourceRow[]> = {
  Labs: [{ name: 'Lab 1', computersAvailable: 100 }],
  Classroom: [{ name: 'Classroom 1', computersAvailable: 60 }],
  Seminar: [{ name: 'Seminar Hall 1', computersAvailable: 200 }],
};

const col: React.CSSProperties  = { padding: '14px 16px', fontSize: '13px', color: '#1E293B', borderBottom: '1px solid #F1F5F9' };
const hcol: React.CSSProperties = { padding: '11px 16px', fontSize: '13px', fontWeight: 500, color: '#94A3B8', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', textAlign: 'left' as const };
const inSt: React.CSSProperties = { border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px', fontSize: '13px', outline: 'none', background: '#fff', color: '#1E293B', width: '100%', boxSizing: 'border-box' as const };

type TabType = 'Labs' | 'Classroom' | 'Seminar';

interface AvailRow { id: number; roomType: string; roomNo: string; dateRange: string; timeSlot: string }

interface DateRangeBlock {
  id: number;
  applyTo: string[];
  from: string;
  to: string;
  timeSlots: { from: string; to: string; confirmed?: boolean }[];
}

// ── Add / Edit availability form ───────────────────────────────────────────────
function AddAvailabilityForm({
  onBack,
  onSaved,
  editRow,
}: {
  onBack: () => void;
  onSaved: (row: AvailRow) => void;
  editRow?: AvailRow;
}) {
  const [activeTab, setActiveTab] = useState<TabType>('Labs');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [rowData, setRowData] = useState<Record<string, { computersOffered: string; buffersOffered: string; totalOffered: string }>>({});
  const [dynamicRows, setDynamicRows] = useState<Record<TabType, ResourceRow[]>>({ ...DEFAULT_ROWS });

  const [dateBlocks, setDateBlocks] = useState<DateRangeBlock[]>([
    { id: 1, applyTo: [], from: '', to: '', timeSlots: [{ from: '', to: '' }] },
  ]);
  const [applyToOpen, setApplyToOpen] = useState<number | null>(null);

  const rows = dynamicRows[activeTab];
  const roomNames = rows.map(r => r.name);

  const addRow = () => {
    const prefix = activeTab === 'Labs' ? 'Lab' : activeTab === 'Classroom' ? 'Classroom' : 'Seminar Hall';
    const next = rows.length + 1;
    setDynamicRows(dr => ({ ...dr, [activeTab]: [...dr[activeTab], { name: `${prefix} ${next}`, computersAvailable: activeTab === 'Labs' ? 100 : activeTab === 'Classroom' ? 60 : 200 }] }));
  };

  const removeRow = (name: string) => {
    setDynamicRows(dr => ({ ...dr, [activeTab]: dr[activeTab].filter(r => r.name !== name) }));
    setRowData(rd => { const c = { ...rd }; delete c[name]; return c; });
  };

  const getRow = (name: string) => rowData[name] ?? { computersOffered: '100', buffersOffered: '', totalOffered: '100' };
  const setRow = (name: string, field: string, val: string) => setRowData(d => ({ ...d, [name]: { ...getRow(name), [field]: val } }));

  const addTimeSlot    = (bid: number) => setDateBlocks(bs => bs.map(b => b.id === bid ? { ...b, timeSlots: [...b.timeSlots, { from: '', to: '' }] } : b));
  const removeTimeSlot = (bid: number, idx: number) => setDateBlocks(bs => bs.map(b => b.id === bid ? { ...b, timeSlots: b.timeSlots.filter((_, i) => i !== idx) } : b));
  const updateTimeSlot = (bid: number, idx: number, field: 'from' | 'to', val: string) =>
    setDateBlocks(bs => bs.map(b => b.id === bid ? { ...b, timeSlots: b.timeSlots.map((s, i) => i === idx ? { ...s, [field]: val } : s) } : b));
  const confirmTimeSlot = (bid: number, idx: number) => {
    const slot = dateBlocks.find(b => b.id === bid)?.timeSlots[idx];
    if (slot?.from && slot?.to)
      setDateBlocks(bs => bs.map(b => b.id === bid ? { ...b, timeSlots: b.timeSlots.map((s, i) => i === idx ? { ...s, confirmed: true } : s) } : b));
  };
  const toggleApplyTo = (bid: number, name: string) =>
    setDateBlocks(bs => bs.map(b => b.id === bid ? {
      ...b, applyTo: b.applyTo.includes(name) ? b.applyTo.filter(x => x !== name) : [...b.applyTo, name],
    } : b));

  const handleSave = async () => {
    setValidationError('');
    const valid = dateBlocks.some(b => b.from && b.to && b.timeSlots.some(s => s.from && s.to));
    if (!valid) {
      setValidationError('Please fill in at least one complete date range with From date, To date, and a time slot.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/institute/venues/availability', { tab: activeTab, rowData, dateBlocks });
    } catch (_) { /* proceed even if API fails */ }
    setSaving(false);

    // Build a summary row for the table
    const firstBlock = dateBlocks.find(b => b.from && b.to)!;
    const firstSlot  = firstBlock.timeSlots.find(s => s.from && s.to)!;
    const newRow: AvailRow = {
      id: editRow?.id ?? Date.now(),
      roomType: firstBlock.applyTo.join(', ') || activeTab,
      roomNo:   rows.map((_, i) => String(i + 1)).join(', '),
      dateRange: `${firstBlock.from} - ${firstBlock.to}`,
      timeSlot:  `${firstSlot.from} - ${firstSlot.to}`,
    };
    onSaved(newRow);
  };

  const selSt: React.CSSProperties = { border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px 36px 12px 14px', fontSize: '14px', outline: 'none', background: '#fff', color: '#1E293B', appearance: 'none' as const, width: '100%', boxSizing: 'border-box' as const };

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
        <span style={{ cursor: 'pointer' }} onClick={onBack}>Venue Management</span>
        <ChevronRight size={12} />
        <span style={{ cursor: 'pointer' }} onClick={onBack}>View Resource Availability</span>
        <ChevronRight size={12} />
        <span style={{ color: '#1E293B' }}>{editRow ? 'Edit Availability' : 'Add Availability'}</span>
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', margin: '0 0 24px' }}>
        {editRow ? 'Edit Availability Of Resources' : 'Add Availability Of Resources'}
      </h2>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '0' }}>
        {(['Labs', 'Classroom', 'Seminar'] as TabType[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding: '10px 28px', fontSize: '14px', fontWeight: activeTab === t ? 600 : 400, color: activeTab === t ? '#1E293B' : '#94A3B8', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === t ? '#4F46E5' : 'transparent'}`, marginBottom: '-1px', cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Resource table */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '0 0 12px 12px', marginBottom: '24px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Computers Available', 'Computers Offered', 'Buffers Available', 'Buffers Offered', 'Total Computers Offered', ''].map(h => (
                <th key={h} style={{ ...hcol, fontWeight: 500, fontSize: '13px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rd = getRow(row.name);
              return (
                <tr key={row.name}>
                  <td style={col}>
                    <input value={row.name} onChange={e => setDynamicRows(dr => ({ ...dr, [activeTab]: dr[activeTab].map((r, i) => i === idx ? { ...r, name: e.target.value } : r) }))} style={{ ...inSt, maxWidth: '120px' }} />
                  </td>
                  <td style={col}>
                    <input type="number" value={row.computersAvailable} onChange={e => setDynamicRows(dr => ({ ...dr, [activeTab]: dr[activeTab].map((r, i) => i === idx ? { ...r, computersAvailable: Number(e.target.value) } : r) }))} style={{ ...inSt, maxWidth: '80px' }} />
                  </td>
                  <td style={col}><input value={rd.computersOffered} onChange={e => setRow(row.name, 'computersOffered', e.target.value)} style={{ ...inSt, maxWidth: '120px' }} /></td>
                  <td style={col}>{row.computersAvailable}</td>
                  <td style={col}><input value={rd.buffersOffered}   onChange={e => setRow(row.name, 'buffersOffered',   e.target.value)} placeholder="Label" style={{ ...inSt, maxWidth: '120px' }} /></td>
                  <td style={col}><input value={rd.totalOffered}     onChange={e => setRow(row.name, 'totalOffered',     e.target.value)} style={{ ...inSt, maxWidth: '120px' }} /></td>
                  <td style={col}>
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(row.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '2px', display: 'flex', alignItems: 'center' }}>
                        <X size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={7} style={{ padding: '10px 16px' }}>
                <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', color: '#4F46E5', fontWeight: 500 }}>
                  <Plus size={14} /> Add Row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Date range blocks */}
      {dateBlocks.map(block => (
        <div key={block.id} style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: '0 0 14px' }}>Date Range</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Apply To */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B', zIndex: 1 }}>Apply To</span>
              <div onClick={() => setApplyToOpen(applyToOpen === block.id ? null : block.id)}
                style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '11px 36px 11px 14px', fontSize: '14px', cursor: 'pointer', background: '#fff', color: block.applyTo.length ? '#1E293B' : '#94A3B8', position: 'relative', minHeight: '47px', display: 'flex', alignItems: 'center' }}>
                {block.applyTo.length ? block.applyTo.join(', ') : 'Select rooms…'}
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}>▼</span>
              </div>
              {applyToOpen === block.id && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, marginTop: '4px' }}>
                  {roomNames.map(name => (
                    <div key={name} onClick={() => toggleApplyTo(block.id, name)}
                      style={{ padding: '9px 14px', fontSize: '13px', cursor: 'pointer', background: block.applyTo.includes(name) ? '#EEF2FF' : '#fff', color: block.applyTo.includes(name) ? '#4F46E5' : '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '14px', height: '14px', border: `2px solid ${block.applyTo.includes(name) ? '#4F46E5' : '#CBD5E1'}`, borderRadius: '3px', background: block.applyTo.includes(name) ? '#4F46E5' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {block.applyTo.includes(name) && <span style={{ color: '#fff', fontSize: '9px' }}>✓</span>}
                      </div>
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* From date */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B', zIndex: 1 }}>From *</span>
              <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <input type="date" value={block.from} onChange={e => setDateBlocks(bs => bs.map(b => b.id === block.id ? { ...b, from: e.target.value } : b))}
                  style={{ border: 'none', outline: 'none', fontSize: '14px', color: block.from ? '#1E293B' : '#94A3B8', background: 'transparent', flex: 1 }} />
                <Calendar size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
              </div>
            </div>

            {/* To date */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B', zIndex: 1 }}>To *</span>
              <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <input type="date" value={block.to} onChange={e => setDateBlocks(bs => bs.map(b => b.id === block.id ? { ...b, to: e.target.value } : b))}
                  style={{ border: 'none', outline: 'none', fontSize: '14px', color: block.to ? '#1E293B' : '#94A3B8', background: 'transparent', flex: 1 }} />
                <Calendar size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
              </div>
            </div>
          </div>

          {/* Time section */}
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: '0 0 12px' }}>Time</h3>

          {block.timeSlots.filter(s => !s.confirmed).map((slot, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B', zIndex: 1 }}>From *</span>
                <select value={slot.from} onChange={e => updateTimeSlot(block.id, idx, 'from', e.target.value)} style={selSt}>
                  <option value="" />
                  {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }}>▼</span>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B', zIndex: 1 }}>To *</span>
                <select value={slot.to} onChange={e => updateTimeSlot(block.id, idx, 'to', e.target.value)} style={selSt}>
                  <option value="" />
                  {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }}>▼</span>
              </div>
              <button onClick={() => confirmTimeSlot(block.id, idx)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151', fontSize: '13px', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap', paddingTop: '8px' }}>
                <Plus size={14} color="#4F46E5" /> Add
              </button>
            </div>
          ))}

          {/* Confirmed time chips */}
          {block.timeSlots.filter(s => s.confirmed).length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
              {block.timeSlots.filter(s => s.confirmed).map((slot, ci) => (
                <span key={ci} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EEF2FF', borderRadius: '20px', padding: '7px 14px', fontSize: '13px', color: '#4F46E5', fontWeight: 500 }}>
                  {slot.from} – {slot.to}
                  <button onClick={() => removeTimeSlot(block.id, block.timeSlots.indexOf(slot))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#4F46E5', display: 'flex', alignItems: 'center' }}>
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      <button onClick={() => setDateBlocks(bs => [...bs, { id: Date.now(), applyTo: [], from: '', to: '', timeSlots: [{ from: '', to: '' }] }])}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', borderRadius: '20px', background: '#4F46E5', color: '#fff', padding: '10px 22px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginBottom: '32px' }}>
        <Plus size={15} /> Add Date Range
      </button>

      {validationError && (
        <p style={{ fontSize: '13px', color: '#EF4444', margin: '0 0 12px', background: '#FEF2F2', borderRadius: '8px', padding: '10px 14px', border: '1px solid #FECACA' }}>{validationError}</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
        <button onClick={onBack} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', background: '#fff', padding: '10px 32px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', color: '#1E293B' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving}
          style={{ border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', padding: '10px 32px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

// ── Inline edit modal ──────────────────────────────────────────────────────────
function EditModal({ row, onClose, onSave }: { row: AvailRow; onClose: () => void; onSave: (r: AvailRow) => void }) {
  const [form, setForm] = useState({ roomType: row.roomType, roomNo: row.roomNo, dateRange: row.dateRange, timeSlot: row.timeSlot });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '480px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Edit Availability</h3>
        {[
          { label: 'Room Type', key: 'roomType' },
          { label: 'Room No', key: 'roomNo' },
          { label: 'Date Range', key: 'dateRange', placeholder: 'e.g. 01/04/2025 - 30/04/2025' },
          { label: 'Time Slot', key: 'timeSlot', placeholder: 'e.g. 10:00am - 1:00pm' },
        ].map(f => (
          <div key={f.key} style={{ position: 'relative', marginBottom: '16px' }}>
            <span style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B', zIndex: 1 }}>{f.label}</span>
            <input
              value={(form as any)[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder ?? ''}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px 14px', fontSize: '14px', outline: 'none', color: '#1E293B' }}
            />
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button onClick={onClose} style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave({ ...row, ...form })} style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: '#4338CA', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function VenuesPage({ initialSubView }: { initialSubView?: 'bookings' | 'availability' }) {
  const [subView, setSubView]       = useState<'bookings' | 'availability'>(initialSubView ?? 'bookings');
  const [calMode, setCalMode]       = useState<'calendar' | 'list'>('calendar');
  const [search, setSearch]         = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAdd, setShowAdd]       = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [calMonth, setCalMonth]     = useState('Current Month');
  const [showBookingFilter, setShowBookingFilter] = useState(false);
  const [bookingRoomFilter, setBookingRoomFilter] = useState('');

  // Availability rows with pagination
  const [availRows, setAvailRows]   = useState<AvailRow[]>([]);
  const [editRow, setEditRow]       = useState<AvailRow | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [availPage, setAvailPage]   = useState(0);
  const [availTotalPages, setAvailTotalPages] = useState(0);
  const PAGE_SIZE = 12;

  const loadAvailability = useCallback((p: number) => {
    api.get('/institute/venues/availability', { params: { page: p, size: PAGE_SIZE } })
      .then(r => {
        const d = r.data?.data;
        setAvailRows((d?.content ?? []).map((v: any) => ({
          id: v.id,
          roomType: v.roomType ?? '',
          roomNo: v.roomNo ?? '',
          dateRange: v.dateFrom && v.dateTo ? `${v.dateFrom} - ${v.dateTo}` : '',
          timeSlot: v.timeFrom && v.timeTo ? `${v.timeFrom} – ${v.timeTo}` : '',
        })));
        setAvailTotalPages(d?.totalPages ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadAvailability(availPage); }, [loadAvailability, availPage]);

  const baseDate = new Date(2025, 0, 16 + weekOffset * 7);
  const weekStart = baseDate.getDate();
  const weekEnd   = weekStart + 6;
  const monthName = baseDate.toLocaleString('en', { month: 'long' });
  const year      = baseDate.getFullYear();

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this availability entry?')) return;
    await api.delete(`/institute/venues/availability/${id}`).catch(() => {});
    loadAvailability(availPage);
  };

  const handleEditOpen = (row: AvailRow) => {
    setEditRow(row);
    setShowEditModal(true);
  };

  const handleEditSave = async (updated: AvailRow) => {
    const [dateFrom, dateTo] = updated.dateRange.split(' - ');
    const [timeFrom, timeTo] = updated.timeSlot.split(' – ');
    await api.put(`/institute/venues/availability/${updated.id}`, {
      roomType: updated.roomType, roomNo: updated.roomNo,
      dateFrom: dateFrom?.trim(), dateTo: dateTo?.trim(),
      timeFrom: timeFrom?.trim(), timeTo: timeTo?.trim(),
    }).catch(() => {});
    loadAvailability(availPage);
    setShowEditModal(false);
    setEditRow(null);
  };

  const handleSaved = (_row: AvailRow) => {
    loadAvailability(0);
    setAvailPage(0);
    setShowAdd(false);
  };

  const filtered = availRows.filter(a => !search || a.roomType.toLowerCase().includes(search.toLowerCase()));

  if (showAdd) return <AddAvailabilityForm onBack={() => setShowAdd(false)} onSaved={handleSaved} />;

  return (
    <div style={{ padding: '20px 28px' }}>
      {/* Sub-nav */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '24px' }}>
        {[{ key: 'bookings', label: 'View Bookings Received' }, { key: 'availability', label: 'View Resource Availability' }].map(v => (
          <button key={v.key} onClick={() => setSubView(v.key as 'bookings' | 'availability')}
            style={{ paddingBottom: '12px', paddingRight: '28px', fontSize: '14px', fontWeight: subView === v.key ? 600 : 400, color: subView === v.key ? '#1E293B' : '#94A3B8', background: 'none', border: 'none', borderBottom: `2px solid ${subView === v.key ? '#1E293B' : 'transparent'}`, marginBottom: '-1px', cursor: 'pointer' }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ── VIEW BOOKINGS RECEIVED ──────────────────────────────────────────────── */}
      {subView === 'bookings' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setCalMode('calendar')}
                style={{ padding: '9px 20px', fontSize: '13px', fontWeight: 500, background: calMode === 'calendar' ? '#EEF2FF' : '#fff', color: calMode === 'calendar' ? '#4F46E5' : '#64748B', border: 'none', borderRight: '1px solid #E2E8F0', cursor: 'pointer' }}>
                Calendar
              </button>
              <button onClick={() => setCalMode('list')}
                style={{ padding: '9px 20px', fontSize: '13px', fontWeight: 500, background: calMode === 'list' ? '#EEF2FF' : '#fff', color: calMode === 'list' ? '#4F46E5' : '#64748B', border: 'none', cursor: 'pointer' }}>
                List
              </button>
            </div>

            {calMode === 'list' && (
              <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', border: '1px solid #E2E8F0', borderRadius: '20px', fontSize: '13px', outline: 'none', background: '#fff' }} />
              </div>
            )}

            {calMode === 'calendar' && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowMonthPicker(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', padding: '9px 16px', fontSize: '13px', color: '#1E293B', cursor: 'pointer' }}>
                  {calMonth} <ChevronDown size={14} />
                </button>
                {showMonthPicker && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '180px', maxHeight: '260px', overflowY: 'auto' }}>
                    {['Current Month', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <div key={m} onClick={() => { setCalMonth(m); setShowMonthPicker(false); }}
                        style={{ padding: '9px 14px', fontSize: '13px', cursor: 'pointer', background: calMonth === m ? '#EEF2FF' : '#fff', color: calMonth === m ? '#4F46E5' : '#1E293B', fontWeight: calMonth === m ? 600 : 400 }}>
                        {m}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ position: 'relative', marginLeft: calMode === 'list' ? '0' : 'auto' }}>
              <button onClick={() => setShowBookingFilter(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${showBookingFilter || bookingRoomFilter ? '#4F46E5' : '#E2E8F0'}`, borderRadius: '8px', background: showBookingFilter || bookingRoomFilter ? '#EEF2FF' : '#fff', padding: '9px 14px', fontSize: '13px', color: showBookingFilter || bookingRoomFilter ? '#4F46E5' : '#64748B', cursor: 'pointer' }}>
                <Filter size={13} /> Filter {bookingRoomFilter && `(${bookingRoomFilter})`}
              </button>
              {showBookingFilter && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, padding: '12px', minWidth: '180px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', margin: '0 0 8px' }}>Room Type</p>
                  {['', 'Labs', 'Classroom', 'Seminar'].map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: 'pointer', fontSize: '13px', color: '#1E293B' }}>
                      <input type="radio" name="venueFilter" checked={bookingRoomFilter === s} onChange={() => { setBookingRoomFilter(s); setShowBookingFilter(false); }} style={{ accentColor: '#4F46E5' }} />
                      {s || 'All'}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginLeft: calMode === 'list' ? 'auto' : '0' }}>
              <Plus size={14} /> Add Availability
            </button>
          </div>

          {/* Calendar view */}
          {calMode === 'calendar' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <button onClick={() => setWeekOffset(w => w - 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={15} />
                </button>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B' }}>{weekStart} – {weekEnd} {monthName} {year}</span>
                <button onClick={() => setWeekOffset(w => w + 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={15} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', fontSize: '13px' }}>
                <div style={{ borderBottom: '1px solid #F1F5F9', padding: '10px' }} />
                {DAYS_OF_WEEK.map((day, i) => (
                  <div key={day} style={{ borderBottom: '1px solid #F1F5F9', borderLeft: '1px solid #F1F5F9', padding: '10px 8px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>{day}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', marginTop: '2px' }}>{weekStart + i}</div>
                  </div>
                ))}
                {HOUR_LABELS.map((label, rowIdx) => [
                  <div key={`lbl-${rowIdx}`} style={{ borderBottom: '1px solid #F1F5F9', padding: '0 8px', height: '56px', display: 'flex', alignItems: 'flex-start', paddingTop: '6px', color: '#94A3B8', fontSize: '11px' }}>{label}</div>,
                  ...DAYS_OF_WEEK.map((_, colIdx) => (
                    <div key={`cell-${rowIdx}-${colIdx}`} style={{ borderBottom: '1px solid #F1F5F9', borderLeft: '1px solid #F1F5F9', height: '56px' }} />
                  )),
                ])}
              </div>
              {availRows.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8', fontSize: '13px' }}>No bookings to display.</div>
              )}
            </div>
          )}

          {/* List view */}
          {calMode === 'list' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Date', 'Time Slot', 'Room Type', 'Room No', 'Course Name', 'Booked Capacity'].map(h => <th key={h} style={hcol}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {availRows.length === 0 ? (
                    <tr><td colSpan={6} style={{ ...col, textAlign: 'center', color: '#94A3B8', padding: '32px' }}>No bookings received yet.</td></tr>
                  ) : availRows.map(b => (
                    <tr key={b.id}>
                      <td style={col}>{b.dateRange}</td>
                      <td style={col}>{b.timeSlot}</td>
                      <td style={col}>{b.roomType}</td>
                      <td style={col}>{b.roomNo}</td>
                      <td style={col}>—</td>
                      <td style={col}>—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── VIEW RESOURCE AVAILABILITY ─────────────────────────────────────────── */}
      {subView === 'availability' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', border: '1px solid #E2E8F0', borderRadius: '20px', fontSize: '13px', outline: 'none', background: '#fff' }} />
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', padding: '9px 14px', fontSize: '13px', color: '#64748B', cursor: 'pointer' }}>
              <Filter size={13} /> Filter
            </button>
            <button style={{ border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', padding: '9px 12px', cursor: 'pointer', color: '#64748B', display: 'flex' }}>
              <Download size={14} />
            </button>
            <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
              <Plus size={14} /> Add Availability
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Room Type', 'Room No', 'Date Range', 'Time Slot', 'Action'].map(h => <th key={h} style={hcol}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ ...col, textAlign: 'center', color: '#94A3B8', padding: '40px' }}>No availability added yet. Click <strong>+ Add Availability</strong> to get started.</td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id}>
                    <td style={col}>{a.roomType}</td>
                    <td style={col}>{a.roomNo}</td>
                    <td style={col}>{a.dateRange}</td>
                    <td style={{ ...col, color: '#E04D8A', fontWeight: 500 }}>{a.timeSlot}</td>
                    <td style={col}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => handleEditOpen(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {availTotalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '16px' }}>
              <button onClick={() => setAvailPage(p => Math.max(0, p - 1))} disabled={availPage === 0}
                style={{ padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', cursor: availPage === 0 ? 'not-allowed' : 'pointer', color: '#64748B', fontSize: '13px', display: 'flex', alignItems: 'center', opacity: availPage === 0 ? 0.5 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: availTotalPages }, (_, i) => (
                <button key={i} onClick={() => setAvailPage(i)}
                  style={{ padding: '7px 12px', border: `1px solid ${availPage === i ? '#4F46E5' : '#E2E8F0'}`, borderRadius: '8px', background: availPage === i ? '#4F46E5' : '#fff', color: availPage === i ? '#fff' : '#64748B', cursor: 'pointer', fontSize: '13px', fontWeight: availPage === i ? 600 : 400 }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setAvailPage(p => Math.min(availTotalPages - 1, p + 1))} disabled={availPage >= availTotalPages - 1}
                style={{ padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', cursor: availPage >= availTotalPages - 1 ? 'not-allowed' : 'pointer', color: '#64748B', fontSize: '13px', display: 'flex', alignItems: 'center', opacity: availPage >= availTotalPages - 1 ? 0.5 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      {showEditModal && editRow && (
        <EditModal row={editRow} onClose={() => { setShowEditModal(false); setEditRow(null); }} onSave={handleEditSave} />
      )}
    </div>
  );
}
