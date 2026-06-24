import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Download, Plus, MoreVertical, Eye, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PUBLISHED:   { color: '#15803D', bg: '#DCFCE7' },
  UNPUBLISHED: { color: '#B91C1C', bg: '#FEE2E2' },
  DRAFT:       { color: '#64748B', bg: '#F1F5F9' },
};

interface Sme { id: number; smeName: string; expertiseArea: string; days: string; mode: string; locationName: string; meetingLink: string; status: string; }

function parseJson(s: string): string[] {
  try { return JSON.parse(s) || []; } catch { return []; }
}

function SmeActionMenu({ id, onDelete }: { id: number; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const actions = [
    { label: 'View',   icon: Eye,   action: () => navigate(`/industry-portal/sme/${id}`) },
    { label: 'Edit',   icon: Edit2, action: () => navigate(`/industry-portal/sme/${id}/edit`) },
    { label: 'Delete', icon: Trash2, danger: true, action: () => { if (confirm('Delete this SME?')) onDelete(); } },
  ];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: open ? '#F1F5F9' : 'none', border: `1px solid ${open ? BORDER : 'transparent'}`, borderRadius: '6px', cursor: 'pointer', padding: '4px 6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '140px', overflow: 'hidden' }}>
          {actions.map(a => (
            <button key={a.label} onClick={() => { setOpen(false); a.action(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', fontSize: '13px', color: (a as any).danger ? '#DC2626' : TEXT, cursor: 'pointer', textAlign: 'left' as const }}
              onMouseEnter={e => { e.currentTarget.style.background = (a as any).danger ? '#FEE2E2' : '#F8FAFC'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              <a.icon size={14} /> {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SmeListingPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'List' | 'Calendar'>('List');
  const [smes, setSmes] = useState<Sme[]>([]);
  const [search, setSearch] = useState('');

  const load = () => {
    api.get('/industry-portal/sme')
      .then(res => setSmes(res.data?.data ?? []))
      .catch(() => setSmes([]));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (id: number) => {
    api.delete(`/industry-portal/sme/${id}`).then(load);
  };

  const filtered = smes.filter(s => s.smeName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: '24px' }}>
      {/* Toggle + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', border: `1px solid ${BORDER}`, borderRadius: '100px', overflow: 'hidden' }}>
          {(['Calendar', 'List'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              style={{ padding: '8px 24px', background: viewMode === m ? PRIMARY : '#fff', color: viewMode === m ? '#fff' : TEXT, border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: viewMode === m ? 600 : 400 }}>
              {m}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: SUB }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
            style={{ paddingLeft: '32px', paddingRight: '12px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '100px', fontSize: '13px', outline: 'none', width: '200px' }} />
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT }}>
          <Filter size={14} /> Filter
        </button>
        <button style={{ padding: '0 14px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', color: TEXT }}>
          <Download size={14} />
        </button>
        <button onClick={() => navigate('/industry-portal/sme/add')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 20px', height: '36px', border: 'none', borderRadius: '100px', background: '#E91E8C', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Add
        </button>
      </div>

      {viewMode === 'List' ? (
        <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'visible' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', borderRadius: '12px', overflow: 'hidden', display: 'table' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['SME Name', 'Expertise', 'Days', 'Mode', 'Location', 'Link', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: SUB }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: SUB }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: TEXT, marginBottom: '8px' }}>No SMEs added yet</div>
                  <div style={{ fontSize: '13px' }}>Click "+ Add" to register a Subject Matter Expert.</div>
                </td></tr>
              ) : filtered.map(s => {
                const st = STATUS_STYLE[s.status] ?? STATUS_STYLE.DRAFT;
                const days = parseJson(s.days).join(', ') || '—';
                const exp = parseJson(s.expertiseArea).join(', ') || '—';
                return (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: TEXT }}>{s.smeName}</td>
                    <td style={{ padding: '12px 16px', color: TEXT, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp}</td>
                    <td style={{ padding: '12px 16px', color: TEXT }}>{days}</td>
                    <td style={{ padding: '12px 16px', color: TEXT }}>{s.mode || '—'}</td>
                    <td style={{ padding: '12px 16px', color: TEXT }}>{s.locationName || '--'}</td>
                    <td style={{ padding: '12px 16px', color: TEXT, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.meetingLink || '--'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: st.color, background: st.bg }}>
                        {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <SmeActionMenu id={s.id} onDelete={() => handleDelete(s.id)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}`, padding: '40px', textAlign: 'center', color: SUB }}>
          Calendar view coming soon.
        </div>
      )}

      {/* (modal removed — Add SME is now a full page at /industry-portal/sme/add) */}
      {false && (
        <div>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '680px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', my: '20px' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #3F41D1 0%, #6366F1 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Add Subject Matter Expert</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>Register an SME with availability and delivery preferences</p>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* SME Name + Expertise row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>SME Name <span style={{ color: '#E6393E' }}>*</span></label>
                  <input value={form.smeName} onChange={e => setForm(f => ({ ...f, smeName: e.target.value }))} placeholder="Full name"
                    style={{ height: '42px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '13px', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mode <span style={{ color: '#E6393E' }}>*</span></label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Online', 'Offline', 'Both'].map(m => (
                      <button key={m} type="button" onClick={() => setForm(f => ({ ...f, mode: m }))}
                        style={{ flex: 1, height: '42px', border: `1.5px solid ${form.mode === m ? PRIMARY : BORDER}`, borderRadius: '8px', background: form.mode === m ? '#EEEEFF' : '#fff', color: form.mode === m ? PRIMARY : TEXT, fontSize: '12px', fontWeight: form.mode === m ? 700 : 400, cursor: 'pointer' }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expertise Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expertise Area</label>
                <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '8px 12px', display: 'flex', flexWrap: 'wrap' as const, gap: '6px', alignItems: 'center', minHeight: '42px' }}>
                  {expertiseList.map(e => (
                    <span key={e} style={{ padding: '4px 12px', background: '#EEEEFF', borderRadius: '100px', fontSize: '12px', color: PRIMARY, display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                      {e}
                      <button onClick={() => setExpertiseList(l => l.filter(x => x !== e))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: PRIMARY, lineHeight: 1, fontSize: '14px' }}>×</button>
                    </span>
                  ))}
                  <input value={expertise} onChange={e => setExpertise(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                    placeholder={expertiseList.length === 0 ? 'Type skill and press Enter…' : 'Add more…'}
                    style={{ border: 'none', outline: 'none', fontSize: '13px', flex: 1, minWidth: '140px', color: TEXT }} />
                </div>
              </div>

              {/* Bio */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bio</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Brief description of the SME's background and expertise…" rows={3}
                  style={{ border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', color: TEXT }}
                  onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = BORDER} />
              </div>

              {/* Availability section */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${BORDER}` }}>Availability</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>From <span style={{ color: '#E6393E' }}>*</span></label>
                    <input type="date" value={form.availableFrom} onChange={e => setForm(f => ({ ...f, availableFrom: e.target.value }))}
                      style={{ height: '42px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>To <span style={{ color: '#E6393E' }}>*</span></label>
                    <input type="date" value={form.availableTo} onChange={e => setForm(f => ({ ...f, availableTo: e.target.value }))}
                      style={{ height: '42px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', width: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recur Every (Weeks)</label>
                    <input type="number" min="1" value={form.recurEvery} onChange={e => setForm(f => ({ ...f, recurEvery: e.target.value }))}
                      placeholder="e.g. 2"
                      style={{ height: '42px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', width: '100%' }} />
                  </div>
                </div>
                {/* Days */}
                <div style={{ marginTop: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Days</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' as const }}>
                    {DAY_OPTIONS.map(d => (
                      <button key={d} type="button" onClick={() => toggleDay(d)}
                        style={{ padding: '8px 14px', borderRadius: '8px', border: `1.5px solid ${selectedDays.includes(d) ? PRIMARY : BORDER}`, background: selectedDays.includes(d) ? '#EEEEFF' : '#fff', color: selectedDays.includes(d) ? PRIMARY : TEXT, fontSize: '12px', fontWeight: selectedDays.includes(d) ? 700 : 400, cursor: 'pointer', minWidth: '52px' }}>
                        {d.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '12px', paddingBottom: '8px', borderBottom: `1px solid ${BORDER}` }}>Delivery Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</label>
                    <input value={form.locationName} onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))}
                      placeholder="e.g. Mumbai / Online"
                      style={{ height: '42px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', width: '100%' }}
                      onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Meeting Link</label>
                    <input value={form.meetingLink} onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))}
                      placeholder="https://meet.google.com/..."
                      style={{ height: '42px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', width: '100%' }}
                      onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: `1px solid ${BORDER}`, padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#FAFAFA' }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: '0 24px', height: '40px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT, fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                style={{ padding: '0 28px', height: '40px', borderRadius: '100px', border: 'none', background: '#E91E8C', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Add SME'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
