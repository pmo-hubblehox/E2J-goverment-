import { useState, useRef, useEffect } from 'react';
import { INDIA_STATE_CITIES, INDIA_STATE_LIST } from '../../utils/indiaCities';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, ChevronUp, Info, Eye, Download, Trash2, Edit2, Plus, X, Search, Check } from 'lucide-react';
import api from '../../services/api';

// ─── Social SVG Icons ───────────────────────────────────────────────────────
const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
);
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="url(#ig)">
    <defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#F58529"/><stop offset="50%" stopColor="#DD2A7B"/><stop offset="100%" stopColor="#8134AF"/></linearGradient></defs>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);
const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
);
const YouTubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
);

// ─── Input styles ────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', border: '1px solid #D1D5DB', borderRadius: '8px',
  padding: '14px 12px 8px', fontSize: '13px', color: '#1E293B',
  outline: 'none', boxSizing: 'border-box', background: '#fff', fontFamily: 'Inter,sans-serif',
};
const sel: React.CSSProperties = { ...inp, appearance: 'none', paddingRight: '32px' };
const floatLbl: React.CSSProperties = {
  position: 'absolute', top: '-9px', left: '10px', background: '#fff',
  padding: '0 4px', fontSize: '11px', color: '#6B7280', fontWeight: 500, zIndex: 1,
};

const errTxt: React.CSSProperties = { fontSize: '11px', color: '#EF4444', margin: '4px 0 0' };

// ─── FloatInput ───────────────────────────────────────────────────────────────
function FI({ label, value, onChange, type = 'text', placeholder, req, maxLen, numOnly, error, onBlur, fieldId, readOnly }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; req?: boolean; maxLen?: number; numOnly?: boolean;
  error?: string; onBlur?: () => void; fieldId?: string; readOnly?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <label style={floatLbl}>{label}{req && <span style={{ color: '#EF4444' }}>*</span>}</label>
      <input
        id={fieldId} type={type} value={value}
        readOnly={readOnly}
        onChange={e => {
          if (readOnly) return;
          let v = e.target.value;
          if (numOnly) v = v.replace(/\D/g, '');
          if (maxLen !== undefined) v = v.slice(0, maxLen);
          onChange(v);
        }}
        onBlur={onBlur}
        placeholder={placeholder ?? ''}
        style={{ ...inp, borderColor: error ? '#EF4444' : '#D1D5DB', background: readOnly ? '#F8FAFC' : undefined, color: readOnly ? '#64748B' : undefined, cursor: readOnly ? 'not-allowed' : undefined }}
        inputMode={numOnly ? 'numeric' : undefined}
      />
      {error && <p style={errTxt}>{error}</p>}
    </div>
  );
}

// ─── FloatSelect ──────────────────────────────────────────────────────────────
function FS({ label, value, onChange, options, req, error, onBlur, fieldId }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; req?: boolean;
  error?: string; onBlur?: () => void; fieldId?: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <label style={floatLbl}>{label}{req && <span style={{ color: '#EF4444' }}>*</span>}</label>
      <select id={fieldId} value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur}
        style={{ ...sel, borderColor: error ? '#EF4444' : '#D1D5DB' }}>
        <option value="">- Select -</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} color="#6B7280" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      {error && <p style={errTxt}>{error}</p>}
    </div>
  );
}

// ─── PhoneField ───────────────────────────────────────────────────────────────
function PhoneField({ label, value, onChange, req }: { label: string; value: string; onChange: (v: string) => void; req?: boolean }) {
  return (
    <div style={{ position: 'relative' }}>
      <label style={floatLbl}>{label}{req && <span style={{ color: '#EF4444' }}>*</span>}</label>
      <div style={{ display: 'flex', border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '10px 8px', borderRight: '1px solid #D1D5DB', flexShrink: 0, cursor: 'pointer' }}>
          <span style={{ fontSize: '14px' }}>🇮🇳</span>
          <span style={{ fontSize: '12px', color: '#1E293B' }}>+91</span>
          <ChevronDown size={10} color="#6B7280" />
        </div>
        <span style={{ alignSelf: 'center', color: '#D1D5DB', padding: '0 2px', fontSize: '16px' }}>|</span>
        <input type="tel" value={value}
          onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); onChange(v); }}
          placeholder="00000 00000"
          style={{ flex: 1, border: 'none', padding: '12px 8px 6px', fontSize: '13px', color: '#1E293B', outline: 'none', fontFamily: 'Inter,sans-serif', background: '#fff' }} />
      </div>
    </div>
  );
}

// ─── SearchMultiSelect ────────────────────────────────────────────────────────
function SearchMultiSelect({ label, selected, onChange, allOptions, placeholder }: {
  label?: string; selected: string[]; onChange: (v: string[]) => void;
  allOptions: string[]; placeholder: string;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = allOptions.filter(o => o.toLowerCase().includes(q.toLowerCase()) && !selected.includes(o));

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {label && <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>{label}</p>}
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: '20px', padding: '6px 14px', gap: '8px', background: '#fff', cursor: 'text' }}
        onClick={() => setOpen(true)}>
        <Search size={13} color="#9CA3AF" />
        <input value={q} onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#1E293B', background: 'transparent', fontFamily: 'Inter,sans-serif', flex: 1, minWidth: '100px' }} />
        <ChevronDown size={12} color="#9CA3AF" />
      </div>

      {open && (filtered.length > 0 || (q.trim() && !selected.includes(q.trim()))) && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto' }}>
          {filtered.slice(0, 20).map(o => (
            <div key={o} onMouseDown={e => { e.preventDefault(); onChange([...selected, o]); setQ(''); }}
              style={{ padding: '10px 14px', fontSize: '13px', color: '#1E293B', cursor: 'pointer', borderBottom: '1px solid #F9FAFB' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F5F3FF')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >{o}</div>
          ))}
          {q.trim() && !selected.includes(q.trim()) && !allOptions.some(o => o.toLowerCase() === q.trim().toLowerCase()) && (
            <div onMouseDown={e => { e.preventDefault(); onChange([...selected, q.trim()]); setQ(''); }}
              style={{ padding: '10px 14px', fontSize: '13px', color: '#4F46E5', cursor: 'pointer', fontWeight: 500, borderTop: filtered.length > 0 ? '1px solid #E5E7EB' : undefined }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F5F3FF')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >+ Add "{q.trim()}"</div>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          {selected.map(t => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1.5px solid #4F46E5', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', color: '#4F46E5', fontWeight: 500, background: '#fff' }}>
              {t}
              <button onMouseDown={e => { e.preventDefault(); onChange(selected.filter(x => x !== t)); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', padding: 0, display: 'flex' }}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Accordion ────────────────────────────────────────────────────────────────
function Accordion({ title, filled, total, children, open, onToggle, showCount = true }: {
  title: string; filled: number; total: number; children: React.ReactNode;
  open: boolean; onToggle: () => void; showCount?: boolean;
}) {
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', marginBottom: '12px', background: '#fff' }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{title}</span>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid #9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Info size={10} color="#9CA3AF" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {showCount && <span style={{ fontSize: '12px', color: '#6B7280' }}>{filled}/{total} Fields filled</span>}
          {open ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
        </div>
      </button>
      {open && <div style={{ borderTop: '1px solid #F3F4F6', padding: '16px 18px 20px' }}>{children}</div>}
    </div>
  );
}

// ─── Step bar ─────────────────────────────────────────────────────────────────
const STEPS = ['Upload Resume', 'Personal Information', 'Education', 'Work Experience', 'Skills'];
function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 32px', background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
      {STEPS.map((s, i) => {
        const done = i < current; const active = i === current;
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: done || active ? '#4F46E5' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {done ? <Check size={14} color="#fff" strokeWidth={2.5} /> : <span style={{ fontSize: '13px', fontWeight: 600, color: active ? '#fff' : '#9CA3AF' }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: '11px', fontWeight: active || done ? 600 : 400, color: active || done ? '#4F46E5' : '#9CA3AF', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: '2px', background: done ? '#4F46E5' : '#E5E7EB', margin: '0 8px', marginBottom: '16px' }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Resume row ───────────────────────────────────────────────────────────────
interface Resume { id: number; name: string; date: string; primary: boolean; fileUrl?: string }
function ResumeRow({ r, onSetPrimary, onDelete }: { r: Resume; onSetPrimary: () => void; onDelete: () => void }) {
  const previewUrl = r.fileUrl ?? null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px 16px', marginBottom: '10px', background: r.primary ? '#F5F3FF' : '#fff' }}>
      <div style={{ width: '36px', height: '36px', background: '#DBEAFE', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', flexShrink: 0 }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#1D4ED8' }}>PDF</span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>{r.name}</p>
        <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF' }}>Uploaded On {r.date}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => previewUrl && window.open('http://localhost:8081' + previewUrl, '_blank')}
          title={previewUrl ? 'Preview in new tab' : 'Preview not available'}
          style={{ background: 'none', border: 'none', cursor: previewUrl ? 'pointer' : 'default', color: previewUrl ? '#3F41D1' : '#D1D5DB', padding: '4px' }}>
          <Eye size={15} />
        </button>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}><Trash2 size={15} /></button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '20px', cursor: 'pointer' }} onClick={onSetPrimary}>
        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: r.primary ? '5px solid #4F46E5' : '1.5px solid #D1D5DB', background: '#fff', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: r.primary ? '#4F46E5' : '#6B7280', fontWeight: r.primary ? 600 : 400, whiteSpace: 'nowrap' }}>
          {r.primary ? 'Primary Resume' : 'Set As Primary'}
        </span>
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
function TableHead({ cols }: { cols: string[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length - 1}, 1fr) 64px`, background: '#F9FAFB', borderRadius: '6px', padding: '8px 12px', marginBottom: '2px' }}>
      {cols.map(c => <span key={c} style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{c}</span>)}
    </div>
  );
}
function TableRow({ cells, onEdit, onDelete, locked }: { cells: string[]; onEdit: () => void; onDelete: () => void; locked?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr) 90px`, padding: '10px 12px', borderBottom: '1px solid #F3F4F6', alignItems: 'center' }}>
      {cells.map((c, i) => <span key={i} style={{ fontSize: '12px', color: '#1E293B' }}>{c}</span>)}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {locked ? (
          <span title="Set by your institution — cannot be edited" style={{ fontSize: '11px', color: '#64748B', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '2px 8px', whiteSpace: 'nowrap' }}>🔒 Institute</span>
        ) : (
          <>
            <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '2px' }}><Edit2 size={14} /></button>
            <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '2px' }}><Trash2 size={14} /></button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <div style={{ background: '#fff', borderTop: '1px solid #E5E7EB', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
        © 2026, Powered by <span style={{ color: '#4F46E5', fontWeight: 600 }}>HubbleHox</span>
      </span>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { icon: <FacebookIcon />, bg: '#fff' },
          { icon: <InstagramIcon />, bg: '#fff' },
          { icon: <LinkedInIcon />, bg: '#fff' },
          { icon: <YouTubeIcon />, bg: '#fff' },
        ].map((item, i) => (
          <div key={i} style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #E5E7EB', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {item.icon}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Data sets ────────────────────────────────────────────────────────────────
const JOB_ROLES = ['Software Engineer', 'Product Manager', 'Data Analyst', 'Data Scientist', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Business Analyst', 'UI/UX Designer', 'Machine Learning Engineer', 'Cloud Architect', 'Cybersecurity Analyst', 'QA Engineer', 'Scrum Master', 'Project Manager', 'Marketing Manager', 'Sales Executive', 'HR Manager', 'Finance Analyst', 'Content Writer', 'Graphic Designer', 'Mobile Developer', 'Network Engineer', 'Database Administrator'];
const LOCATIONS = ['Mumbai', 'Pune', 'Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Noida', 'Gurgaon', 'Remote', 'USA', 'UK', 'Australia', 'Canada', 'Singapore', 'Dubai'];
const SKILL_LIST = ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'Spring Boot', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Git', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Analysis', 'Power BI', 'Tableau', 'Excel', 'Figma', 'Photoshop', 'Network Security', 'Vulnerability Assessment', 'Penetration Testing', 'Python For Security', 'Ethical Hacking', 'Kali Linux', 'Wireshark', 'Firewall Management', 'Threat Analysis', 'Cryptography', 'Incident Response', 'Linux Administration', 'C++', 'C#', '.NET', 'PHP', 'Laravel', 'Vue.js', 'Angular', 'Flutter', 'Kotlin', 'Swift', 'REST API', 'GraphQL', 'Redis', 'Elasticsearch'];
const NATIONALITIES = ['Indian', 'American', 'British', 'Australian', 'Canadian', 'German', 'French', 'Singaporean', 'Chinese', 'Japanese', 'Other'];
const LANGUAGES_LIST = ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati', 'Punjabi', 'Malayalam', 'Urdu', 'French', 'German', 'Spanish', 'Arabic', 'Japanese', 'Mandarin'];

// ─── Month-Year Picker ─────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function MonthYearPicker({ label, value, onChange, req, allowCurrent, currentLabel = 'Currently Working' }:
  { label: string; value: string; onChange: (v: string) => void; req?: boolean; allowCurrent?: boolean; currentLabel?: string }) {
  const isCurrent = value === 'Currently Working';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 30; y--) years.push(y);

  const [selYear, setSelYear] = useState<number>(() => {
    if (!value || value === 'Currently Working') return currentYear;
    const parts = value.split('-');
    return parts.length === 2 ? parseInt(parts[1]) || currentYear : currentYear;
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (m: string, y: number) => { onChange(`${m}-${y}`); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => { if (!isCurrent) setOpen(o => !o); }}
        style={{ border: `1px solid ${open ? '#4F46E5' : '#D1D5DB'}`, borderRadius: '8px', padding: '12px 14px', cursor: isCurrent ? 'default' : 'pointer', background: isCurrent ? '#F9FAFB' : '#fff', position: 'relative' }}>
        <span style={{ position: 'absolute', top: '-9px', left: '10px', background: isCurrent ? '#F9FAFB' : '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>{label}{req && <span style={{ color: '#EF4444' }}>*</span>}</span>
        <span style={{ fontSize: '14px', color: value ? '#1E293B' : '#9CA3AF' }}>{value || `Select ${label}`}</span>
      </div>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 999, background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '12px', width: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <button onClick={() => setSelYear(y => y - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#4F46E5' }}>‹</button>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{selYear}</span>
            <button onClick={() => setSelYear(y => Math.min(y + 1, currentYear))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: selYear >= currentYear ? '#D1D5DB' : '#4F46E5' }} disabled={selYear >= currentYear}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {MONTHS.map(m => {
              const selected = value === `${m}-${selYear}`;
              return (
                <button key={m} onClick={() => pick(m, selYear)}
                  style={{ padding: '7px 4px', border: selected ? '2px solid #4F46E5' : '1px solid #E5E7EB', borderRadius: '6px', background: selected ? '#EEF2FF' : '#fff', color: selected ? '#4F46E5' : '#1E293B', fontSize: '12px', fontWeight: selected ? 600 : 400, cursor: 'pointer' }}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {allowCurrent && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', cursor: 'pointer', fontSize: '12px', color: '#6B7280' }}>
          <input type="checkbox" checked={isCurrent} onChange={e => onChange(e.target.checked ? 'Currently Working' : '')}
            style={{ accentColor: '#4F46E5', width: '13px', height: '13px' }} />
          {currentLabel}
        </label>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ProfileSetupPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [validationError, setValidationError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isAuthenticated || !user) { navigate('/'); return null; }
  const name = user.name ?? 'User';

  // ── STEP 0: Resume ──────────────────────────────────────────────────────
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [resumeParseHint, setResumeParseHint] = useState('');

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!f) return;

    // Validate file type
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setResumeError('Only PDF files are allowed for resumes.');
      return;
    }
    // Validate size — 5MB
    if (f.size > 10 * 1024 * 1024) {
      setResumeError('File is too large. Maximum allowed size is 10MB.');
      return;
    }

    setResumeError('');
    setResumeUploading(true);

    // Ensure we have a valid email — never fall back to a generic string
    const entityName = user.email?.trim();
    if (!entityName) {
      setResumeError('Unable to identify your account. Please refresh and try again.');
      setResumeUploading(false);
      return;
    }

    try {
      // Step 1: upload file to disk
      const form = new FormData();
      form.append('file', f);
      form.append('userType', 'student');
      form.append('entityName', entityName);
      form.append('docType', 'resume');
      const uploadRes = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const fileUrl = uploadRes.data?.data?.url;
      if (!fileUrl) throw new Error('Upload succeeded but no URL was returned.');

      // Step 2: save resume record to DB
      const res = await api.post('/student/profile/resumes', { fileName: f.name, fileUrl, isPrimary: true });
      const saved = res.data?.data;
      if (!saved?.id) throw new Error('Resume record was not saved correctly.');

      // Only update UI after both steps succeed
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      setResumes(p => [...p.map(r => ({ ...r, primary: false })), { id: saved.id, name: f.name, date: dateStr, primary: true, fileUrl }]);

      // Step 3: auto-parse and pre-populate profile fields (always replace, never merge)
      try {
        const parseRes = await api.post('/student/profile/resumes/parse', { fileUrl });
        const d = parseRes.data?.data;
        if (d && !d.error) {
          // Always reset all parsed fields so stale data from a previous resume is cleared
          setPi(prev => ({
            ...prev,
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            middleName: d.middleName || '',
            mobile: d.mobile || '',
            email: user.email ?? prev.email, // always locked to login email
            altEmail: d.email || '', // resume email goes to alternative email
          }));
          setSocial(prev => ({
            ...prev,
            linkedin: d.linkedin || '',
            portfolio: d.portfolio || '',
          }));
          if (d.skills?.length) setSkills(d.skills); else setSkills([]);
          if (d.education?.length) {
            setEdus(d.education.map((e: { degree: string; school?: string; major?: string; year?: string; pct?: string }, i: number) => ({
              id: Date.now() + i,
              degree: e.degree || '',
              school: e.school || '',
              major: e.major || '',
              year: e.year || '',
              pct: e.pct || '',
            })));
          } else {
            setEdus([]);
          }
          setExpYears(d.totalExpYears != null ? String(d.totalExpYears) : '');
          setExpMonths(d.totalExpMonths != null ? String(d.totalExpMonths) : '');
          if (d.expCategory) setExpCat(d.expCategory);
          setAddr(prev => ({
            ...prev,
            a1: d.addressLine1 || '',
            city: d.addressCity || '',
            state: d.addressState || '',
            pin: d.addressPin || '',
          }));
          setResumeError('');
          setResumeParseHint('✅ Profile fields pre-filled from your resume. Review and update as needed.');
        }
      } catch (parseErr: any) {
        console.warn('Resume auto-parse failed:', parseErr?.response?.data ?? parseErr?.message);
        setResumeParseHint('⚠️ Could not auto-fill from resume. Please fill in your details manually.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Upload failed. Please try again.';
      setResumeError(msg);
    } finally {
      setResumeUploading(false);
    }
  };

  // ── STEP 1: Personal Info ───────────────────────────────────────────────
  const [pi, setPi] = useState({ title: '', firstName: name.split(' ')[0] ?? '', middleName: '-', lastName: name.split(' ').slice(1).join(' ') ?? '', dob: '', gender: '', nationality: 'Indian', maritalStatus: '', physChallenged: 'No', remark: '', mobile: '', mobileAlt: '', email: user.email ?? '', altEmail: '' });
  const [piErrors, setPiErrors] = useState<Record<string, string>>({});
  const validatePiField = (field: string, value: string): string => {
    if (field === 'title') return value ? '' : 'Title is required.';
    if (field === 'firstName') return value.trim() ? '' : 'First name is required.';
    if (field === 'lastName') return value.trim() ? '' : 'Last name is required.';
    if (field === 'dob') return value ? '' : 'Date of birth is required.';
    if (field === 'gender') return value ? '' : 'Gender is required.';
    if (field === 'mobile') return value.trim() ? '' : 'Mobile number is required.';
    if (field === 'email') {
      if (!value.trim()) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
      return '';
    }
    return '';
  };
  const blurPi = (field: string) => () => {
    const value = (pi as Record<string, string>)[field] ?? '';
    setPiErrors(prev => ({ ...prev, [field]: validatePiField(field, value) }));
  };
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [addr, setAddr] = useState({ a1: '', a2: '', city: '', pin: '', state: '', country: 'India', pa1: '', pa2: '', pcity: '', ppin: '', pstate: '', pcountry: 'India', sameAsPresent: false });
  const [social, setSocial] = useState({ linkedin: '', portfolio: '', website: '' });
  const [jobRoles, setJobRoles] = useState<string[]>([]);
  const [jobLocs, setJobLocs] = useState<string[]>([]);
  const [langs, setLangs] = useState<{ lang: string; read: boolean; write: boolean; speak: boolean; native: boolean }[]>([{ lang: 'English', read: true, write: true, speak: true, native: false }]);
  const [langQ, setLangQ] = useState('');
  const [langOpen, setLangOpen] = useState(false);
  const [salary, setSalary] = useState({ annual: '', variable: '', fixed: '', expected: '', notice: '' });

  // Accordion open states
  const [accOpen, setAccOpen] = useState({ pi: true, addr: false, social: false, roles: false, locs: false, langs: false, salary: false });
  const [expandAll, setExpandAll] = useState(false);
  const toggleExpandAll = () => {
    const next = !expandAll;
    setExpandAll(next);
    setAccOpen({ pi: next, addr: next, social: next, roles: next, locs: next, langs: next, salary: next });
  };

  // Real-time field counts
  const piReqFields = [pi.title, pi.firstName, pi.lastName, pi.dob, pi.gender, pi.nationality, pi.mobile, pi.email];
  const piFilled = [pi.title, pi.firstName, pi.middleName !== '-' ? pi.middleName : '', pi.lastName, pi.dob, pi.gender, pi.nationality, pi.maritalStatus, pi.physChallenged, pi.remark, pi.mobile, pi.mobileAlt, pi.email, pi.altEmail].filter(v => v && v !== '').length;
  const addrFilled = [addr.a1, addr.city, addr.pin, addr.state, addr.country, addr.pa1, addr.pcity, addr.ppin, addr.pstate, addr.pcountry].filter(Boolean).length;
  const socialFilled = [social.linkedin, social.portfolio, social.website].filter(Boolean).length;
  const salaryFilled = Object.values(salary).filter(Boolean).length;

  // ── Load saved profile on mount ─────────────────────────────────────────
  useEffect(() => {
    api.get('/student/profile/full').then(res => {
      const d = res.data.data;
      if (!d) return;
      if (d.mobilePrimary || d.firstName) {
        setPi({
          title: d.title ?? '', firstName: d.firstName ?? '', middleName: d.middleName ?? '',
          lastName: d.lastName ?? '', dob: d.dob ?? '', gender: d.gender ?? '',
          nationality: d.nationality ?? '', maritalStatus: d.maritalStatus ?? '',
          physChallenged: d.physChallenged ?? '', remark: d.remark ?? '',
          mobile: d.mobilePrimary ?? '', mobileAlt: d.mobileAlternate ?? '',
          email: user.email ?? '', // always use login email, never overwrite
          altEmail: d.alternateEmail ?? '',
        });
      }
      if (d.presentAddress) {
        setAddr({
          a1: d.presentAddress.addressLine1 ?? '', a2: d.presentAddress.addressLine2 ?? '',
          city: d.presentAddress.city ?? '', pin: d.presentAddress.pincode ?? '',
          state: d.presentAddress.state ?? '', country: d.presentAddress.country ?? '',
          sameAsPresent: d.sameAddress ?? false,
          pa1: d.permanentAddress?.addressLine1 ?? '', pa2: d.permanentAddress?.addressLine2 ?? '',
          pcity: d.permanentAddress?.city ?? '', ppin: d.permanentAddress?.pincode ?? '',
          pstate: d.permanentAddress?.state ?? '', pcountry: d.permanentAddress?.country ?? '',
        });
      }
      if (d.linkedinUrl || d.portfolioUrl) setSocial({ linkedin: d.linkedinUrl ?? '', portfolio: d.portfolioUrl ?? '', website: d.websiteUrl ?? '' });
      if (d.preferredJobRoles?.length) setJobRoles(d.preferredJobRoles);
      if (d.preferredLocations?.length) setJobLocs(d.preferredLocations);
      if (d.preferredLanguages?.length) setLangs(d.preferredLanguages.map((l: { id: number; language: string; canRead: boolean; canWrite: boolean; canSpeak: boolean; isNative: boolean }) => ({ id: l.id, lang: l.language, read: l.canRead, write: l.canWrite, speak: l.canSpeak, native: l.isNative })));
      if (d.annualCtc != null || d.expectedCtc != null) setSalary({ annual: d.annualCtc?.toString() ?? '', variable: d.variableCtc?.toString() ?? '', fixed: d.fixedCtc?.toString() ?? '', expected: d.expectedCtc?.toString() ?? '', notice: d.noticePeriod?.toString() ?? '' });
      if (d.resumes?.length) setResumes(d.resumes.map((r: { id: number; fileName: string; uploadedAt: string; isPrimary: boolean; fileUrl?: string }) => ({ id: r.id, name: r.fileName, date: r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '', primary: r.isPrimary, fileUrl: r.fileUrl })));
      if (d.educations?.length) setEdus(d.educations.map((e: { id: number; degree: string; schoolUniversity: string; majorSpecialization: string; yearOfPassing: string; percentageCgpa: string; locked: boolean }) => ({ id: e.id, degree: e.degree, school: e.schoolUniversity, major: e.majorSpecialization, year: e.yearOfPassing, pct: e.percentageCgpa, locked: e.locked })));
      if (d.certifications?.length) setCerts(d.certifications.map((c: { id: number; certificationId: string; certificationName: string; awardingInstitute: string; validTill: string; fileUrl: string }) => ({ id: c.id, certId: c.certificationId ?? '', name: c.certificationName, institute: c.awardingInstitute, valid: c.validTill ?? '', file: c.fileUrl ?? '' })));
      if (d.workExperiences?.length) setWorks(d.workExperiences.map((w: { id: number; companyName: string; employmentType: string; location: string; locationType: string; fromDate: string; toDate: string }) => ({ id: w.id, company: w.companyName, type: w.employmentType, location: w.location, locType: w.locationType, from: w.fromDate, to: w.toDate })));
      if (d.experienceCategory) { setExpCat(d.experienceCategory); setExpYears(d.totalExpYears?.toString() ?? ''); setExpMonths(d.totalExpMonths?.toString() ?? ''); }
      if (d.skills?.length) setSkills(d.skills);
    }).catch(() => { /* new user, no profile yet */ });
  }, []);

  // ── STEP 2: Education ───────────────────────────────────────────────────
  const [eduTab, setEduTab] = useState<'education' | 'cert'>('education');
  const [edus, setEdus] = useState<{ id: number; degree: string; school: string; major: string; year: string; pct: string; locked?: boolean }[]>([]);
  const BLANK_EDU = () => ({ id: Date.now(), degree: '', school: '', major: '', year: '', pct: '', locked: false });
  const [editingEdu, setEditingEdu] = useState<ReturnType<typeof BLANK_EDU> | null>(null);
  const [certs, setCerts] = useState<{ id: number; certId: string; name: string; institute: string; valid: string; file: string }[]>([]);
  const BLANK_CERT = () => ({ id: Date.now(), certId: '', name: '', institute: '', valid: '', file: '' });
  const [editingCert, setEditingCert] = useState<ReturnType<typeof BLANK_CERT> | null>(null);

  // ── STEP 3: Work Experience ─────────────────────────────────────────────
  const [expCat, setExpCat] = useState('');
  const [expYears, setExpYears] = useState('');
  const [expMonths, setExpMonths] = useState('');
  const [works, setWorks] = useState<{ id: number; company: string; type: string; location: string; locType: string; from: string; to: string }[]>([]);
  const BLANK_WORK = () => ({ id: Date.now(), company: '', type: '', location: '', locType: '', from: '', to: '' });
  const [editingWork, setEditingWork] = useState<ReturnType<typeof BLANK_WORK> | null>(null);

  // ── STEP 4: Skills ──────────────────────────────────────────────────────
  const [skills, setSkills] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────
  const validateStep = (): string => {
    if (step === 0 && resumes.length === 0) return 'Please upload at least one resume to continue.';
    if (step === 1) {
      if (!pi.title) return 'Please select your Title.';
      if (!pi.firstName.trim()) return 'Please enter your First Name.';
      if (!pi.lastName.trim()) return 'Please enter your Last Name.';
      if (!pi.dob) return 'Please enter your Date of Birth.';
      if (!pi.gender) return 'Please select your Gender.';
      if (!pi.nationality) return 'Please select your Nationality.';
      if (!pi.mobile.trim()) return 'Please enter your Primary Mobile Number.';
      // email is locked to login ID — no validation needed
    }
    if (step === 2 && edus.length === 0) return 'Please add at least one Education entry.';
    if (step === 3) {
      if (!expCat) return 'Please select Experience Category.';
      if (expCat === 'Experienced' || expCat === 'Internship') {
        if (!expYears) return 'Please select Total Experience (Years).';
        if (!expMonths) return 'Please select Total Experience (Months).';
        if (works.length === 0) return `Please add at least one work experience entry for "${expCat}" category.`;
      }
    }
    if (step === 4) {
      if (skills.length === 0) return 'Please add at least one skill.';
      if (!confirmed) return 'Please confirm that the information provided is true.';
    }
    return '';
  };

  // ── Per-step API save ───────────────────────────────────────────────────
  const saveStep = async (): Promise<void> => {
    if (step === 0) {
      // Resumes already persisted individually via addResume on upload
      return;
    }
    if (step === 1) {
      await api.put('/student/profile/personal', {
        title: pi.title, firstName: pi.firstName, middleName: pi.middleName,
        lastName: pi.lastName, dob: pi.dob, gender: pi.gender,
        nationality: pi.nationality, maritalStatus: pi.maritalStatus,
        physChallenged: pi.physChallenged, remark: pi.remark,
        mobilePrimary: pi.mobile, mobileAlternate: pi.mobileAlt, email: pi.email, alternateEmail: pi.altEmail || null,
      });
      await api.put('/student/profile/addresses', {
        presentAddress: { addressLine1: addr.a1, addressLine2: addr.a2, city: addr.city, pincode: addr.pin, state: addr.state, country: addr.country },
        permanentAddress: { addressLine1: addr.pa1, addressLine2: addr.pa2, city: addr.pcity, pincode: addr.ppin, state: addr.pstate, country: addr.pcountry },
        sameAddress: addr.sameAsPresent,
      });
      await api.put('/student/profile/social', { linkedinUrl: social.linkedin, portfolioUrl: social.portfolio, websiteUrl: social.website });
      await api.put('/student/profile/preferences', { preferredJobRoles: jobRoles, preferredLocations: jobLocs });
      await api.put('/student/profile/languages', langs.map(l => ({ language: l.lang, canRead: l.read, canWrite: l.write, canSpeak: l.speak, isNative: l.native })));
      await api.put('/student/profile/salary', { annualCtc: salary.annual ? Number(salary.annual) : null, variableCtc: salary.variable ? Number(salary.variable) : null, fixedCtc: salary.fixed ? Number(salary.fixed) : null, expectedCtc: salary.expected ? Number(salary.expected) : null, noticePeriod: salary.notice ? Number(salary.notice) : null });
      return;
    }
    if (step === 2) {
      // Education and certifications are saved per-entry already (via Save button in form)
      return;
    }
    if (step === 3) {
      await api.put('/student/profile/experience-summary', { experienceCategory: expCat, totalExpYears: Number(expYears), totalExpMonths: Number(expMonths) });
      return;
    }
    if (step === 4) {
      await api.put('/student/profile/skills', { skills });
      await api.post('/student/profile/complete');
    }
  };

  const handleNext = async () => {
    const err = validateStep();
    if (err) {
      setValidationError(err);
      if (step === 1) {
        const piFields = ['title', 'firstName', 'lastName', 'dob', 'gender', 'mobile', 'email'];
        const errs: Record<string, string> = {};
        for (const f of piFields) {
          const v = (pi as Record<string, string>)[f] ?? '';
          errs[f] = validatePiField(f, v);
        }
        setPiErrors(errs);
        const first = piFields.find(f => errs[f]);
        if (first) setTimeout(() => document.getElementById(`pi-${first}`)?.focus(), 50);
      }
      return;
    }
    setValidationError('');
    setIsSaving(true);
    try {
      await saveStep();
      if (step < 4) setStep(s => s + 1);
      else { localStorage.setItem('profileCompleted', '1'); navigate('/student'); }
    } catch {
      setValidationError('Failed to save. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };
  const handleBack = () => { setValidationError(''); if (step > 0) setStep(s => s - 1); else navigate('/student'); };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '16px 32px', display: 'flex', alignItems: 'center' }}>
        <img src="/logo-full.png.png" alt="HubbleHox" style={{ height: '48px', objectFit: 'contain' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>Welcome {name}</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>
            Let's Get Started With Building Your Profile. Complete Each Step To Help Us Match You With The Best Opportunities
          </p>
        </div>
        <div style={{ width: '180px' }} />
      </div>

      {/* Step bar */}
      <StepBar current={step} />

      {/* Content */}
      <div style={{ flex: 1, maxWidth: '900px', width: '100%', margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* Validation error */}
        {validationError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#DC2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <X size={14} />
            {validationError}
          </div>
        )}

        {/* ── STEP 0: Upload Resume ── */}
        {step === 0 && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px 24px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>Upload Resume</h2>

            {resumeError && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>⚠️</span>
                <span style={{ fontSize: '13px', color: '#DC2626', lineHeight: 1.5 }}>{resumeError}</span>
              </div>
            )}
            {resumeParseHint && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#15803D', lineHeight: 1.5 }}>{resumeParseHint}</span>
                <button onClick={() => setResumeParseHint('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#15803D', flexShrink: 0 }}><X size={14} /></button>
              </div>
            )}

            {resumeUploading ? (
              <div style={{ border: '1.5px dashed #C7D2FE', borderRadius: '8px', padding: '48px', textAlign: 'center', marginBottom: '16px', background: '#EEF2FF' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#4F46E5', fontWeight: 500 }}>⏳ Uploading your resume…</p>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#818CF8' }}>Please wait, do not close this page</p>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()} style={{ border: '1.5px dashed #D1D5DB', borderRadius: '8px', padding: '48px', textAlign: 'center', cursor: 'pointer', marginBottom: '16px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#4F46E5')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#D1D5DB')}>
                <p style={{ margin: 0, fontSize: '14px', color: '#1E293B' }}>Drag Your File Here Or <span style={{ color: '#4F46E5', fontWeight: 600 }}>Browse File</span></p>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9CA3AF' }}>PDF only · Max 10MB</p>
                <input ref={fileRef} type="file" accept=".pdf" onChange={handleResumeUpload} style={{ display: 'none' }} />
              </div>
            )}

            {resumes.map(r => (
              <ResumeRow key={r.id} r={r}
                onSetPrimary={() => setResumes(p => p.map(x => ({ ...x, primary: x.id === r.id })))}
                onDelete={async () => {
                  try { await api.delete(`/student/profile/resumes/${r.id}`); } catch { /* continue */ }
                  setResumes(p => {
                    const remaining = p.filter(x => x.id !== r.id);
                    // Clear all parsed fields when ALL resumes are removed
                    if (remaining.length === 0) {
                      setPi(prev => ({ ...prev, firstName: '', lastName: '', middleName: '', mobile: '', altEmail: '' }));
                      setSocial(prev => ({ ...prev, linkedin: '', portfolio: '' }));
                      setSkills([]);
                      setEdus([]);
                      setExpYears(''); setExpMonths('');
                      setAddr(prev => ({ ...prev, a1: '', city: '', state: '', pin: '' }));
                      setResumeParseHint('');
                    }
                    return remaining;
                  });
                }} />
            ))}
          </div>
        )}

        {/* ── STEP 1: Personal Information ── */}
        {step === 1 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Add All Data (0/7)</span>
              <button onClick={toggleExpandAll} style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: '6px', color: '#4F46E5', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '6px 12px' }}>
                {expandAll ? 'Collapse All' : 'Expand All Accordions'}
              </button>
            </div>

            {/* Personal Information */}
            <Accordion title="Personal Information" filled={piFilled} total={13} open={accOpen.pi} onToggle={() => setAccOpen(p => ({ ...p, pi: !p.pi }))}>
              <div style={{ display: 'flex', gap: '20px', paddingTop: '8px' }}>
                <div style={{ width: '110px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontWeight: 500, textAlign: 'center' }}>Add Profile Photo</p>
                  <div style={{ width: '90px', height: '90px', borderRadius: '8px', border: '1.5px dashed #D1D5DB', background: '#F9FAFB', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>}
                  </div>
                  <label style={{ padding: '6px 18px', border: '1.5px solid #4F46E5', borderRadius: '20px', fontSize: '11px', color: '#4F46E5', cursor: 'pointer', fontWeight: 500 }}>
                    Upload
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) setPhotoUrl(URL.createObjectURL(f)); }} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FS label="Title" value={pi.title} onChange={v => { setPi(p => ({ ...p, title: v })); setPiErrors(e => ({ ...e, title: '' })); }} options={['Mr.', 'Miss', 'Ms.', 'Mrs.', 'Dr.']} req error={piErrors.title} onBlur={blurPi('title')} fieldId="pi-title" />
                  <FI label="First Name" value={pi.firstName} onChange={v => { setPi(p => ({ ...p, firstName: v })); setPiErrors(e => ({ ...e, firstName: '' })); }} req error={piErrors.firstName} onBlur={blurPi('firstName')} fieldId="pi-firstName" />
                  <FI label="Middle Name" value={pi.middleName} onChange={v => setPi(p => ({ ...p, middleName: v }))} />
                  <FI label="Last Name" value={pi.lastName} onChange={v => { setPi(p => ({ ...p, lastName: v })); setPiErrors(e => ({ ...e, lastName: '' })); }} req error={piErrors.lastName} onBlur={blurPi('lastName')} fieldId="pi-lastName" />
                  <FI label="DOB" value={pi.dob} onChange={v => { setPi(p => ({ ...p, dob: v })); setPiErrors(e => ({ ...e, dob: '' })); }} type="date" req error={piErrors.dob} onBlur={blurPi('dob')} fieldId="pi-dob" />
                  <FS label="Candidate Gender" value={pi.gender} onChange={v => { setPi(p => ({ ...p, gender: v })); setPiErrors(e => ({ ...e, gender: '' })); }} options={['Male', 'Female', 'Other', 'Prefer not to say']} req error={piErrors.gender} onBlur={blurPi('gender')} fieldId="pi-gender" />
                  <FS label="Nationality" value={pi.nationality} onChange={v => setPi(p => ({ ...p, nationality: v }))} options={NATIONALITIES} req />
                  <FS label="Marital Status" value={pi.maritalStatus} onChange={v => setPi(p => ({ ...p, maritalStatus: v }))} options={['Unmarried', 'Married', 'Divorced', 'Widowed']} />
                  <FS label="Is Physically Challenged" value={pi.physChallenged} onChange={v => setPi(p => ({ ...p, physChallenged: v }))} options={['No', 'Yes']} />
                  <FI label="Remark" value={pi.remark} onChange={v => setPi(p => ({ ...p, remark: v }))} placeholder="Enter Remark" />
                  <PhoneField label="Mobile Number (Primary)" value={pi.mobile} onChange={v => { setPi(p => ({ ...p, mobile: v })); setPiErrors(e => ({ ...e, mobile: '' })); }} req />
                  <PhoneField label="Mobile Number (Alternate)" value={pi.mobileAlt} onChange={v => setPi(p => ({ ...p, mobileAlt: v }))} />
                  <div>
                    <FI label="Email (Login ID)" value={pi.email} onChange={() => {}} type="email" req fieldId="pi-email" readOnly />
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94A3B8' }}>Set by your institution — cannot be changed</p>
                  </div>
                  <FI label="Alternative Email" value={pi.altEmail} onChange={v => setPi(p => ({ ...p, altEmail: v }))} type="email" placeholder="e.g. personal@gmail.com" />
                </div>
              </div>
            </Accordion>

            {/* Addresses */}
            <Accordion title="Addresses" filled={addrFilled} total={12} open={accOpen.addr} onToggle={() => setAccOpen(p => ({ ...p, addr: !p.addr }))}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Present Address</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <FI label="Address 1" value={addr.a1} onChange={v => setAddr(p => ({ ...p, a1: v }))} />
                <FI label="Address 2" value={addr.a2} onChange={v => setAddr(p => ({ ...p, a2: v }))} />
                <FS label="State" value={addr.state} onChange={v => setAddr(p => ({ ...p, state: v, city: '' }))} options={INDIA_STATE_LIST} req />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <FI label="Pincode" value={addr.pin} onChange={v => setAddr(p => ({ ...p, pin: v }))} req numOnly maxLen={6} />
                <FS label="City" value={addr.city} onChange={v => setAddr(p => ({ ...p, city: v }))} options={addr.state && INDIA_STATE_CITIES[addr.state] ? INDIA_STATE_CITIES[addr.state] : []} req />
                <FS label="Country" value={addr.country} onChange={v => setAddr(p => ({ ...p, country: v }))} options={['India', 'USA', 'UK', 'Australia', 'Canada']} req />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Permanent Address</p>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#6B7280' }}>
                  <input type="checkbox" checked={addr.sameAsPresent} onChange={e => {
                    const v = e.target.checked;
                    setAddr(p => ({ ...p, sameAsPresent: v, ...(v ? { pa1: p.a1, pa2: p.a2, pcity: p.city, ppin: p.pin, pstate: p.state, pcountry: p.country } : {}) }));
                  }} style={{ accentColor: '#4F46E5', width: '14px', height: '14px' }} />
                  Same As Present Address
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <FI label="Address 1" value={addr.pa1} onChange={v => setAddr(p => ({ ...p, pa1: v }))} />
                <FI label="Address 2" value={addr.pa2} onChange={v => setAddr(p => ({ ...p, pa2: v }))} />
                <FS label="State" value={addr.pstate} onChange={v => setAddr(p => ({ ...p, pstate: v, pcity: '' }))} options={INDIA_STATE_LIST} req />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <FI label="Pincode" value={addr.ppin} onChange={v => setAddr(p => ({ ...p, ppin: v }))} req numOnly maxLen={6} />
                <FS label="City" value={addr.pcity} onChange={v => setAddr(p => ({ ...p, pcity: v }))} options={addr.pstate && INDIA_STATE_CITIES[addr.pstate] ? INDIA_STATE_CITIES[addr.pstate] : []} req />
                <FS label="Country" value={addr.pcountry} onChange={v => setAddr(p => ({ ...p, pcountry: v }))} options={['India', 'USA', 'UK', 'Australia', 'Canada']} req />
              </div>
            </Accordion>

            {/* Social Media */}
            <Accordion title="Social Media" filled={socialFilled} total={3} open={accOpen.social} onToggle={() => setAccOpen(p => ({ ...p, social: !p.social }))}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Social Media Links</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <FI label="LinkedIn Url" value={social.linkedin} onChange={v => setSocial(p => ({ ...p, linkedin: v }))} placeholder="https://linkedin.com/in/..." />
                <FI label="Portfolio Url" value={social.portfolio} onChange={v => setSocial(p => ({ ...p, portfolio: v }))} placeholder="https://..." />
                <FI label="Website Url" value={social.website} onChange={v => setSocial(p => ({ ...p, website: v }))} placeholder="https://..." />
              </div>
            </Accordion>

            {/* Preferred Job Roles */}
            <Accordion title="Preferred Job Roles" filled={jobRoles.length > 0 ? 1 : 0} total={1} open={accOpen.roles} onToggle={() => setAccOpen(p => ({ ...p, roles: !p.roles }))}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <SearchMultiSelect selected={jobRoles} onChange={setJobRoles} allOptions={JOB_ROLES} placeholder="Search Job Role" />
                </div>
                <button onClick={() => setJobRoles([])} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '8px', flexShrink: 0 }}>Reset</button>
              </div>
            </Accordion>

            {/* Preferred Job Location */}
            <Accordion title="Preferred Job Location" filled={jobLocs.length > 0 ? 1 : 0} total={1} open={accOpen.locs} onToggle={() => setAccOpen(p => ({ ...p, locs: !p.locs }))}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <SearchMultiSelect selected={jobLocs} onChange={setJobLocs} allOptions={LOCATIONS} placeholder="Search Job Location" />
                </div>
                <button onClick={() => setJobLocs([])} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginTop: '8px', flexShrink: 0 }}>Reset</button>
              </div>
            </Accordion>

            {/* Preferred Languages */}
            <Accordion title="Preferred Languages" filled={langs.length > 0 ? 1 : 0} total={1} open={accOpen.langs} onToggle={() => setAccOpen(p => ({ ...p, langs: !p.langs }))}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: '20px', padding: '6px 12px', gap: '6px', background: '#fff', cursor: 'text' }}
                    onClick={() => setLangOpen(true)}>
                    <Search size={13} color="#9CA3AF" />
                    <input value={langQ} onChange={e => { setLangQ(e.target.value); setLangOpen(true); }} onFocus={() => setLangOpen(true)}
                      placeholder="Search Language"
                      style={{ border: 'none', outline: 'none', fontSize: '13px', background: 'transparent', fontFamily: 'Inter,sans-serif', width: '130px' }} />
                    <ChevronDown size={12} color="#9CA3AF" />
                  </div>
                  {langOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, width: '200px', maxHeight: '180px', overflowY: 'auto' }}>
                      {LANGUAGES_LIST.filter(l => l.toLowerCase().includes(langQ.toLowerCase()) && !langs.find(x => x.lang === l)).map(l => (
                        <div key={l} onMouseDown={e => { e.preventDefault(); setLangs(p => [...p, { lang: l, read: false, write: false, speak: false, native: false }]); setLangQ(''); setLangOpen(false); }}
                          style={{ padding: '9px 14px', fontSize: '13px', color: '#1E293B', cursor: 'pointer', borderBottom: '1px solid #F9FAFB' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F5F3FF')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>{l}</div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setLangs([])} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>Reset</button>
              </div>
              {langs.map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
                  <span style={{ width: '80px', fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>{l.lang}</span>
                  {(['read', 'write', 'speak', 'native'] as const).map(k => (
                    <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px', color: '#1E293B' }}>
                      <input type="checkbox" checked={l[k]} onChange={e => setLangs(p => p.map((x, xi) => xi === i ? { ...x, [k]: e.target.checked } : x))} style={{ accentColor: '#4F46E5', width: '15px', height: '15px' }} />
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                    </label>
                  ))}
                  <button onClick={() => setLangs(p => p.filter((_, xi) => xi !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', marginLeft: 'auto', padding: '2px' }}><Trash2 size={14} /></button>
                </div>
              ))}
            </Accordion>

            {/* Salary Expectations */}
            <Accordion title="Salary Expectations" filled={salaryFilled} total={5} open={accOpen.salary} onToggle={() => setAccOpen(p => ({ ...p, salary: !p.salary }))}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Current Salary</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div><FI label="Annual CTC" value={salary.annual} onChange={v => setSalary(p => ({ ...p, annual: v }))} numOnly /><p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9CA3AF' }}>Current CTC In Lacs For Eg : 8,00,000</p></div>
                <div><FI label="Variable CTC" value={salary.variable} onChange={v => setSalary(p => ({ ...p, variable: v }))} numOnly /><p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9CA3AF' }}>Variable CTC In Lacs For Eg : 8,00,000</p></div>
                <div><FI label="Fixed CTC" value={salary.fixed} onChange={v => setSalary(p => ({ ...p, fixed: v }))} numOnly /><p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9CA3AF' }}>Salary In Lacs For Eg : 8,00,000</p></div>
                <div><FI label="Expected CTC" value={salary.expected} onChange={v => setSalary(p => ({ ...p, expected: v }))} numOnly /><p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9CA3AF' }}>Expected CTC In Lacs For Eg : 8,00,000</p></div>
              </div>
              <div style={{ marginTop: '14px', maxWidth: '50%' }}>
                <FI label="Notice Period" value={salary.notice} onChange={v => setSalary(p => ({ ...p, notice: v }))} numOnly />
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9CA3AF' }}>Notice Period In Days For Eg 90 Days</p>
              </div>
            </Accordion>
          </>
        )}

        {/* ── STEP 2: Education ── */}
        {step === 2 && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px 24px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {(['education', 'cert'] as const).map(t => (
                <button key={t} onClick={() => { setEduTab(t); setEditingEdu(null); setEditingCert(null); }}
                  style={{ padding: '8px 18px', border: `1.5px solid ${eduTab === t ? '#4F46E5' : '#E5E7EB'}`, borderRadius: '6px', background: '#fff', color: eduTab === t ? '#4F46E5' : '#6B7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {t === 'education' ? 'Education Details' : 'Professional Certification'}
                </button>
              ))}
            </div>

            {/* Education Details */}
            {eduTab === 'education' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                  <button onClick={() => setEditingEdu(BLANK_EDU())}
                    style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add Another Education
                  </button>
                </div>

                {/* Inline add/edit form — never show for locked entries */}
                {editingEdu && !editingEdu.locked && (
                  <div style={{ background: '#F5F3FF', border: '1.5px solid #C7D2FE', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#4F46E5' }}>
                      {edus.find(e => e.id === editingEdu.id) ? 'Edit Education' : 'Add Education'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <FI label="Degree / Qualification" value={editingEdu.degree} onChange={v => setEditingEdu(p => p && ({ ...p, degree: v }))} req />
                      <FI label="School / University / College" value={editingEdu.school} onChange={v => setEditingEdu(p => p && ({ ...p, school: v }))} req />
                      <FI label="Major / Subject / Specialization" value={editingEdu.major} onChange={v => setEditingEdu(p => p && ({ ...p, major: v }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <FS label="Year Of Passing" value={editingEdu.year} onChange={v => setEditingEdu(p => p && ({ ...p, year: v }))}
                        options={['', ...Array.from({ length: new Date().getFullYear() + 4 - 1960 + 1 }, (_, i) => String(new Date().getFullYear() + 4 - i))]} />
                      <FI label="Percentage / CGPA (Integer)" value={editingEdu.pct} onChange={v => setEditingEdu(p => p && ({ ...p, pct: v.replace(/[^0-9]/g, '') }))} placeholder="e.g. 85" numOnly />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingEdu(null)}
                        style={{ padding: '8px 20px', border: '1.5px solid #D1D5DB', borderRadius: '20px', background: '#fff', color: '#374151', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={async () => {
                        if (!editingEdu.degree.trim() || !editingEdu.school.trim()) return;
                        const isEdit = edus.some(e => e.id === editingEdu.id);
                        try {
                          const payload = { degree: editingEdu.degree, schoolUniversity: editingEdu.school, majorSpecialization: editingEdu.major, yearOfPassing: editingEdu.year, percentageCgpa: editingEdu.pct };
                          const res = isEdit
                            ? await api.put(`/student/profile/educations/${editingEdu.id}`, payload)
                            : await api.post('/student/profile/educations', payload);
                          const saved = res.data.data;
                          const mapped = { id: saved.id, degree: saved.degree, school: saved.schoolUniversity, major: saved.majorSpecialization, year: saved.yearOfPassing, pct: saved.percentageCgpa, locked: saved.locked };
                          setEdus(p => isEdit ? p.map(e => e.id === editingEdu.id ? mapped : e) : [...p, mapped]);
                        } catch { setEdus(p => isEdit ? p.map(e => e.id === editingEdu.id ? editingEdu : e) : [...p, editingEdu]); }
                        setEditingEdu(null);
                      }} style={{ padding: '8px 20px', border: 'none', borderRadius: '20px', background: '#4F46E5', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    </div>
                  </div>
                )}

                <TableHead cols={['Degree/Qualification', 'School/University', 'Major/Specialization', 'Year Of Passing', 'Percentage/CGPA', 'Action']} />
                {edus.map(e => (
                  <TableRow key={e.id} cells={[e.degree, e.school, e.major, e.year, e.pct]}
                    locked={e.locked}
                    onEdit={() => { if (!e.locked) setEditingEdu({ ...e }); }}
                    onDelete={async () => {
                      if (e.locked) return;
                      try { await api.delete(`/student/profile/educations/${e.id}`); } catch { /* continue */ }
                      setEdus(p => p.filter(x => x.id !== e.id));
                      if (editingEdu?.id === e.id) setEditingEdu(null);
                    }} />
                ))}
                {edus.length === 0 && !editingEdu && (
                  <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '20px 0' }}>No education entries. Click "+ Add Another Education" above.</p>
                )}
              </>
            )}

            {/* Professional Certification */}
            {eduTab === 'cert' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                  <button onClick={() => setEditingCert(BLANK_CERT())}
                    style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> Add Certificate
                  </button>
                </div>

                {/* Inline add/edit form */}
                {editingCert && (
                  <div style={{ background: '#F5F3FF', border: '1.5px solid #C7D2FE', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#4F46E5' }}>
                      {certs.find(c => c.id === editingCert.id) ? 'Edit Certificate' : 'Add Certificate'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <FI label="Certificate ID" value={editingCert.certId} onChange={v => setEditingCert(p => p && ({ ...p, certId: v }))} />
                      <FI label="Certificate Name" value={editingCert.name} onChange={v => setEditingCert(p => p && ({ ...p, name: v }))} req />
                      <FI label="Awarding Institute" value={editingCert.institute} onChange={v => setEditingCert(p => p && ({ ...p, institute: v }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <FI label="Valid Till" value={editingCert.valid} onChange={v => setEditingCert(p => p && ({ ...p, valid: v }))} type="date" />
                      <FI label="Certificate URL / File Name" value={editingCert.file} onChange={v => setEditingCert(p => p && ({ ...p, file: v }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingCert(null)}
                        style={{ padding: '8px 20px', border: '1.5px solid #D1D5DB', borderRadius: '20px', background: '#fff', color: '#374151', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={async () => {
                        if (!editingCert.name.trim()) return;
                        const isEdit = certs.some(c => c.id === editingCert.id);
                        try {
                          const payload = { certificationId: editingCert.certId, certificationName: editingCert.name, awardingInstitute: editingCert.institute, validTill: editingCert.valid, fileUrl: editingCert.file };
                          const res = isEdit
                            ? await api.put(`/student/profile/certifications/${editingCert.id}`, payload)
                            : await api.post('/student/profile/certifications', payload);
                          const s = res.data.data;
                          const mapped = { id: s.id, certId: s.certificationId, name: s.certificationName, institute: s.awardingInstitute, valid: s.validTill ?? '', file: s.fileUrl ?? '' };
                          setCerts(p => isEdit ? p.map(c => c.id === editingCert.id ? mapped : c) : [...p, mapped]);
                        } catch { setCerts(p => isEdit ? p.map(c => c.id === editingCert.id ? editingCert : c) : [...p, editingCert]); }
                        setEditingCert(null);
                      }} style={{ padding: '8px 20px', border: 'none', borderRadius: '20px', background: '#4F46E5', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    </div>
                  </div>
                )}

                <TableHead cols={['Certificate ID', 'Certificate Name', 'Awarding Institute', 'Valid Till', 'Certificate', 'Action']} />
                {certs.map(c => (
                  <TableRow key={c.id} cells={[c.certId, c.name, c.institute, c.valid, c.file]}
                    onEdit={() => setEditingCert({ ...c })}
                    onDelete={async () => {
                      try { await api.delete(`/student/profile/certifications/${c.id}`); } catch { /* continue */ }
                      setCerts(p => p.filter(x => x.id !== c.id));
                      if (editingCert?.id === c.id) setEditingCert(null);
                    }} />
                ))}
                {certs.length === 0 && !editingCert && (
                  <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '20px 0' }}>No certificates added yet. Click "+ Add Certificate" above.</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ── STEP 3: Work Experience ── */}
        {step === 3 && (
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <FS label="Experience Category" value={expCat} onChange={setExpCat} options={['Fresher', 'Experienced', 'Internship']} req />
              <FS label="Total Experience (In Years)" value={expYears} onChange={setExpYears} options={['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+']} req />
              <FS label="Total Experience (In Months)" value={expMonths} onChange={setExpMonths} options={['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']} req />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>Work Experience</p>
              <button onClick={() => setEditingWork(BLANK_WORK())}
                style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> Add Another Work Experience
              </button>
            </div>

            {/* Inline add/edit form */}
            {editingWork && (
              <div style={{ background: '#F5F3FF', border: '1.5px solid #C7D2FE', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#4F46E5' }}>
                  {works.find(w => w.id === editingWork.id) ? 'Edit Work Experience' : 'Add Work Experience'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <FI label="Company Name" value={editingWork.company} onChange={v => setEditingWork(p => p && ({ ...p, company: v }))} req />
                  <FS label="Employment Type" value={editingWork.type} onChange={v => setEditingWork(p => p && ({ ...p, type: v }))} options={['Full Time', 'Part Time', 'Internship', 'Contract', 'Freelance']} req />
                  <FI label="Location" value={editingWork.location} onChange={v => setEditingWork(p => p && ({ ...p, location: v }))} placeholder="e.g. Pune" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <FS label="Location Type" value={editingWork.locType} onChange={v => setEditingWork(p => p && ({ ...p, locType: v }))} options={['On site', 'Work From Home', 'Hybrid']} />
                  <MonthYearPicker label="From" value={editingWork.from} onChange={v => setEditingWork(p => p && ({ ...p, from: v }))} req />
                  <MonthYearPicker label="To" value={editingWork.to} onChange={v => setEditingWork(p => p && ({ ...p, to: v }))} allowCurrent />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditingWork(null)}
                    style={{ padding: '8px 20px', border: '1.5px solid #D1D5DB', borderRadius: '20px', background: '#fff', color: '#374151', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={async () => {
                    if (!editingWork.company.trim()) return;
                    const isEdit = works.some(w => w.id === editingWork.id);
                    try {
                      const payload = { companyName: editingWork.company, employmentType: editingWork.type, location: editingWork.location, locationType: editingWork.locType, fromDate: editingWork.from, toDate: editingWork.to };
                      const res = isEdit
                        ? await api.put(`/student/profile/work-experiences/${editingWork.id}`, payload)
                        : await api.post('/student/profile/work-experiences', payload);
                      const s = res.data.data;
                      const mapped = { id: s.id, company: s.companyName, type: s.employmentType, location: s.location, locType: s.locationType, from: s.fromDate, to: s.toDate };
                      setWorks(p => isEdit ? p.map(w => w.id === editingWork.id ? mapped : w) : [...p, mapped]);
                    } catch { setWorks(p => isEdit ? p.map(w => w.id === editingWork.id ? editingWork : w) : [...p, editingWork]); }
                    setEditingWork(null);
                  }} style={{ padding: '8px 20px', border: 'none', borderRadius: '20px', background: '#4F46E5', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                </div>
              </div>
            )}

            <TableHead cols={['Sr No', 'Company Name', 'Employment Type', 'Location', 'Location Type', 'From', 'To', 'Action']} />
            {works.map((w, i) => (
              <TableRow key={w.id} cells={[String(i + 1).padStart(2, '0'), w.company, w.type, w.location, w.locType, w.from, w.to]}
                onEdit={() => setEditingWork({ ...w })}
                onDelete={async () => {
                  try { await api.delete(`/student/profile/work-experiences/${w.id}`); } catch { /* continue */ }
                  setWorks(p => p.filter(x => x.id !== w.id));
                  if (editingWork?.id === w.id) setEditingWork(null);
                }} />
            ))}
            {works.length === 0 && !editingWork && (
              <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '20px 0' }}>No work experience added. Click "+ Add Another Work Experience".</p>
            )}
          </div>
        )}

        {/* ── STEP 4: Skills ── */}
        {step === 4 && (
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', background: '#fff' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>Key Skills</span>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid #9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Info size={10} color="#9CA3AF" />
              </div>
            </div>
            <div style={{ padding: '16px 18px 20px' }}>
              <SearchMultiSelect selected={skills} onChange={setSkills} allOptions={SKILL_LIST} placeholder="Search Another Skill" />
              <div style={{ marginTop: '16px', borderTop: '1px solid #F3F4F6', paddingTop: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                  <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ accentColor: '#4F46E5', width: '14px', height: '14px', marginTop: '2px', flexShrink: 0 }} />
                  <span>I Hereby Confirm That The <span style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'underline' }}>Information</span> Given Above Is True To My Knowledge And Belief.<span style={{ color: '#EF4444' }}>*</span></span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom action bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #E5E7EB', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', zIndex: 10 }}>
        <button onClick={handleBack} style={{ padding: '10px 28px', border: '1.5px solid #D1D5DB', borderRadius: '24px', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Back</button>
        <button style={{ padding: '10px 28px', border: '1.5px solid #D1D5DB', borderRadius: '24px', background: '#fff', color: '#374151', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Save As Draft</button>
        <button onClick={handleNext} disabled={isSaving} style={{ padding: '10px 32px', border: 'none', borderRadius: '24px', background: isSaving ? '#9CA3AF' : 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
          {isSaving ? 'Saving...' : step === 4 ? 'Submit' : 'Next'}
        </button>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
