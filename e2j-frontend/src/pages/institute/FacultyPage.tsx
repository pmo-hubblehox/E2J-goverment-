import { useEffect, useState, useRef } from 'react';
import { Search, Filter, Download, Eye, Bold, Italic, Underline, List, AlignLeft, Trash2, Plus, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import type { Faculty, ApiResponse, PaginatedResponse } from '../../types';
import { downloadCSV } from '../../utils/csvExport';

const MOCK_FACULTY: Faculty[] = [
  { id: 1, name: 'Dr. Mrs. Manisha Y. Joshi', expertise: ['Applied Cryptography', 'Computer Networks', 'Computer Algorithms', 'Cyber Security', 'Information Security'], days: ['Mon', 'Wed', 'Fri'], mode: 'Hybrid', status: 'AVAILABLE', rating: 4.5, studentsCounselled: 18, counsellingSessions: 7 },
  { id: 2, name: 'Rajesh Kumar', expertise: ['Python', 'Data Science', 'Machine Learning'], days: ['Tue', 'Thu'], mode: 'Online', status: 'AVAILABLE', rating: 4.8, studentsCounselled: 32, counsellingSessions: 14 },
  { id: 3, name: 'Sunita Patel', expertise: ['Java', 'Spring Boot', 'Microservices'], days: ['Mon', 'Tue', 'Wed'], mode: 'Offline', status: 'UNAVAILABLE', rating: 4.7, studentsCounselled: 25, counsellingSessions: 10 },
  { id: 4, name: 'Amit Singh', expertise: ['Cloud Computing', 'AWS', 'DevOps'], days: ['Thu', 'Fri', 'Sat'], mode: 'Online', status: 'AVAILABLE', rating: 4.6, studentsCounselled: 20, counsellingSessions: 8 },
];

const EXPERTISE_OPTIONS = ['UI Designing', 'UX Designing', 'User Research', 'Market Research', 'Applied Cryptography', 'Computer Networks', 'Cyber Security', 'Python', 'Data Science', 'Machine Learning', 'Java', 'Spring Boot', 'Cloud Computing', 'AWS', 'DevOps', 'React', 'Node.js'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_OPTIONS = ['8:00 Am', '9:00 Am', '10:00 Am', '11:00 Am', '12:00 Pm', '1:00 Pm', '2:00 Pm', '3:00 Pm', '4:00 Pm', '5:00 Pm', '6:00 Pm'];
const DELIVERY_MODES = ['Online', 'Offline', 'Hybrid'];
const AVATAR_COLORS = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED'];

const col: React.CSSProperties = { padding: '14px 16px', fontSize: '13px', color: '#1E293B', borderBottom: '1px solid #F1F5F9' };
const hcol: React.CSSProperties = { padding: '10px 16px', fontSize: '12px', fontWeight: 500, color: '#64748B', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' as const };

// ── Breadcrumb ─────────────────────────────────────────────────────────────────
function Breadcrumb({ crumbs }: { crumbs: { label: string; onClick?: () => void }[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
      {crumbs.map((c, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {i > 0 && <ChevronRight size={13} style={{ color: '#94A3B8' }} />}
          {c.onClick ? (
            <button onClick={c.onClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '13px', color: '#94A3B8', fontWeight: 400 }}>{c.label}</button>
          ) : (
            <span style={{ fontSize: '13px', color: i === crumbs.length - 1 ? '#1E293B' : '#94A3B8', fontWeight: i === crumbs.length - 1 ? 600 : 400 }}>{c.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ── Expertise chip input: type to filter + add custom values ──────────────────
function ExpertiseChipInput({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const remove = (o: string) => onChange(value.filter(v => v !== o));
  const select = (o: string) => { if (!value.includes(o)) onChange([...value, o]); setInputVal(''); inputRef.current?.focus(); };
  const addNew = () => { const t = inputVal.trim(); if (t && !value.includes(t)) { onChange([...value, t]); setInputVal(''); } };
  const filtered = options.filter(o => o.toLowerCase().includes(inputVal.toLowerCase()) && !value.includes(o));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => { setOpen(true); inputRef.current?.focus(); }}
        style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '8px 12px', minHeight: '48px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', cursor: 'text', background: '#fff', position: 'relative' }}>
        <span style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>{label}</span>
        {value.map(v => (
          <span key={v} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '3px 8px', fontSize: '12px', color: '#374151' }}>
            {v}
            <button type="button" onClick={e => { e.stopPropagation(); remove(v); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94A3B8', fontSize: '14px', display: 'flex', alignItems: 'center' }}>×</button>
          </span>
        ))}
        <input ref={inputRef} value={inputVal} onChange={e => { setInputVal(e.target.value); setOpen(true); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (filtered.length > 0) select(filtered[0]); else addNew(); } if (e.key === 'Backspace' && !inputVal && value.length > 0) onChange(value.slice(0, -1)); }}
          placeholder={value.length === 0 ? 'Type to search or add...' : ''}
          style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#1E293B', background: 'transparent', minWidth: '120px', flex: 1 }} />
      </div>
      {open && (filtered.length > 0 || inputVal.trim()) && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, marginTop: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {filtered.map(o => (
            <div key={o} onMouseDown={e => { e.preventDefault(); select(o); }}
              style={{ padding: '9px 14px', fontSize: '13px', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid #CBD5E1', borderRadius: '3px', flexShrink: 0 }} />
              {o}
            </div>
          ))}
          {inputVal.trim() && !options.includes(inputVal.trim()) && (
            <div onMouseDown={e => { e.preventDefault(); addNew(); }}
              style={{ padding: '9px 14px', fontSize: '13px', cursor: 'pointer', color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '8px', borderTop: filtered.length > 0 ? '1px solid #F1F5F9' : 'none' }}>
              <Plus size={13} /> Add "{inputVal.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Plain multi-select chip (month/day pickers) ───────────────────────────────
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
            <button type="button" onClick={e => { e.stopPropagation(); toggle(v); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94A3B8', display: 'flex', alignItems: 'center', fontSize: '14px' }}>×</button>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: '#94A3B8', fontSize: '12px' }}>▼</span>
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

// ── Star rating display ───────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: '16px', color: i <= Math.floor(rating) ? '#F59E0B' : i - 0.5 <= rating ? '#F59E0B' : '#D1D5DB' }}>
          {i <= Math.floor(rating) ? '★' : i - 0.5 <= rating ? '½' : '☆'}
        </span>
      ))}
    </span>
  );
}

const MOCK_REVIEWS = [
  { id: 1, reviewer: 'Ria Sheth', category: 'Risk Assessment', rating: 4.5, date: '14 APR 2023', text: "My Main Intention Was To Receive Guidance And Insights From Someone Experienced, And This Counselling Session Truly Helped Me Gain Clarity. I'm Eager To Grow And Make Informed Decisions In My Personal And Professional Life, And I'm Thankful For Having Access To Such A Supportive Platform That Connects Individuals With The Right Counsellors." },
  { id: 2, reviewer: 'Ria Sheth', category: 'Risk Assessment', rating: 4.5, date: '14 APR 2023', text: "My Main Intention Was To Receive Guidance And Insights From Someone Experienced, And This Counselling Session Truly Helped Me Gain Clarity. I'm Eager To Grow And Make Informed Decisions In My Personal And Professional Life." },
];

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'add' | 'profile'>('list');
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [saving, setSaving] = useState(false);

  // Add form state
  const [smeName, setSmeName] = useState('');
  const [expertise, setExpertise] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [months, setMonths] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState([{ from: '', to: '' }, { from: '', to: '' }]);
  const [deliveryModes, setDeliveryModes] = useState<string[]>([]);

  useEffect(() => {
    api.get<ApiResponse<PaginatedResponse<Faculty>>>('/institute/faculty', { params: { size: 50 } })
      .then(r => setFaculty(r.data.data.content ?? []))
      .catch(() => setFaculty([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/institute/faculty', { name: smeName, expertise, bio, months, days, timeSlots, deliveryModes });
      setView('list');
    } catch { /* noop */ } finally { setSaving(false); }
  };

  const [statusFilter, setStatusFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const display = faculty.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = f.name.toLowerCase().includes(q) || f.expertise.some(e => e.toLowerCase().includes(q));
    const matchStatus = !statusFilter || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    downloadCSV('faculty.csv',
      ['Name', 'Expertise', 'Delivery Mode', 'Status', 'Rating', 'Students Counselled'],
      display.map(f => [f.name, (f.expertise ?? []).join('; '), f.mode ?? '', f.status ?? '', f.rating ?? '', f.studentsCounselled ?? ''])
    );
  };

  // ── PROFILE VIEW ─────────────────────────────────────────────────────────────
  if (view === 'profile' && selectedFaculty) {
    const f = selectedFaculty;
    return (
      <div style={{ padding: '20px 28px' }}>
        <Breadcrumb crumbs={[{ label: 'Home', onClick: () => setView('list') }, { label: 'Faculty', onClick: () => setView('list') }, { label: f.name }]} />
        {/* Profile card */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#4F46E5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, flexShrink: 0 }}>
            {f.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#4F46E5' }}>{f.name}</h2>
            <p style={{ margin: '0 0 2px', fontSize: '13px', color: '#374151' }}>Ph.D. In Computer Engineering</p>
            <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#374151' }}>14 Years Of Academic & Research Experience</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Stars rating={f.rating ?? 4.5} />
              <span style={{ fontSize: '13px', color: '#64748B' }}>{f.rating ?? 4.5}/5</span>
            </div>
            <div style={{ marginTop: '14px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', margin: '0 0 8px' }}>Expertise</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {f.expertise.map(e => (
                  <span key={e} style={{ border: '1px solid #CBD5E1', borderRadius: '20px', padding: '5px 14px', fontSize: '13px', color: '#374151' }}>{e}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 24px', textAlign: 'center', minWidth: '120px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '18px' }}>📋</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B' }}>{String(f.studentsCounselled ?? 18).padStart(2, '0')}</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Students Trained</p>
            </div>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px 24px', textAlign: 'center', minWidth: '120px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '18px' }}>📋</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B' }}>{String(f.counsellingSessions ?? 7).padStart(2, '0')}</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Trainings Conducted</p>
            </div>
          </div>
        </div>

        {/* Know Your Mentor */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 12px' }}>Know Your Mentor</h3>
          <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.8, margin: '0 0 10px' }}>
            I Am A Dedicated Academician And Cybersecurity Expert With Over 14 Years Of Experience In Teaching And Mentoring Students In Core Computer Engineering Subjects, Particularly In The Domain Of Secure Systems And Network Technologies. I Have Guided Several UG And PG Projects In Areas Such As Applied Cryptography, Ethical Hacking, And Secure Communication Protocols.
          </p>
          <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.8, margin: '0 0 10px' }}>
            My Teaching Style Emphasizes Both Conceptual Clarity And Practical Application. I Integrate Real-World Cybersecurity Challenges, Ethical Considerations, And Hands-On Labs To Build Both Technical Depth And Problem-Solving Agility In Students.
          </p>
          <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.8, margin: 0 }}>
            Passionate About Nurturing The Next Generation Of Cyber Professionals, I Strive To Instill Analytical Thinking, Professional Ethics, And A Lifelong Learning Mindset In Every Student I Mentor.
          </p>
        </div>

        {/* Languages */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 10px' }}>Languages Known</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            {['English', 'Hindi', 'Marathi'].map(l => (
              <span key={l} style={{ fontSize: '13px', color: '#374151' }}>{l}</span>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>Reviews</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
                <List size={18} />
              </button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
                <AlignLeft size={18} />
              </button>
            </div>
          </div>
          {MOCK_REVIEWS.map(r => (
            <div key={r.id} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E04D8A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
                  {r.reviewer[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{r.reviewer}</span>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94A3B8' }}>{r.category}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{r.rating}</span>
                        <Stars rating={r.rating} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>{r.date}</span>
                    </div>
                  </div>
                  <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>{r.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setView('list')} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', background: '#fff', padding: '10px 28px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Back</button>
        </div>
      </div>
    );
  }

  // ── ADD FACULTY VIEW ──────────────────────────────────────────────────────────
  if (view === 'add') {
    const inputSt: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px 36px 12px 14px', fontSize: '14px', outline: 'none', background: '#fff', color: '#1E293B', appearance: 'none' as const };

    return (
      <div style={{ padding: '24px 32px' }}>
        <Breadcrumb crumbs={[{ label: 'Home', onClick: () => setView('list') }, { label: 'Faculty', onClick: () => setView('list') }, { label: 'Add Faculty' }]} />
        {/* SME Name */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <span style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B', zIndex: 1 }}>SME Name *</span>
          <input value={smeName} onChange={e => setSmeName(e.target.value)} placeholder="Enter SME name" style={{ ...inputSt, padding: '12px 14px' }} />
        </div>

        {/* Expertise Area */}
        <div style={{ marginBottom: '20px' }}>
          <ExpertiseChipInput label="Expertise Area" options={EXPERTISE_OPTIONS} value={expertise} onChange={setExpertise} />
        </div>

        {/* Bio rich text (mock toolbar) */}
        <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', marginBottom: '24px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: '2px', padding: '8px 12px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', flexWrap: 'wrap' }}>
            {[
              { icon: <Bold size={14} />, title: 'Bold' },
              { icon: <Italic size={14} />, title: 'Italic' },
              { icon: <Underline size={14} />, title: 'Underline' },
              { icon: <span style={{ fontSize: '13px', fontWeight: 700 }}>S̶</span>, title: 'Strikethrough' },
              { icon: <span style={{ fontSize: '13px' }}>A</span>, title: 'Highlight' },
              { icon: <span style={{ fontSize: '13px' }}>/</span>, title: 'Link' },
              { icon: <List size={14} />, title: 'Ordered list' },
              { icon: <span style={{ fontSize: '13px' }}>•</span>, title: 'Bullet list' },
              { icon: <AlignLeft size={14} />, title: 'Align' },
              { icon: <span style={{ fontSize: '13px' }}>Ω</span>, title: 'Symbol' },
              { icon: <span style={{ fontSize: '11px' }}>X₂</span>, title: 'Subscript' },
              { icon: <span style={{ fontSize: '11px' }}>X²</span>, title: 'Superscript' },
            ].map((btn, i) => (
              <button key={i} title={btn.title} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {btn.icon}
              </button>
            ))}
          </div>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" rows={5}
            style={{ width: '100%', boxSizing: 'border-box', border: 'none', padding: '12px 14px', fontSize: '14px', outline: 'none', resize: 'vertical', color: '#1E293B', background: '#fff' }} />
        </div>

        {/* Availability */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>Availability</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <ChipSelect label="Month" options={MONTHS} value={months} onChange={setMonths} />
            <ChipSelect label="Day" options={DAYS} value={days} onChange={setDays} />
          </div>

          {/* Time Slot */}
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#374151', margin: '0 0 10px' }}>Time Slot</p>
          {timeSlots.map((slot, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <select value={slot.from} onChange={e => setTimeSlots(ts => ts.map((s, i) => i === idx ? { ...s, from: e.target.value } : s))}
                  style={{ ...inputSt, padding: '11px 36px 11px 14px' }}>
                  <option value="">From*</option>
                  {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }}>▼</span>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <select value={slot.to} onChange={e => setTimeSlots(ts => ts.map((s, i) => i === idx ? { ...s, to: e.target.value } : s))}
                  style={{ ...inputSt, padding: '11px 36px 11px 14px' }}>
                  <option value="">To*</option>
                  {TIME_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }}>▼</span>
              </div>
              <button onClick={() => setTimeSlots(ts => ts.filter((_, i) => i !== idx))}
                style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EEF2FF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={15} color="#4F46E5" />
              </button>
              {idx === timeSlots.length - 1 && (
                <button onClick={() => setTimeSlots(ts => [...ts, { from: '', to: '' }])}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#374151', fontSize: '13px', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  <Plus size={14} /> Add
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Delivery Mode */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>Delivery Mode</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <select value={deliveryModes[0] ?? ''} onChange={e => setDeliveryModes([e.target.value, deliveryModes[1] ?? ''])}
                style={{ ...inputSt, padding: '12px 36px 12px 14px' }}>
                <option value="">Mode*</option>
                {DELIVERY_MODES.map(m => <option key={m}>{m}</option>)}
              </select>
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }}>▼</span>
            </div>
            <div style={{ position: 'relative' }}>
              <select value={deliveryModes[1] ?? ''} onChange={e => setDeliveryModes([deliveryModes[0] ?? '', e.target.value])}
                style={{ ...inputSt, padding: '12px 36px 12px 14px' }}>
                <option value="">Platform (if Online)</option>
                <option>Google Meet</option>
                <option>Zoom</option>
                <option>MS Teams</option>
                <option>In Person</option>
              </select>
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }}>▼</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
          <button onClick={() => setView('list')} style={{ border: '1px solid #E2E8F0', borderRadius: '20px', background: '#fff', padding: '10px 28px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', padding: '10px 32px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 28px' }}>
      <Breadcrumb crumbs={[{ label: 'Home' }, { label: 'Faculty' }]} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search faculty..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 32px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFilter(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${showFilter || statusFilter ? '#3F41D1' : '#E2E8F0'}`, borderRadius: '8px', background: showFilter || statusFilter ? '#EEF2FF' : '#fff', padding: '9px 14px', fontSize: '13px', color: showFilter || statusFilter ? '#3F41D1' : '#64748B', cursor: 'pointer' }}>
            <Filter size={13} /> Filter {statusFilter && `(${statusFilter})`}
          </button>
          {showFilter && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, padding: '12px', minWidth: '180px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', margin: '0 0 8px' }}>Status</p>
              {['', 'AVAILABLE', 'UNAVAILABLE'].map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', fontSize: '13px', color: '#1E293B' }}>
                  <input type="radio" name="facFilter" checked={statusFilter === s} onChange={() => { setStatusFilter(s); setShowFilter(false); }} style={{ accentColor: '#3F41D1' }} />
                  {s || 'All'}
                </label>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleExport} style={{ border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', padding: '9px 12px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <Download size={14} /> Export
        </button>
        <button onClick={() => setView('add')} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
          <Plus size={14} /> Add Faculty
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Faculty Name', 'Expertise', 'Available Days', 'Mode', 'Status', ''].map(h => <th key={h} style={hcol}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {display.map((f, i) => (
              <tr key={f.id}>
                <td style={col}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{f.name[0]}</div>
                    <span style={{ fontWeight: 500 }}>{f.name}</span>
                  </div>
                </td>
                <td style={col}>
                  <span style={{ color: '#4F46E5', fontSize: '13px' }}>{f.expertise[0]}</span>
                  {f.expertise.length > 1 && <span style={{ color: '#64748B', fontSize: '12px' }}> +{f.expertise.length - 1}</span>}
                </td>
                <td style={{ ...col, color: '#4F46E5' }}>{f.days.join(', ')}</td>
                <td style={{ ...col, color: f.mode === 'Online' ? '#4F46E5' : f.mode === 'Hybrid' ? '#7C3AED' : '#64748B', fontWeight: 500 }}>{f.mode}</td>
                <td style={col}><span style={{ fontWeight: 700, fontSize: '13px', color: f.status === 'AVAILABLE' ? '#16A34A' : '#DC2626' }}>{f.status}</span></td>
                <td style={col}>
                  <button onClick={() => { setSelectedFaculty(f); setView('profile'); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px', display: 'flex', alignItems: 'center' }}>
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {display.length === 0 && <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>No faculty found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
