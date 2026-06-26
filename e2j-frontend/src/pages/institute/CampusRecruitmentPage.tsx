import { useState, useEffect, useRef } from 'react';
import { Search, Eye, Filter, Download, Trash2, Plus, Calendar, X } from 'lucide-react';
import api from '../../services/api';
import type { CampusRecruitment, ApiResponse, PaginatedResponse } from '../../types';
import { downloadCSV } from '../../utils/csvExport';

const MOCK: CampusRecruitment[] = [
  { id: 1, industryPartner: 'Google India', driveName: 'Campus Hiring 2025', jobRole: 'Software Engineer', programName: 'B.Tech CSE', specialization: 'AI/ML', status: 'ACCEPTED' },
  { id: 2, industryPartner: 'Amazon', driveName: 'Summer Internship', jobRole: 'Data Engineer', programName: 'B.Tech CSE', specialization: 'Data Science', status: 'INVITED' },
  { id: 3, industryPartner: 'TCS', driveName: 'Developer - Intern May 2025', jobRole: 'Developer Intern', programName: 'Computer Engineering', specialization: 'Artificial Intelligence & Data Science', status: 'RECEIVED' },
  { id: 4, industryPartner: 'Infosys', driveName: 'Mass Recruitment', jobRole: 'Associate Engineer', programName: 'B.Tech CSE', specialization: 'All', status: 'REJECTED' },
];

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  RECEIVED: { color: '#2563EB', fontWeight: 700 },
  INVITED: { color: '#D97706', fontWeight: 700 },
  ACCEPTED: { color: '#16A34A', fontWeight: 700 },
  REJECTED: { color: '#DC2626', fontWeight: 700 },
};

const INDUSTRY_PARTNERS = [
  'Tata Consultancy Services', 'Infosys', 'Wipro Technologies', 'HCL Technologies',
  'Tech Mahindra', 'Cognizant', 'Accenture India', 'IBM India',
  'Google India', 'Microsoft India', 'Amazon India', 'Flipkart',
  'Zomato', 'Swiggy', 'Paytm', 'BYJU\'S',
  'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Reliance Industries',
];

const INDUSTRY_SECTORS = ['Information Technology', 'Banking & Finance', 'Healthcare', 'Manufacturing', 'Consulting', 'E-Commerce', 'Telecom', 'Education'];
const EMPLOYEE_COUNTS = ['1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'];
const PROGRAMS = ['Computer Engineering', 'IT Engineering', 'Electronics Engineering', 'Mechanical Engineering', 'MBA', 'B.Sc Computer Science'];
const SPECIALIZATIONS = ['Artificial Intelligence & Data Science', 'Robotics', 'Cloud Computing', 'Cyber Security', 'VLSI Design', 'Full Stack Development'];
const JOB_ROLES_LIST = ['Artificial Intelligence & Data Science', 'Robotics', 'Software Engineer', 'Data Analyst', 'Cloud Engineer', 'DevOps Engineer', 'Business Analyst'];
const CITIES = ['Mumbai', 'Pune', 'Bangalore', 'Hyderabad', 'Chennai', 'Delhi', 'Ahmedabad'];
const TIME_OPTIONS = ['8:00 Am', '9:00 Am', '10:00 Am', '11:00 Am', '12:00 Pm', '1:00 Pm', '2:00 Pm', '3:00 Pm', '4:00 Pm', '5:00 Pm', '6:00 Pm'];

const col: React.CSSProperties = { padding: '13px 16px', fontSize: '13px', color: '#1E293B', borderBottom: '1px solid #F1F5F9' };
const hcol: React.CSSProperties = { padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' as const };
const selSt: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px 36px 12px 14px', fontSize: '14px', outline: 'none', background: '#fff', color: '#1E293B', appearance: 'none' as const };

// ── Multi-select chip input ───────────────────────────────────────────────────
function ChipSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '8px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', cursor: 'pointer', background: '#fff', position: 'relative' }}>
        <span style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>{label}</span>
        {value.length === 0 && <span style={{ fontSize: '13px', color: '#94A3B8' }}>Select...</span>}
        {value.map(v => (
          <span key={v} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', color: '#374151' }}>
            {v}
            <button type="button" onClick={e => { e.stopPropagation(); toggle(v); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94A3B8', fontSize: '14px', display: 'flex', alignItems: 'center' }}>×</button>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: '#94A3B8', fontSize: '12px', flexShrink: 0 }}>▼</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, marginTop: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {options.map(o => (
            <div key={o} onClick={() => toggle(o)} style={{ padding: '9px 14px', fontSize: '13px', cursor: 'pointer', background: value.includes(o) ? '#EEF2FF' : '#fff', color: value.includes(o) ? '#4F46E5' : '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', border: `2px solid ${value.includes(o) ? '#4F46E5' : '#CBD5E1'}`, borderRadius: '3px', background: value.includes(o) ? '#4F46E5' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {value.includes(o) && <span style={{ color: '#fff', fontSize: '9px' }}>✓</span>}
              </div>
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampusRecruitmentPage() {
  const [tab, setTab] = useState<'all' | 'invited' | 'received'>('all');
  const [view, setView] = useState<'list' | 'select-partner' | 'invite' | 'received-detail'>('list');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [data, setData] = useState<CampusRecruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<CampusRecruitment | null>(null);

  // Invite form state
  const [sector, setSector] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [jobLocations, setJobLocations] = useState<string[]>([]);
  const [programNames, setProgramNames] = useState<string[]>([]);
  const [areaOfSpec, setAreaOfSpec] = useState<string[]>([]);
  const [jobRoles, setJobRoles] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState([{ date: '', from: '', to: '' }, { date: '', from: '', to: '' }]);
  const [dbConfirmed, setDbConfirmed] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    setLoading(true);
    api.get('/institute/campus-invites')
      .then(r => {
        const invites: any[] = r.data?.data ?? [];
        // map industry invites to CampusRecruitment shape for the existing table
        setData(invites.map((inv: any) => ({
          id: inv.id,
          industryPartner: inv.partnerName ?? '—',
          driveName: inv.programName ?? '—',
          jobRole: inv.areaOfSpecialization ?? inv.stream ?? '—',
          programName: inv.programName ?? '—',
          specialization: inv.areaOfSpecialization ?? '—',
          status: inv.status,
          _raw: inv,
        } as any)));
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSend = async () => {
    setInviteError('');
    if (!sector) { setInviteError('Please select an Industry Sector.'); return; }
    if (programNames.length === 0) { setInviteError('Please select at least one Program.'); return; }
    if (jobRoles.length === 0) { setInviteError('Please select at least one Job Role.'); return; }
    setSaving(true);
    try {
      const res = await api.post('/institute/recruitment/invite', { sector, employeeCount, jobLocations, programNames, areaOfSpec, jobRoles, timeSlots });
      setData(prev => [res.data?.data, ...prev].filter(Boolean));
      setView('list');
    } catch (e: any) {
      setInviteError(e?.response?.data?.message ?? 'Failed to send invite. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const source = loading ? [] : data;
  const display = source.filter(d => {
    const matchTab = tab === 'all' || (tab === 'invited' && d.status === 'INVITED') || (tab === 'received' && d.status === 'RECEIVED');
    const matchSearch = d.industryPartner.toLowerCase().includes(search.toLowerCase()) || d.jobRole.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || d.status === statusFilter;
    return matchTab && matchSearch && matchStatus;
  });

  const handleExport = () => {
    downloadCSV('campus_recruitment.csv',
      ['ID', 'Industry Partner', 'Drive Name', 'Job Role', 'Program', 'Specialization', 'Status'],
      display.map(d => [d.id, d.industryPartner, d.driveName, d.jobRole, d.programName, d.specialization ?? '', d.status ?? ''])
    );
  };


  // ── REQUEST RECEIVED DETAIL ───────────────────────────────────────────────────
  const updateInviteStatus = async (id: number, status: string) => {
    await api.patch(`/institute/campus-invites/${id}/status`, { status });
    loadData();
    setView('list');
  };

  if (view === 'received-detail' && selectedDrive) {
    const raw = (selectedDrive as any)._raw ?? selectedDrive;
    return (
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => setView('list')}>Home</span>
          <span>›</span>
          <span style={{ cursor: 'pointer' }} onClick={() => setView('list')}>Campus Drive</span>
          <span>›</span>
          <span style={{ color: '#1E293B' }}>{selectedDrive.driveName}</span>
        </div>
        {/* Invite header */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>{raw.partnerName ?? selectedDrive.industryPartner}</h2>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>{raw.partnerSector ?? '—'} · Invite received {raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : ''}</p>
            </div>
            <span style={{ background: STATUS_STYLE[raw.status]?.color ? '#F1F5F9' : '#F1F5F9', color: STATUS_STYLE[raw.status]?.color ?? '#64748B', fontWeight: 700, fontSize: '12px', padding: '4px 12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>{raw.status}</span>
          </div>

          {/* Program Details */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '10px' }}>Program Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Program', value: raw.programName },
                { label: 'Stream', value: raw.stream },
                { label: 'Area of Specialization', value: raw.areaOfSpecialization },
                { label: 'NAAC Accreditation', value: raw.naacAccreditation },
                { label: 'Rating', value: raw.rating ? `${raw.rating}/5` : null },
              ].filter(f => f.value).map(f => (
                <div key={f.label} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{f.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recruitment Details */}
          {(raw.jobRoles || raw.employmentType || raw.targetDate || raw.eligibilityCriteria) && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '10px' }}>Recruitment Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {[
                  { label: 'Employment Type', value: raw.employmentType },
                  { label: 'Target Date', value: raw.targetDate },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{f.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              {raw.jobRoles && (() => {
                try {
                  const roles: {role:string;positions:number;ctc:string}[] = JSON.parse(raw.jobRoles);
                  if (!roles.length) return null;
                  return (
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            {['Job Role', 'Positions', 'CTC / Stipend'].map(h => (
                              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' as const }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {roles.map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1E293B' }}>{r.role}</td>
                              <td style={{ padding: '10px 14px', color: '#64748B' }}>{r.positions}</td>
                              <td style={{ padding: '10px 14px', color: '#64748B' }}>{r.ctc || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                } catch { return null; }
              })()}
              {raw.eligibilityCriteria && (
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Eligibility Criteria</div>
                  <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: '1.6' }}>{raw.eligibilityCriteria}</div>
                </div>
              )}
            </div>
          )}

          {/* Drive Details */}
          {(raw.driveDate || raw.driveMode || raw.venueAddress || raw.meetingLink || raw.contactPerson) && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '10px' }}>Campus Drive Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Drive Date', value: raw.driveDate },
                  { label: 'Drive Mode', value: raw.driveMode },
                  { label: 'Venue / Address', value: raw.venueAddress },
                  { label: 'Meeting Link', value: raw.meetingLink },
                  { label: 'Contact Person', value: raw.contactPerson },
                  { label: 'Contact Number', value: raw.contactNumber },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{f.label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', wordBreak: 'break-all' as const }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {raw.message && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400E', marginBottom: '6px' }}>Message from Partner</div>
              <p style={{ margin: 0, fontSize: '13px', color: '#78350F', lineHeight: '1.6' }}>{raw.message}</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <button onClick={() => setView('list')} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', background: '#fff', padding: '10px 28px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>← Back</button>
          {raw.status === 'INVITED' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => updateInviteStatus(selectedDrive.id, 'REJECTED')}
                style={{ border: '1px solid #DC2626', borderRadius: '20px', background: '#fff', color: '#DC2626', padding: '10px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Reject
              </button>
              <button onClick={() => updateInviteStatus(selectedDrive.id, 'APPROVED')}
                style={{ border: 'none', borderRadius: '20px', background: '#16A34A', color: '#fff', padding: '10px 32px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Accept
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── SELECT INDUSTRY PARTNER ───────────────────────────────────────────────────
  if (view === 'select-partner') return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8', marginBottom: '20px' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => setView('list')}>Home</span>
        <span>›</span>
        <span style={{ cursor: 'pointer' }} onClick={() => setView('list')}>Campus Drive</span>
        <span>›</span>
        <span style={{ color: '#1E293B' }}>Select Industry Partner</span>
      </div>
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '28px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Industry Partner</h2>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748B' }}>Select an industry partner to send a campus recruitment invite.</p>
        <div style={{ position: 'relative', marginBottom: '28px' }}>
          <select
            value={selectedPartner}
            onChange={e => setSelectedPartner(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' as const, border: '1px solid #CBD5E1', borderRadius: '8px', padding: '13px 36px 13px 14px', fontSize: '14px', outline: 'none', background: '#fff', color: selectedPartner ? '#1E293B' : '#94A3B8', appearance: 'none' as const }}
          >
            <option value="">Select Industry Partner *</option>
            {INDUSTRY_PARTNERS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}>▼</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={() => setView('list')} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', background: '#fff', padding: '10px 28px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', color: '#374151' }}>
            Cancel
          </button>
          <button
            onClick={() => { if (!selectedPartner) return; setView('invite'); }}
            disabled={!selectedPartner}
            style={{ border: 'none', borderRadius: '20px', background: selectedPartner ? '#4F46E5' : '#CBD5E1', color: '#fff', padding: '10px 28px', fontSize: '14px', fontWeight: 600, cursor: selectedPartner ? 'pointer' : 'default' }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );

  // ── SEND INVITE FORM ──────────────────────────────────────────────────────────
  if (view === 'invite') return (
    <div style={{ padding: '24px 32px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => setView('list')}>Home</span>
        <span>›</span>
        <span style={{ cursor: 'pointer' }} onClick={() => setView('list')}>Campus Drive</span>
        <span>›</span>
        <span style={{ cursor: 'pointer' }} onClick={() => setView('select-partner')}>Select Industry Partner</span>
        <span>›</span>
        <span style={{ color: '#1E293B' }}>{selectedPartner || 'Send Invite'}</span>
      </div>
      {selectedPartner && (
        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '10px', padding: '12px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#4F46E5', fontWeight: 600 }}>Industry Partner:</span>
          <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>{selectedPartner}</span>
        </div>
      )}
      {/* Row 1: Sector + Employee count */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <select value={sector} onChange={e => setSector(e.target.value)} style={selSt}>
            <option value="">Industry/Sector Of The IP*</option>
            {INDUSTRY_SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
          <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }}>▼</span>
        </div>
        <div style={{ position: 'relative' }}>
          <select value={employeeCount} onChange={e => setEmployeeCount(e.target.value)} style={selSt}>
            <option value="">IP Employee Count*</option>
            {EMPLOYEE_COUNTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }}>▼</span>
        </div>
      </div>

      {/* Row 2: Job Location + Program Name */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <ChipSelect label="Job Location" options={CITIES} value={jobLocations} onChange={setJobLocations} />
        <ChipSelect label="Program Name" options={PROGRAMS} value={programNames} onChange={setProgramNames} />
      </div>

      {/* Row 3: Area of Specialization + Job Roles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <ChipSelect label="Area Of Specialization" options={SPECIALIZATIONS} value={areaOfSpec} onChange={setAreaOfSpec} />
        <ChipSelect label="Job Roles" options={JOB_ROLES_LIST} value={jobRoles} onChange={setJobRoles} />
      </div>

      {/* Time Slot */}
      <div style={{ marginBottom: '6px' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', margin: '0 0 12px' }}>Time Slots</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {timeSlots.map((slot, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px' }}>
              {/* Slot number */}
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#4F46E5' }}>{idx + 1}</span>
              </div>

              {/* Date */}
              <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date</span>
                <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#fff' }}>
                  <input type="date" value={slot.date} onChange={e => setTimeSlots(ts => ts.map((s, i) => i === idx ? { ...s, date: e.target.value } : s))}
                    style={{ border: 'none', outline: 'none', fontSize: '13px', color: slot.date ? '#1E293B' : '#94A3B8', background: 'transparent', width: '100%' }} />
                  <Calendar size={14} color="#94A3B8" style={{ flexShrink: 0 }} />
                </div>
              </div>

              {/* From */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>From</span>
                <div style={{ position: 'relative' }}>
                  <select value={slot.from} onChange={e => setTimeSlots(ts => ts.map((s, i) => i === idx ? { ...s, from: e.target.value } : s))} style={{ ...selSt, paddingRight: '32px' }}>
                    <option value="">Select</option>
                    {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none', fontSize: '11px' }}>▼</span>
                </div>
              </div>

              {/* Arrow separator */}
              <div style={{ flexShrink: 0, marginTop: '18px', color: '#94A3B8', fontSize: '16px' }}>→</div>

              {/* To */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px' }}>To</span>
                <div style={{ position: 'relative' }}>
                  <select value={slot.to} onChange={e => setTimeSlots(ts => ts.map((s, i) => i === idx ? { ...s, to: e.target.value } : s))} style={{ ...selSt, paddingRight: '32px' }}>
                    <option value="">Select</option>
                    {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none', fontSize: '11px' }}>▼</span>
                </div>
              </div>

              {/* Delete */}
              <button onClick={() => setTimeSlots(ts => ts.filter((_, i) => i !== idx))}
                style={{ marginTop: '18px', width: '34px', height: '34px', borderRadius: '8px', background: '#FEE2E2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={14} color="#DC2626" />
              </button>
            </div>
          ))}
        </div>

        {/* Add slot button */}
        <button onClick={() => setTimeSlots(ts => [...ts, { date: '', from: '', to: '' }])}
          style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', background: '#EEF2FF', border: '1.5px dashed #C7D2FE', borderRadius: '10px', padding: '9px 18px', cursor: 'pointer', color: '#4F46E5', fontSize: '13px', fontWeight: 600, width: '100%', justifyContent: 'center' }}>
          <Plus size={15} /> Add Time Slot
        </button>
      </div>

      {/* DB confirmation + Upload */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div onClick={() => setDbConfirmed(v => !v)}
            style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${dbConfirmed ? '#4F46E5' : '#CBD5E1'}`, background: dbConfirmed ? '#4F46E5' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
            {dbConfirmed && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}>✓</span>}
          </div>
          <span style={{ fontSize: '13px', color: '#374151' }}>The Student Database Is Updated *</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {uploadDone && uploadedFile && (
            <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              ✓ {uploadedFile.name}
              <button onClick={() => { setUploadedFile(null); setUploadDone(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, display: 'flex' }}><X size={13} /></button>
            </span>
          )}
          <button
            onClick={() => {
              const csv = 'Name,Email,Phone,Enrollment No,Program,Specialization,Year,CGPA\n';
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'student_upload_sample.csv'; a.click();
              URL.revokeObjectURL(url);
            }}
            style={{ border: '1px solid #C7D2FE', borderRadius: '8px', background: '#EEF2FF', padding: '9px 18px', fontSize: '13px', color: '#4F46E5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={13} /> Download Sample
          </button>
          <button onClick={() => uploadInputRef.current?.click()} disabled={uploading}
            style={{ border: '1px solid #E2E8F0', borderRadius: '8px', background: '#F8FAFC', padding: '9px 18px', fontSize: '13px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={13} /> {uploading ? 'Uploading…' : 'Upload Students'}
          </button>
          <input ref={uploadInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
            onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return;
              setUploadedFile(f); setUploading(true);
              const fd = new FormData(); fd.append('file', f);
              await api.post('/institute/students/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => {});
              setUploading(false); setUploadDone(true);
            }} />
        </div>
      </div>

      {/* Footer */}
      {inviteError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#DC2626' }}>
          {inviteError}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
        <button onClick={() => { setView('list'); setInviteError(''); }} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', background: '#fff', padding: '10px 28px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSend} disabled={saving}
          style={{ border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', padding: '10px 32px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          {saving ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );

  // ── LIST VIEW ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
        <span>Home</span><span>›</span><span style={{ color: '#1E293B', fontWeight: 500 }}>Campus Drive</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', borderRadius: '20px', padding: '3px' }}>
          {(['all', 'invited', 'received'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '6px 16px', borderRadius: '16px', fontSize: '13px', fontWeight: tab === t ? 600 : 400, background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#1E293B' : '#64748B', border: 'none', cursor: 'pointer', textTransform: 'capitalize', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {t === 'all' ? 'All' : t === 'invited' ? 'Invited' : 'Received'}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 32px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFilter(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${showFilter || statusFilter ? '#3F41D1' : '#E2E8F0'}`, borderRadius: '8px', background: showFilter || statusFilter ? '#EEF2FF' : '#fff', padding: '8px 14px', fontSize: '13px', color: showFilter || statusFilter ? '#3F41D1' : '#64748B', cursor: 'pointer' }}>
            <Filter size={13} /> Filter {statusFilter && `(${statusFilter})`}
          </button>
          {showFilter && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, padding: '12px', minWidth: '180px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', margin: '0 0 8px' }}>Status</p>
              {['', 'RECEIVED', 'INVITED', 'ACCEPTED', 'REJECTED'].map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: 'pointer', fontSize: '13px', color: '#1E293B' }}>
                  <input type="radio" name="campusFilter" checked={statusFilter === s} onChange={() => { setStatusFilter(s); setShowFilter(false); }} style={{ accentColor: '#3F41D1' }} />
                  {s || 'All'}
                </label>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleExport} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '13px' }}>
          <Download size={14} /> Export
        </button>
        <button onClick={() => { setSelectedPartner(''); setView('select-partner'); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
          Send Invite
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Industry Partner', 'Recruitment Drive Name', 'Job Role', 'Program Name', 'Area Of Specialization', 'Status', ''].map(h => <th key={h} style={hcol}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {display.map(d => (
              <tr key={d.id}>
                <td style={{ ...col, fontWeight: 500 }}>{d.industryPartner}</td>
                <td style={col}>{d.driveName}</td>
                <td style={col}>{d.jobRole}</td>
                <td style={col}>{d.programName}</td>
                <td style={col}>{d.specialization}</td>
                <td style={col}><span style={STATUS_STYLE[d.status] ?? { color: '#64748B', fontWeight: 700 }}>{d.status}</span></td>
                <td style={col}>
                  <button onClick={() => { setSelectedDrive(d); setView('received-detail'); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {display.length === 0 && <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>No campus drives found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
