import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Plus, X, ChevronDown } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';

const STATUS_TABS = ['All', 'Invited', 'Received', 'Submitted', 'Approved', 'Rejected'];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  INVITED:   { color: '#7C3AED', bg: '#EDE9FE' },
  RECEIVED:  { color: '#1D4ED8', bg: '#DBEAFE' },
  SUBMITTED: { color: '#92400E', bg: '#FEF3C7' },
  APPROVED:  { color: '#15803D', bg: '#DCFCE7' },
  REJECTED:  { color: '#B91C1C', bg: '#FEE2E2' },
};

interface Invite {
  id: number; instituteName: string; programName: string; stream: string;
  areaOfSpecialization: string; naacAccreditation: string; rating: number; status: string;
}

interface InviteForm {
  instituteName: string; programName: string; stream: string;
  areaOfSpecialization: string; naacAccreditation: string; rating: string;
}

const EMPTY_FORM: InviteForm = { instituteName: '', programName: '', stream: '', areaOfSpecialization: '', naacAccreditation: '', rating: '' };

function FInput({ label, required, ...rest }: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontSize: '13px', color: TEXT, fontWeight: 500 }}>{label}{required && <span style={{ color: '#E6393E' }}> *</span>}</span>
      <input {...rest} style={{ height: '40px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0 12px', fontSize: '13px', outline: 'none' }} />
    </div>
  );
}

export default function IndustryCampusPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<InviteForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);

  const load = () => {
    api.get(`/industry-portal/campus?status=${activeTab === 'All' ? '' : activeTab.toUpperCase()}`)
      .then(res => setInvites(res.data?.data ?? []))
      .catch(() => setInvites([]));
  };

  useEffect(() => { load(); }, [activeTab]);

  const handleSubmit = async () => {
    if (!form.instituteName || !form.programName) return alert('Institute Name and Program are required.');
    setSaving(true);
    try {
      await api.post('/industry-portal/campus', { ...form, rating: form.rating ? parseInt(form.rating) : null });
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } finally { setSaving(false); }
  };

  const filtered = invites.filter(i =>
    i.instituteName.toLowerCase().includes(search.toLowerCase()) ||
    i.programName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* Tabs + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding: '7px 16px', borderRadius: '8px', border: `1px solid ${activeTab === t ? PRIMARY : BORDER}`, background: activeTab === t ? '#EEEEFF' : '#fff', color: activeTab === t ? PRIMARY : TEXT, fontSize: '13px', fontWeight: activeTab === t ? 600 : 400, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: SUB }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
            style={{ paddingLeft: '32px', paddingRight: '12px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '100px', fontSize: '13px', outline: 'none', width: '200px' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFilter(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '36px', border: `1px solid ${showFilter ? PRIMARY : BORDER}`, borderRadius: '8px', background: showFilter ? '#EEF2FF' : '#fff', fontSize: '13px', cursor: 'pointer', color: showFilter ? PRIMARY : TEXT }}>
            <Filter size={14} /> Filter
          </button>
          {showFilter && (
            <div style={{ position: 'absolute', top: '44px', right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 20, minWidth: '160px', padding: '8px 0' }}>
              {STATUS_TABS.map(t => (
                <div key={t} onClick={() => { setActiveTab(t); setShowFilter(false); }}
                  style={{ padding: '9px 16px', fontSize: '13px', cursor: 'pointer', background: activeTab === t ? '#EEF2FF' : '#fff', color: activeTab === t ? PRIMARY : TEXT, fontWeight: activeTab === t ? 600 : 400 }}>
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => navigate('/industry-portal/campus/add')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 20px', height: '36px', border: 'none', borderRadius: '100px', background: '#E91E8C', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={15} /> Request Campus Drive
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {['Institute Name', 'Program Name', 'Stream', 'Area Of Specialization', 'NAAC Accreditation', 'Rating', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: SUB, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: SUB }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: TEXT, marginBottom: '8px' }}>No invites sent yet</div>
                <div style={{ fontSize: '13px' }}>Click "+ Request Campus Drive" to invite an institute for campus recruitment.</div>
              </td></tr>
            ) : filtered.map(inv => {
              const s = STATUS_STYLE[inv.status] ?? STATUS_STYLE.INVITED;
              return (
                <tr key={inv.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: TEXT }}>{inv.instituteName}</td>
                  <td style={{ padding: '12px 16px', color: TEXT }}>{inv.programName}</td>
                  <td style={{ padding: '12px 16px', color: TEXT }}>{inv.stream || '—'}</td>
                  <td style={{ padding: '12px 16px', color: TEXT }}>{inv.areaOfSpecialization || '—'}</td>
                  <td style={{ padding: '12px 16px', color: TEXT }}>{inv.naacAccreditation || '—'}</td>
                  <td style={{ padding: '12px 16px', color: TEXT }}>{inv.rating ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: s.color, background: s.bg }}>
                      {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => setSelectedInvite(inv)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB }}><Eye size={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Request Campus Drive Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '640px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            {/* Modal header */}
            <div style={{ background: 'linear-gradient(135deg, #3F41D1 0%, #6366F1 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Request Campus Drive</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>Fill in the institute details to send an invite</p>
              </div>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Institute Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Institute Name <span style={{ color: '#E6393E' }}>*</span></label>
                  <input value={form.instituteName} onChange={e => setForm(f => ({ ...f, instituteName: e.target.value }))} placeholder="e.g. NMIMS"
                    style={{ height: '42px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '13px', outline: 'none', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
                {/* Program Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Program Name <span style={{ color: '#E6393E' }}>*</span></label>
                  <input value={form.programName} onChange={e => setForm(f => ({ ...f, programName: e.target.value }))} placeholder="e.g. Cyber Security"
                    style={{ height: '42px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '13px', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
                {/* Stream */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stream</label>
                  <input value={form.stream} onChange={e => setForm(f => ({ ...f, stream: e.target.value }))} placeholder="e.g. Technology"
                    style={{ height: '42px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '13px', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
                {/* Area of Specialization */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Area of Specialization</label>
                  <input value={form.areaOfSpecialization} onChange={e => setForm(f => ({ ...f, areaOfSpecialization: e.target.value }))} placeholder="e.g. Artificial Intelligence"
                    style={{ height: '42px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '13px', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
                {/* NAAC */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>NAAC Accreditation</label>
                  <div style={{ position: 'relative' }}>
                    <select value={form.naacAccreditation} onChange={e => setForm(f => ({ ...f, naacAccreditation: e.target.value }))}
                      style={{ width: '100%', height: '42px', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '0 36px 0 14px', fontSize: '13px', outline: 'none', appearance: 'none', background: '#fff' }}>
                      <option value="">Select Grade</option>
                      {['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C'].map(g => <option key={g}>{g}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: SUB }} />
                  </div>
                </div>
                {/* Rating */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rating (1–5)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: String(n) }))}
                        style={{ flex: 1, height: '42px', border: `1.5px solid ${form.rating === String(n) ? PRIMARY : BORDER}`, borderRadius: '8px', background: form.rating === String(n) ? '#EEEEFF' : '#fff', color: form.rating === String(n) ? PRIMARY : TEXT, fontSize: '14px', fontWeight: form.rating === String(n) ? 700 : 400, cursor: 'pointer' }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ borderTop: `1px solid ${BORDER}`, padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#FAFAFA' }}>
              <button onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}
                style={{ padding: '0 24px', height: '40px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT, fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                style={{ padding: '0 28px', height: '40px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Sending…' : 'Request Campus Drive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Detail Modal */}
      {selectedInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ background: 'linear-gradient(135deg, #3F41D1 0%, #6366F1 100%)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>{selectedInvite.instituteName}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>Invite Details</p>
              </div>
              <button onClick={() => setSelectedInvite(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: '18px' }}>×</button>
            </div>
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Program Name', value: selectedInvite.programName },
                { label: 'Stream', value: selectedInvite.stream || '—' },
                { label: 'Area of Specialization', value: selectedInvite.areaOfSpecialization || '—' },
                { label: 'NAAC Accreditation', value: selectedInvite.naacAccreditation || '—' },
                { label: 'Rating', value: selectedInvite.rating ? `${selectedInvite.rating} / 5` : '—' },
                { label: 'Status', value: selectedInvite.status },
              ].map(f => (
                <div key={f.label} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{f.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedInvite(null)} style={{ padding: '0 28px', height: '40px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
