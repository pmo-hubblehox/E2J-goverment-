import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Check, Plus, Pencil, Trash2, X, Search, ChevronDown, Calendar, Upload, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import { uploadFile, toAbsoluteDocUrl } from '../../services/uploadFile';
import { INDIA_STATE_CITIES, INDIA_STATE_LIST } from '../../utils/indiaCities';

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputSt: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #CBD5E1', borderRadius: '8px', padding: '14px', fontSize: '14px', color: '#1E293B', outline: 'none', background: '#fff' };
const floatWrap: React.CSSProperties = { position: 'relative', flex: '1 1 220px' };
const floatLabel: React.CSSProperties = { position: 'absolute', top: '-9px', left: '12px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' };
const rowFlex: React.CSSProperties = { display: 'flex', flexWrap: 'wrap' as const, gap: '14px', marginBottom: '14px' };
const errTxt: React.CSSProperties = { fontSize: '11px', color: '#EF4444', margin: '4px 0 0' };

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];

function FloatInput({ label, value, onChange, type = 'text', placeholder = '', error, onBlur, numOnly, maxLen, fieldId, readOnly }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; error?: string;
  onBlur?: () => void; numOnly?: boolean; maxLen?: number; fieldId?: string; readOnly?: boolean;
}) {
  return (
    <div style={floatWrap}>
      <input
        id={fieldId} type={type} value={value} readOnly={readOnly}
        onChange={e => {
          if (readOnly) return;
          let v = e.target.value;
          if (numOnly) v = v.replace(/\D/g, '');
          if (maxLen !== undefined) v = v.slice(0, maxLen);
          onChange(v);
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        inputMode={numOnly ? 'numeric' : undefined}
        style={{ ...inputSt, borderColor: error ? '#EF4444' : '#CBD5E1', background: readOnly ? '#F8FAFC' : '#fff', color: readOnly ? '#64748B' : '#1E293B', cursor: readOnly ? 'not-allowed' : undefined }}
      />
      <label style={floatLabel}>{label} <span style={{ color: '#EF4444' }}>*</span></label>
      {error && <p style={errTxt}>{error}</p>}
    </div>
  );
}

function FloatSelect({ label, value, onChange, options, error, onBlur, fieldId }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
  error?: string; onBlur?: () => void; fieldId?: string;
}) {
  return (
    <div style={{ ...floatWrap, position: 'relative' }}>
      <select id={fieldId} value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur}
        style={{ ...inputSt, paddingRight: '36px', appearance: 'none' as const, borderColor: error ? '#EF4444' : '#CBD5E1' }}>
        {options.map(o => <option key={o} value={o}>{o || `- Select -`}</option>)}
      </select>
      <label style={floatLabel}>{label} <span style={{ color: '#EF4444' }}>*</span></label>
      <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
      {error && <p style={errTxt}>{error}</p>}
    </div>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS = Array.from({ length: new Date().getFullYear() - 1970 + 6 }, (_, i) => String(new Date().getFullYear() + 5 - i));

function MonthYearPicker({ label, value, onChange, error, disabled, fieldId }: {
  label: string; value: string; onChange: (v: string) => void;
  error?: string; disabled?: boolean; fieldId?: string;
}) {
  const parts = value ? value.split('-') : ['', ''];
  const mon = parts[0] ?? '';
  const yr  = parts[1] ?? '';
  const [localMon, setLocalMon] = useState(mon);
  const [localYr,  setLocalYr]  = useState(yr);

  useEffect(() => { setLocalMon(parts[0] ?? ''); setLocalYr(parts[1] ?? ''); }, [value]);

  const handleMon = (m: string) => {
    setLocalMon(m);
    if (m && localYr) onChange(`${m}-${localYr}`); else onChange('');
  };
  const handleYr = (y: string) => {
    setLocalYr(y);
    if (localMon && y) onChange(`${localMon}-${y}`); else onChange('');
  };

  return (
    <div style={{ ...floatWrap, display: 'flex', flexDirection: 'column', gap: '0' }}>
      <label style={{ ...floatLabel, zIndex: 1 }}>{label} <span style={{ color: '#EF4444' }}>*</span></label>
      <div style={{ display: 'flex', gap: '6px' }} id={fieldId}>
        <select value={localMon} disabled={disabled}
          onChange={e => handleMon(e.target.value)}
          style={{ ...inputSt, flex: 1, appearance: 'none' as const, borderColor: error ? '#EF4444' : '#CBD5E1', background: disabled ? '#F8FAFC' : '#fff', color: disabled ? '#94A3B8' : '#1E293B', cursor: disabled ? 'not-allowed' : 'default' }}>
          <option value="">Month</option>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={localYr} disabled={disabled}
          onChange={e => handleYr(e.target.value)}
          style={{ ...inputSt, flex: 1, appearance: 'none' as const, borderColor: error ? '#EF4444' : '#CBD5E1', background: disabled ? '#F8FAFC' : '#fff', color: disabled ? '#94A3B8' : '#1E293B', cursor: disabled ? 'not-allowed' : 'default' }}>
          <option value="">Year</option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {error && <p style={errTxt}>{error}</p>}
    </div>
  );
}

function SearchableSelect({ label, value, onChange, options, error, onBlur, fieldId }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
  error?: string; onBlur?: () => void; fieldId?: string;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onBlur]);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} style={{ ...floatWrap, position: 'relative' }}>
      <label style={floatLabel}>{label} <span style={{ color: '#EF4444' }}>*</span></label>
      <div id={fieldId} tabIndex={0}
        onClick={() => { setOpen(o => !o); setSearch(''); }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setOpen(o => !o); setSearch(''); } }}
        style={{ ...inputSt, borderColor: error ? '#EF4444' : '#CBD5E1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
        <span style={{ color: value ? '#1E293B' : '#94A3B8' }}>{value || '- Select -'}</span>
        <ChevronDown size={14} color="#64748B" />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, background: '#fff', border: '1px solid #CBD5E1', borderRadius: '8px', zIndex: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 10px' }}>
              <Search size={12} color="#94A3B8" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#1E293B', background: 'transparent', width: '100%' }} />
            </div>
          </div>
          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding: '12px', fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>No matching results found</div>
              : filtered.map(o => (
                <div key={o} onClick={() => { onChange(o); setOpen(false); setSearch(''); onBlur?.(); }}
                  style={{ padding: '9px 14px', fontSize: '13px', cursor: 'pointer', color: o === value ? '#4F46E5' : '#1E293B', background: o === value ? '#EEF2FF' : 'transparent', fontWeight: o === value ? 600 : 400 }}
                  onMouseEnter={e => { if (o !== value) (e.currentTarget.style.background = '#F8FAFC'); }}
                  onMouseLeave={e => { if (o !== value) (e.currentTarget.style.background = 'transparent'); }}>
                  {o}
                </div>
              ))
            }
          </div>
        </div>
      )}
      {error && <p style={errTxt}>{error}</p>}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface EduRow { id: number; degree: string; school: string; major: string; year: string; percent: string }
interface WorkRow { id: number; company: string; empType: string; location: string; locType: string; from: string; to: string }
interface CertRow { id: number; certId: string; certName: string; institute: string; validTill: string; docName: string; docUrl: string }
interface PersonalData {
  name: string; email: string; phone: string;
  house: string; flat: string; pincode: string; stateName: string; city: string; area: string; landmark: string;
}

// ── Step 1: Personal Details ──────────────────────────────────────────────────
function StepPersonal({ data, onChange, errors = {}, onFieldBlur, aadhaarUrl, setAadhaarUrl, photoUrl, setPhotoUrl }: {
  data: PersonalData; onChange: (d: PersonalData) => void;
  errors?: Record<string, string>; onFieldBlur?: (field: string) => void;
  aadhaarUrl: string; setAadhaarUrl: (v: string) => void;
  photoUrl: string; setPhotoUrl: (v: string) => void;
}) {
  const [aadhaar, setAadhaar] = useState(aadhaarUrl ? aadhaarUrl.split('/').pop() ?? '' : '');
  const [photo, setPhoto] = useState(photoUrl || '');
  const set = (field: keyof PersonalData) => (v: string) => onChange({ ...data, [field]: v });
  const blur = (field: string) => () => onFieldBlur?.(field);

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', margin: '0 0 4px' }}>Upload Aadhaar</p>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '0 0 10px' }}>Upload Front And Back Of Your Aadhaar</p>
          <label style={{ display: 'block', border: '1.5px dashed #CBD5E1', borderRadius: '8px', padding: '12px 20px', cursor: 'pointer', fontSize: '13px', color: aadhaar ? '#1E293B' : '#94A3B8', textAlign: 'center' as const }}>
            {aadhaar || 'Drag Your File Here Or '}
            {!aadhaar && <span style={{ color: '#4F46E5', fontWeight: 600 }}>Browse File</span>}
            <input type="file" style={{ display: 'none' }} onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return;
              try {
                const { url, name } = await uploadFile(f, 'counsellor', data.name || 'unknown', 'Aadhaar');
                setAadhaar(name); setAadhaarUrl(url);
              } catch { setAadhaar(f.name); }
              e.target.value = '';
            }} />
          </label>
          {aadhaarUrl && (
            <a href={toAbsoluteDocUrl(aadhaarUrl)} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '12px', color: '#4F46E5', fontWeight: 500, textDecoration: 'none' }}>
              <ExternalLink size={12} /> View Uploaded Aadhaar
            </a>
          )}
        </div>
      </div>

      <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>Personal Details</span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 8px' }}>Counsellor Photo</p>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {photo ? (
              <>
                <img src={photo} alt="photo" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                <button onClick={() => setPhoto('')} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', background: '#4F46E5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <X size={12} />
                </button>
              </>
            ) : (
              <label style={{ display: 'flex', width: '100px', height: '100px', border: '1.5px dashed #CBD5E1', borderRadius: '8px', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '12px', textAlign: 'center' as const }}>
                <Upload size={20} />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  setPhoto(URL.createObjectURL(f));
                  try {
                    const { url } = await uploadFile(f, 'counsellor', data.name || 'unknown', 'Photo');
                    setPhotoUrl(url);
                  } catch {}
                  e.target.value = '';
                }} />
              </label>
            )}
          </div>
        </div>

        <div style={rowFlex}>
          <FloatInput label="Name" value={data.name} onChange={() => {}} placeholder="Dr. Mrs. Manisha Y. Joshi"
            readOnly fieldId="field-name" />
        </div>
        <div style={rowFlex}>
          <FloatInput label="Email" value={data.email} onChange={() => {}} type="email" readOnly
            fieldId="field-email" />
          <div style={{ ...floatWrap, display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ display: 'flex' }}>
              <select style={{ border: `1px solid ${errors.phone ? '#EF4444' : '#CBD5E1'}`, borderRadius: '8px 0 0 8px', padding: '14px 10px', fontSize: '13px', background: '#fff', outline: 'none', flexShrink: 0 }}>
                <option>🇮🇳 +91</option>
              </select>
              <input id="field-phone" type="tel" inputMode="numeric" maxLength={10}
                value={data.phone}
                onChange={e => set('phone')(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onBlur={blur('phone')}
                placeholder="9876543210"
                style={{ ...inputSt, borderRadius: '0 8px 8px 0', borderLeft: 'none', flex: 1, borderColor: errors.phone ? '#EF4444' : '#CBD5E1' }} />
            </div>
            {errors.phone && <p style={errTxt}>{errors.phone}</p>}
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>Registered Address</span>
        </div>
        <div style={rowFlex}>
          <div style={{ flex: '1 1 100%', position: 'relative' }}>
            <input id="field-house" value={data.house} onChange={e => set('house')(e.target.value)} onBlur={blur('house')}
              placeholder="House Number/Building Name *"
              style={{ ...inputSt, borderColor: errors.house ? '#EF4444' : '#CBD5E1' }} />
            {errors.house && <p style={errTxt}>{errors.house}</p>}
          </div>
        </div>
        <div style={rowFlex}>
          <div style={{ flex: '1 1 100%', position: 'relative' }}>
            <input id="field-flat" value={data.flat} onChange={e => set('flat')(e.target.value)} onBlur={blur('flat')}
              placeholder="Flat Number & Floor *"
              style={{ ...inputSt, borderColor: errors.flat ? '#EF4444' : '#CBD5E1' }} />
            {errors.flat && <p style={errTxt}>{errors.flat}</p>}
          </div>
        </div>
        <div style={rowFlex}>
          <FloatSelect label="Country" value="India" onChange={() => {}} options={['India']} />
          <FloatInput label="Pin Code" value={data.pincode} onChange={set('pincode')} numOnly maxLen={6}
            error={errors.pincode} onBlur={blur('pincode')} fieldId="field-pincode" />
          <SearchableSelect label="State" value={data.stateName} onChange={v => onChange({ ...data, stateName: v, city: '' })} options={INDIA_STATE_LIST}
            error={errors.stateName} onBlur={blur('stateName')} fieldId="field-stateName" />
        </div>
        <div style={rowFlex}>
          <SearchableSelect label="City" value={data.city} onChange={set('city')}
            options={data.stateName ? (INDIA_STATE_CITIES[data.stateName] ?? []) : []}
            error={errors.city} onBlur={blur('city')} fieldId="field-city" />
          <FloatInput label="Area/Locality" value={data.area} onChange={set('area')}
            error={errors.area} onBlur={blur('area')} fieldId="field-area" />
          <FloatInput label="Landmark" value={data.landmark} onChange={set('landmark')}
            error={errors.landmark} onBlur={blur('landmark')} fieldId="field-landmark" />
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Education ─────────────────────────────────────────────────────────
function StepEducation({ rows, setRows }: { rows: EduRow[]; setRows: (r: EduRow[]) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EduRow | null>(null);
  const [form, setForm] = useState({ degree: '', school: '', major: '', year: '', pursuing: false, percentType: '', percent: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const save = () => {
    const errs: Record<string, string> = {};
    if (!form.degree) errs.degree = 'Degree is required.';
    if (!form.major.trim()) errs.major = 'Major / Specialization is required.';
    if (!form.school.trim()) errs.school = 'School / University name is required.';
    if (!form.pursuing && !form.year) errs.year = 'Year of passing is required.';
    if (!form.percent.trim()) errs.percent = 'Percentage / CGPA value is required.';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); document.getElementById('edu-field-' + Object.keys(errs)[0])?.focus(); return; }
    setFormErrors({});
    const yearVal = form.pursuing ? 'Pursuing' : form.year;
    if (editing) {
      setRows(rows.map(x => x.id === editing.id ? { ...x, degree: form.degree, school: form.school, major: form.major, year: yearVal, percent: form.percent } : x));
    } else {
      setRows([...rows, { id: Date.now(), degree: form.degree, school: form.school, major: form.major, year: yearVal, percent: form.percent }]);
    }
    setShowModal(false);
    setEditing(null);
    setForm({ degree: '', school: '', major: '', year: '', pursuing: false, percentType: '', percent: '' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', margin: 0 }}>Education Qualification</h3>
        <button onClick={() => { setEditing(null); setShowModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: '13px', fontWeight: 600 }}>
          <Plus size={14} /> Add Another Education
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            {['Degree/Qualification','School/ University/College Name','Major/Subject/Specialization','Year Of Passing','Percentage / CGPA','Action'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B', fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>No education records yet. Click + Add to get started.</td></tr>
          )}
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '12px' }}>{r.degree}</td>
              <td style={{ padding: '12px', color: '#64748B', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.school}</td>
              <td style={{ padding: '12px', color: '#64748B', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.major}</td>
              <td style={{ padding: '12px' }}>{r.year}</td>
              <td style={{ padding: '12px' }}>{r.percent}</td>
              <td style={{ padding: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setEditing(r); setForm({ degree: r.degree, school: r.school, major: r.major, year: r.year, pursuing: false, percentType: '', percent: r.percent }); setShowModal(true); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><Pencil size={14} /></button>
                  <button onClick={() => setRows(rows.filter(x => x.id !== r.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '620px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Add Education Details</h3>
            <div style={rowFlex}>
              <FloatSelect label="Degree/ Qualification" value={form.degree} onChange={v => { setForm(f => ({ ...f, degree: v })); setFormErrors(e => ({ ...e, degree: '' })); }}
                options={['', 'PhD', 'M.Tech', 'M.E.', 'B.Tech', 'B.E. (Computer Engineering)', 'B.Sc', 'HSC', 'SSC']}
                error={formErrors.degree} fieldId="edu-field-degree" />
              <FloatInput label="Major/Subject/Specialization" value={form.major} onChange={v => { setForm(f => ({ ...f, major: v })); setFormErrors(e => ({ ...e, major: '' })); }}
                error={formErrors.major} fieldId="edu-field-major" />
            </div>
            <div style={rowFlex}>
              <FloatInput label="School/University/College Name" value={form.school} onChange={v => { setForm(f => ({ ...f, school: v })); setFormErrors(e => ({ ...e, school: '' })); }}
                error={formErrors.school} fieldId="edu-field-school" />
              <div style={{ ...floatWrap, position: 'relative' }}>
                <select id="edu-field-year" value={form.year} disabled={form.pursuing}
                  onChange={v => { setForm(f => ({ ...f, year: v.target.value })); setFormErrors(e => ({ ...e, year: '' })); }}
                  style={{ ...inputSt, paddingRight: '36px', appearance: 'none' as const, borderColor: formErrors.year ? '#EF4444' : '#CBD5E1', background: form.pursuing ? '#F8FAFC' : '#fff', color: form.pursuing ? '#94A3B8' : '#1E293B', cursor: form.pursuing ? 'not-allowed' : 'default' }}>
                  <option value="">{form.pursuing ? 'Currently Pursuing' : '- Select -'}</option>
                  {Array.from({ length: new Date().getFullYear() + 4 - 1960 + 1 }, (_, i) => String(new Date().getFullYear() + 4 - i)).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <label style={floatLabel}>Year Of Passing <span style={{ color: '#EF4444' }}>*</span></label>
                <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
                {formErrors.year && !form.pursuing && <p style={errTxt}>{formErrors.year}</p>}
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', marginBottom: '14px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.pursuing} onChange={e => setForm(f => ({ ...f, pursuing: e.target.checked, year: e.target.checked ? '' : f.year }))}
                style={{ accentColor: '#4338CA', width: '15px', height: '15px' }} />
              Currently Pursuing
            </label>
            <div style={rowFlex}>
              <FloatSelect label="Percentage/CGPA" value={form.percentType} onChange={v => setForm(f => ({ ...f, percentType: v }))} options={['', 'Percentage', 'CGPA']} />
              <div style={floatWrap}>
                <input
                  id="edu-field-percent"
                  type="number" min="0" step="1"
                  value={form.percent}
                  onChange={e => { setForm(f => ({ ...f, percent: e.target.value.replace(/[^0-9]/g, '') })); setFormErrors(er => ({ ...er, percent: '' })); }}
                  placeholder="84"
                  style={{ ...inputSt, borderColor: formErrors.percent ? '#EF4444' : '#CBD5E1' }}
                />
                <label style={floatLabel}>Enter Value <span style={{ color: '#EF4444' }}>*</span></label>
                {formErrors.percent && <p style={errTxt}>{formErrors.percent}</p>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={save} style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: '#4338CA', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Work Experience ───────────────────────────────────────────────────
function StepWorkExperience({
  rows, setRows, expCat, setExpCat, expYears, setExpYears, expMonths, setExpMonths,
}: {
  rows: WorkRow[]; setRows: (r: WorkRow[]) => void;
  expCat: string; setExpCat: (v: string) => void;
  expYears: string; setExpYears: (v: string) => void;
  expMonths: string; setExpMonths: (v: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WorkRow | null>(null);
  const [form, setForm] = useState({ company: '', empType: '', location: '', locType: '', from: '', to: '', current: false, desc: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const save = () => {
    const errs: Record<string, string> = {};
    if (!form.company.trim()) errs.company = 'Company name is required.';
    if (!form.empType) errs.empType = 'Employment type is required.';
    if (!form.location.trim()) errs.location = 'Location is required.';
    if (!form.locType) errs.locType = 'Location type is required.';
    if (!form.from) errs.from = 'From date is required.';
    if (!form.current && !form.to) errs.to = 'To date is required.';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); document.getElementById('work-field-' + Object.keys(errs)[0])?.focus(); return; }
    setFormErrors({});
    const toVal = form.current ? 'Currently Working' : form.to;
    if (editing) {
      setRows(rows.map(x => x.id === editing.id ? { ...x, ...form, to: toVal } : x));
    } else {
      setRows([...rows, { id: Date.now(), company: form.company, empType: form.empType, location: form.location, locType: form.locType, from: form.from, to: toVal }]);
    }
    setShowModal(false);
    setForm({ company: '', empType: '', location: '', locType: '', from: '', to: '', current: false, desc: '' });
  };

  const isFresher = expCat === 'Fresher';

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>Total Experience</span>
        </div>
        <div style={rowFlex}>
          <FloatSelect label="Experience Category" value={expCat} onChange={v => { setExpCat(v); if (v === 'Fresher') { setExpYears('0'); setExpMonths('0'); } else { setExpYears(''); setExpMonths(''); } }} options={['Experienced', 'Fresher']} />
          {!isFresher && (
            <>
              <FloatSelect label="Total Experience (In Years)" value={expYears} onChange={setExpYears} options={['', ...Array.from({length: 31}, (_, i) => String(i))]} />
              <FloatSelect label="Total Experience (In Months)" value={expMonths} onChange={setExpMonths} options={['', ...Array.from({length: 12}, (_, i) => String(i))]} />
            </>
          )}
        </div>
        {isFresher && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#15803D', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={14} /> As a fresher, no work experience is required. You can proceed to the next step.
          </div>
        )}
      </div>

      {!isFresher && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>Work Experience</span>
            <button onClick={() => { setEditing(null); setShowModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: '13px', fontWeight: 600 }}>
              <Plus size={14} /> Add Another Work Experience
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['Sr No','Company Name','Employment Type','Location','Location Type','From','To','Action'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>No work experience yet. Click + Add to get started.</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px' }}>0{i + 1}</td>
                  <td style={{ padding: '12px' }}>{r.company}</td>
                  <td style={{ padding: '12px', color: '#64748B' }}>{r.empType}</td>
                  <td style={{ padding: '12px', color: '#64748B' }}>{r.location}</td>
                  <td style={{ padding: '12px', color: '#64748B' }}>{r.locType}</td>
                  <td style={{ padding: '12px' }}>{r.from}</td>
                  <td style={{ padding: '12px' }}>{r.to}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setEditing(r); setForm({ company: r.company, empType: r.empType, location: r.location, locType: r.locType, from: r.from, to: r.to, current: r.to === 'Currently Working', desc: '' }); setShowModal(true); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><Pencil size={14} /></button>
                      <button onClick={() => setRows(rows.filter(x => x.id !== r.id))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '620px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Add Work Experience</h3>
            <div style={rowFlex}>
              <FloatInput label="Company Name" value={form.company} onChange={v => { setForm(f => ({ ...f, company: v })); setFormErrors(e => ({ ...e, company: '' })); }}
                error={formErrors.company} fieldId="work-field-company" />
              <FloatSelect label="Employment Type" value={form.empType} onChange={v => { setForm(f => ({ ...f, empType: v })); setFormErrors(e => ({ ...e, empType: '' })); }}
                options={['', 'Full Time', 'Part Time', 'Internship', 'Freelance']} error={formErrors.empType} fieldId="work-field-empType" />
            </div>
            <div style={rowFlex}>
              <FloatInput label="Location" value={form.location} onChange={v => { setForm(f => ({ ...f, location: v })); setFormErrors(e => ({ ...e, location: '' })); }}
                error={formErrors.location} fieldId="work-field-location" />
              <FloatSelect label="Location Type" value={form.locType} onChange={v => { setForm(f => ({ ...f, locType: v })); setFormErrors(e => ({ ...e, locType: '' })); }}
                options={['', 'On site', 'Work From Home', 'Hybrid']} error={formErrors.locType} fieldId="work-field-locType" />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '14px', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.checked, to: e.target.checked ? '' : f.to }))} style={{ accentColor: '#4338CA' }} />
              Currently Working
            </label>
            <div style={rowFlex}>
              <MonthYearPicker label="From" value={form.from} onChange={v => { setForm(f => ({ ...f, from: v })); setFormErrors(e => ({ ...e, from: '' })); }}
                error={formErrors.from} fieldId="work-field-from" />
              <MonthYearPicker label="To" value={form.to} onChange={v => { setForm(f => ({ ...f, to: v })); setFormErrors(e => ({ ...e, to: '' })); }}
                error={form.current ? undefined : formErrors.to} disabled={form.current} fieldId="work-field-to" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={save} style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: '#4338CA', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 4: Certification ─────────────────────────────────────────────────────
function StepCertification({ rows, setRows }: { rows: CertRow[]; setRows: (r: CertRow[]) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CertRow | null>(null);
  const [form, setForm] = useState({ certId: '', certName: '', institute: '', validTill: '', docName: '', docUrl: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const save = () => {
    const errs: Record<string, string> = {};
    if (!form.certName.trim()) errs.certName = 'Certificate name is required.';
    if (!form.institute.trim()) errs.institute = 'Awarding institute is required.';
    if (Object.keys(errs).length > 0) { setFormErrors(errs); document.getElementById('cert-field-' + Object.keys(errs)[0])?.focus(); return; }
    setFormErrors({});
    if (editing) {
      setRows(rows.map(x => x.id === editing.id ? { ...x, ...form } : x));
    } else {
      setRows([...rows, { id: Date.now(), ...form }]);
    }
    setShowModal(false);
    setForm({ certId: '', certName: '', institute: '', validTill: '', docName: '', docUrl: '' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
        <button onClick={() => { setEditing(null); setShowModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontSize: '13px', fontWeight: 600 }}>
          <Plus size={14} /> Add Another Certificate
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            {['Certificate ID','Certificate Name','Awarding Institute','Valid Till','Certificate','Action'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748B', fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>No certifications yet. Click + Add to get started.</td></tr>
          )}
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '12px', fontSize: '12px', color: '#64748B' }}>{r.certId}</td>
              <td style={{ padding: '12px' }}>{r.certName}</td>
              <td style={{ padding: '12px', color: '#64748B' }}>{r.institute}</td>
              <td style={{ padding: '12px' }}>{r.validTill}</td>
              <td style={{ padding: '12px' }}>
                {r.docUrl
                  ? <a href={toAbsoluteDocUrl(r.docUrl)} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#4F46E5', fontWeight: 500, textDecoration: 'none' }}>
                      <ExternalLink size={12} /> View
                    </a>
                  : <span style={{ fontSize: '12px', color: '#CBD5E1' }}>—</span>}
              </td>
              <td style={{ padding: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setEditing(r); setForm({ certId: r.certId, certName: r.certName, institute: r.institute, validTill: r.validTill, docName: r.docName, docUrl: r.docUrl }); setShowModal(true); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><Pencil size={14} /></button>
                  <button onClick={() => setRows(rows.filter(x => x.id !== r.id))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '620px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Add Certificate Details</h3>
            <div style={rowFlex}>
              <FloatInput label="Certificate ID" value={form.certId} onChange={v => setForm(f => ({ ...f, certId: v }))} placeholder="Certificate ID" fieldId="cert-field-certId" />
              <FloatInput label="Certificate Name" value={form.certName} onChange={v => { setForm(f => ({ ...f, certName: v })); setFormErrors(e => ({ ...e, certName: '' })); }}
                placeholder="Certificate Name" error={formErrors.certName} fieldId="cert-field-certName" />
            </div>
            <div style={rowFlex}>
              <FloatInput label="Awarding Institute Name" value={form.institute} onChange={v => { setForm(f => ({ ...f, institute: v })); setFormErrors(e => ({ ...e, institute: '' })); }}
                error={formErrors.institute} fieldId="cert-field-institute" />
              <div style={{ ...floatWrap, position: 'relative' }}>
                <input type="text" value={form.validTill} onChange={e => setForm(f => ({ ...f, validTill: e.target.value }))} placeholder="Valid Till" style={inputSt} />
                <label style={floatLabel}>Valid Till <span style={{ color: '#EF4444' }}>*</span></label>
                <Calendar size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              </div>
            </div>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <label style={{ display: 'flex', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '14px', cursor: 'pointer', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: form.docName ? '#1E293B' : '#94A3B8' }}>{form.docName || 'Select'}</span>
                <Upload size={16} style={{ color: '#64748B' }} />
                <input type="file" style={{ display: 'none' }} onChange={async e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  setForm(fm => ({ ...fm, docName: f.name }));
                  try {
                    const { url, name } = await uploadFile(f, 'counsellor', form.certName || 'unknown', 'Certification');
                    setForm(fm => ({ ...fm, docName: name, docUrl: url }));
                  } catch {}
                  e.target.value = '';
                }} />
              </label>
              <span style={{ ...floatLabel, top: '-9px' }}>Upload Document <span style={{ color: '#EF4444' }}>*</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={save} style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: '#4338CA', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 5: Skills ────────────────────────────────────────────────────────────
const SKILL_GROUPS = [
  {
    group: 'Counselling & communication',
    skills: ['Active listening', 'Empathy & rapport building', 'Motivational interviewing', 'Goal setting', 'Probing & questioning', 'Non-judgemental communication', 'Confidentiality & ethics', 'Parent / family counselling', 'Group counselling', 'Working with minors'],
  },
  {
    group: 'Assessment & psychometrics',
    skills: ['Psychometric test administration', 'Interest & aptitude assessment', 'Personality assessment (MBTI / Big Five)', 'DMIT', 'Strengths / skills inventory', 'Report interpretation'],
  },
  {
    group: 'Career domains',
    skills: ['IT / software / AI-ML', 'Engineering & technology', 'Medicine & healthcare', 'Commerce, finance & CA', 'Management / MBA', 'Law', 'Design & creative arts', 'Civil services & govt exams', 'Humanities & social sciences', 'Vocational & skill-based'],
  },
  {
    group: 'Career planning tools',
    skills: ['Resume / CV building', 'LinkedIn profile building', 'Interview preparation', 'College & course selection', 'Scholarship guidance', 'Study abroad counselling', 'Gap year planning', 'Career roadmap creation'],
  },
  {
    group: 'Student support',
    skills: ['Learning disabilities support', 'Stress & anxiety management', 'Time management coaching', 'Academic performance counselling', 'Peer relationship issues', 'Bullying & social challenges', 'Self-esteem building', 'Mindfulness & well-being'],
  },
];

const ALL_SKILLS = SKILL_GROUPS.flatMap(g => g.skills);

function StepSkills({ selected, setSelected, declared, setDeclared }: { selected: string[]; setSelected: (s: string[]) => void; declared: boolean; setDeclared: (v: boolean) => void }) {
  const [search, setSearch] = useState('');

  const toggle = (s: string) => setSelected(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]);

  const filteredGroups = SKILL_GROUPS.map(g => ({
    ...g,
    skills: g.skills.filter(s => search === '' || s.toLowerCase().includes(search.toLowerCase())),
  })).filter(g => g.skills.length > 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>Key Skills</span>
        <span style={{ fontSize: '12px', color: '#64748B' }}>Step 5 of 5 · select all that apply — grouped so they're easy to find</span>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', marginBottom: '20px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #E2E8F0', borderRadius: '20px', padding: '8px 14px', width: '220px', marginBottom: '20px' }}>
        <Search size={15} style={{ color: '#94A3B8', flexShrink: 0 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search another skill"
          style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#1E293B', background: 'transparent', width: '100%' }} />
      </div>

      {filteredGroups.map(({ group, skills }) => (
        <div key={group} style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', marginBottom: '10px' }}>{group}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
            {skills.map(s => {
              const isSelected = selected.includes(s);
              return (
                <span key={s} onClick={() => toggle(s)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1.5px solid ${isSelected ? '#4F46E5' : '#CBD5E1'}`, borderRadius: '20px', padding: '5px 12px', fontSize: '13px', color: isSelected ? '#4F46E5' : '#475569', fontWeight: isSelected ? 600 : 400, cursor: 'pointer', background: isSelected ? '#EEF2FF' : '#fff' }}>
                  {s}
                  {isSelected && <X size={12} color="#4F46E5" />}
                </span>
              );
            })}
          </div>
        </div>
      ))}

      <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '24px 0' }} />

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#1E293B', cursor: 'pointer' }}>
        <input type="checkbox" checked={declared} onChange={e => setDeclared(e.target.checked)} style={{ accentColor: '#4338CA', width: '15px', height: '15px', marginTop: '1px', flexShrink: 0 }} />
        I Hereby Confirm That The{' '}
        <span style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'underline' }}>Information</span>{' '}
        Given Above Is True To My Knowledge And Belief.*
      </label>
    </div>
  );
}

// ── Wizard shell ──────────────────────────────────────────────────────────────
const STEPS = ['Personal Details', 'Education Qualification:', 'Work Experience', 'Certification', 'Skills'];

export default function CounsellorOnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState('');
  const [loading, setLoading] = useState(true);
  const [aadhaarUrl, setAadhaarUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Lifted state — must be declared BEFORE any useCallback that references them
  const [personal, setPersonal] = useState<PersonalData>({ name: user?.name ?? '', email: user?.email ?? '', phone: '', house: '', flat: '', pincode: '', stateName: '', city: '', area: '', landmark: '' });

  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});

  const validatePersonalField = useCallback((field: string, value: string): string => {
    if (field === 'name') return value.trim() ? '' : 'Full name is required.';
    if (field === 'email') {
      if (!value.trim()) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
      return '';
    }
    if (field === 'phone') {
      if (!value.trim()) return 'Phone number is required.';
      if (!/^\d{10}$/.test(value)) return 'Enter a valid 10-digit phone number.';
      return '';
    }
    if (field === 'house') return value.trim() ? '' : 'House number / building name is required.';
    if (field === 'flat') return value.trim() ? '' : 'Flat number & floor is required.';
    if (field === 'pincode') {
      if (!value.trim()) return 'Pin code is required.';
      if (!/^\d{6}$/.test(value)) return 'Enter a valid 6-digit pin code.';
      return '';
    }
    if (field === 'stateName') return value ? '' : 'Please select a state.';
    if (field === 'city') return value ? '' : 'Please select a city.';
    if (field === 'area') return value.trim() ? '' : 'Area / locality is required.';
    if (field === 'landmark') return value.trim() ? '' : 'Landmark is required.';
    return '';
  }, []);

  const handlePersonalBlur = useCallback((field: string) => {
    const value = (personal as unknown as Record<string, string>)[field] ?? '';
    const err = validatePersonalField(field, value);
    setPersonalErrors(prev => ({ ...prev, [field]: err }));
  }, [personal, validatePersonalField]);

  const validateAllPersonal = (): boolean => {
    const fields = ['phone', 'house', 'flat', 'pincode', 'stateName', 'city', 'area', 'landmark'];
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const v = (personal as unknown as Record<string, string>)[f] ?? '';
      errs[f] = validatePersonalField(f, v);
    }
    setPersonalErrors(errs);
    const firstErrField = fields.find(f => errs[f]);
    if (firstErrField) {
      setTimeout(() => document.getElementById(`field-${firstErrField}`)?.focus(), 50);
    }
    return !fields.some(f => errs[f]);
  };

  // Lifted state (continued)
  const [eduRows, setEduRows] = useState<EduRow[]>([]);
  const [workRows, setWorkRows] = useState<WorkRow[]>([]);
  const [expCat, setExpCat] = useState('Experienced');
  const [expYears, setExpYears] = useState('');
  const [expMonths, setExpMonths] = useState('');
  const [certRows, setCertRows] = useState<CertRow[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [declared, setDeclared] = useState(false);
  const [counsellorStatus, setCounsellorStatus] = useState<string | null>(null);

  // Prefill existing data on mount
  useEffect(() => {
    api.get('/counsellor/onboarding/status').then(r => {
      setCounsellorStatus(r.data?.data?.status ?? null);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/counsellor/profile').catch(() => null),
      api.get('/counsellor/education').catch(() => null),
      api.get('/counsellor/work-experience').catch(() => null),
      api.get('/counsellor/certifications').catch(() => null),
    ]).then(([pRes, eRes, wRes, cRes]) => {
      const p = pRes?.data?.data;
      if (p) {
        setPersonal({
          name: user?.name ?? '',
          email: user?.email ?? p.email ?? '', // always use login email
          phone: p.phone ?? '',
          house: p.houseNumber ?? '',
          flat: p.flatNumber ?? '',
          pincode: p.pincode ?? '',
          stateName: p.state ?? '',
          city: p.city ?? '',
          area: p.area ?? '',
          landmark: p.landmark ?? '',
        });
        if (p.experienceCategory) setExpCat(p.experienceCategory);
        if (p.experienceYears != null) setExpYears(String(p.experienceYears));
        if (p.experienceMonths != null) setExpMonths(String(p.experienceMonths));
        if (p.skills?.length) setSkills(p.skills);
      }
      const eduData = eRes?.data?.data ?? [];
      const eduList = Array.isArray(eduData) ? eduData : (eduData.content ?? []);
      setEduRows(eduList.map((e: any) => ({ id: e.id, degree: e.degree ?? '', school: e.schoolName ?? '', major: e.major ?? '', year: e.yearOfPassing ?? '', percent: String(e.percentageValue ?? '') })));
      const wrkData = wRes?.data?.data ?? [];
      const wrkList = Array.isArray(wrkData) ? wrkData : (wrkData.content ?? []);
      setWorkRows(wrkList.map((w: any) => ({ id: w.id, company: w.companyName ?? '', empType: w.employmentType ?? '', location: w.location ?? '', locType: w.locationType ?? '', from: w.fromDate ?? '', to: w.currentlyWorking ? 'Currently Working' : (w.toDate ?? '') })));
      const crtData = cRes?.data?.data ?? [];
      const crtList = Array.isArray(crtData) ? crtData : (crtData.content ?? []);
      setCertRows(crtList.map((c: any) => ({ id: c.id, certId: c.certificateId ?? '', certName: c.certificateName ?? '', institute: c.awardingInstitute ?? '', validTill: c.validTill ?? '', docName: c.documentUrl ? c.documentUrl.split('/').pop() ?? '' : '', docUrl: c.documentUrl ?? '' })));
    }).finally(() => setLoading(false));
  }, []);

  const validateStep = (s: number): string => {
    if (s === 0) return ''; // handled by validateAllPersonal
    if (s === 1) {
      if (eduRows.length === 0) return 'Please add at least one education record.';
      for (const r of eduRows) {
        if (!r.degree || !r.school.trim() || !r.major.trim() || !r.year.trim() || !r.percent.trim())
          return 'All fields in every education record are required.';
      }
      return '';
    }
    if (s === 2) {
      if (!expCat) return 'Experience category is required.';
      if (expCat !== 'Fresher') {
        if (!expYears) return 'Total experience years is required.';
        if (!expMonths) return 'Total experience months is required.';
        if (workRows.length === 0) return 'Please add at least one work experience record.';
        for (const r of workRows) {
          if (!r.company.trim() || !r.empType || !r.location.trim() || !r.locType || !r.from.trim())
            return 'All fields in every work experience record are required.';
        }
      }
      return '';
    }
    if (s === 3) {
      for (const r of certRows) {
        if (!r.certId.trim() || !r.certName.trim() || !r.institute.trim() || !r.validTill.trim())
          return 'Certificate ID, name, institute, and valid till are required for every added certification.';
      }
      return '';
    }
    if (s === 4) {
      if (skills.length < 3) return 'Please select at least 3 skills.';
      if (!declared) return 'Please confirm the declaration before submitting.';
      return '';
    }
    return '';
  };

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      await api.put('/counsellor/profile', {
        name: personal.name,
        phone: personal.phone,
        houseNumber: personal.house,
        flatNumber: personal.flat,
        area: personal.area,
        city: personal.city,
        state: personal.stateName,
        pincode: personal.pincode,
        country: 'India',
        landmark: personal.landmark,
        experienceCategory: expCat,
        experienceYears: Number(expYears) || 0,
        experienceMonths: Number(expMonths) || 0,
        skills,
        onboardingCompleted: true,
        aadhaarUrl: aadhaarUrl || undefined,
        photoUrl: photoUrl || undefined,
      });

      // Delete existing records before re-saving to prevent duplicates
      const [existingEdu, existingWork, existingCerts] = await Promise.all([
        api.get('/counsellor/education').then(r => { const d = r.data?.data; return Array.isArray(d) ? d : (d?.content ?? []); }).catch(() => []),
        api.get('/counsellor/work-experience').then(r => { const d = r.data?.data; return Array.isArray(d) ? d : (d?.content ?? []); }).catch(() => []),
        api.get('/counsellor/certifications').then(r => { const d = r.data?.data; return Array.isArray(d) ? d : (d?.content ?? []); }).catch(() => []),
      ]);
      await Promise.all([
        ...existingEdu.map((e: any) => api.delete(`/counsellor/education/${e.id}`).catch(() => {})),
        ...existingWork.map((w: any) => api.delete(`/counsellor/work-experience/${w.id}`).catch(() => {})),
        ...existingCerts.map((c: any) => api.delete(`/counsellor/certifications/${c.id}`).catch(() => {})),
      ]);

      for (const e of eduRows) {
        await api.post('/counsellor/education', {
          degree: e.degree,
          schoolName: e.school,
          major: e.major,
          yearOfPassing: e.year,
          percentageValue: parseFloat(e.percent) || null,
        }).catch(() => {});
      }
      for (const w of workRows) {
        await api.post('/counsellor/work-experience', {
          companyName: w.company,
          employmentType: w.empType,
          location: w.location,
          locationType: w.locType,
          fromDate: w.from,
          toDate: w.to === 'Currently Working' ? null : w.to,
          currentlyWorking: w.to === 'Currently Working',
        }).catch(() => {});
      }
      for (const c of certRows) {
        await api.post('/counsellor/certifications', {
          certificateId: c.certId,
          certificateName: c.certName,
          awardingInstitute: c.institute,
          validTill: c.validTill,
          documentUrl: c.docUrl || undefined,
        }).catch(() => {});
      }
      setSubmitted(true);
    } catch (e: any) {
      setStepError(e?.response?.data?.message ?? 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [personal, eduRows, workRows, certRows, skills, expCat, expYears, expMonths]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', fontSize: '14px', color: '#94A3B8' }}>
        Loading profile…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px 32px 120px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', margin: 0 }}>Counselor Registration</h1>
          <img src="/logo-full.png.png" alt="HubbleHox" style={{ height: '36px', objectFit: 'contain' }} />
        </div>
        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 24px' }}>
          "Kindly Fill In The Required Information Below To Complete Your Onboarding To The Portal. This Will Ensure A Smooth Setup And Enable Full Access To The Platform Features."
        </p>

        {/* Step bar */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', gap: '0' }}>
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: done ? '#4338CA' : active ? '#4338CA' : '#E2E8F0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                    {done ? <Check size={13} /> : i + 1}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: active ? 700 : 500, color: active || done ? '#4338CA' : '#94A3B8', whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: '2px', background: done ? '#4338CA' : '#E2E8F0', margin: '0 8px' }} />
                )}
              </div>
            );
          })}
        </div>

        {stepError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '13px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠</span> {stepError}
          </div>
        )}
        {step === 0 && <StepPersonal data={personal} onChange={setPersonal} errors={personalErrors} onFieldBlur={handlePersonalBlur} aadhaarUrl={aadhaarUrl} setAadhaarUrl={setAadhaarUrl} photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} />}
        {step === 1 && <StepEducation rows={eduRows} setRows={setEduRows} />}
        {step === 2 && <StepWorkExperience rows={workRows} setRows={setWorkRows} expCat={expCat} setExpCat={setExpCat} expYears={expYears} setExpYears={setExpYears} expMonths={expMonths} setExpMonths={setExpMonths} />}
        {step === 3 && <StepCertification rows={certRows} setRows={setCertRows} />}
        {step === 4 && <StepSkills selected={skills} setSelected={setSkills} declared={declared} setDeclared={setDeclared} />}
      </div>

      {/* Fixed footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #E2E8F0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>© 2024, Powered By <span style={{ color: '#4338CA', fontWeight: 600 }}>HubbleHox</span></p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {step > 0 && (
            <button onClick={() => { setStep(s => s - 1); setStepError(''); }} style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Back</button>
          )}
          <button style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Preview</button>
          <button style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Save As Draft</button>
          <button
            onClick={() => {
              if (step === 0) {
                if (!validateAllPersonal()) return;
                setStepError('');
                setStep(s => s + 1);
                return;
              }
              const err = validateStep(step);
              if (err) { setStepError(err); return; }
              setStepError('');
              if (step < STEPS.length - 1) { setStep(s => s + 1); }
              else { handleSubmit(); }
            }}
            disabled={submitting}
            style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: '#E04D8A', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {step === STEPS.length - 1 ? (submitting ? 'Sending…' : 'Send for Approval') : 'Next'}
          </button>
        </div>
      </div>

      {submitted && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '48px 40px', textAlign: 'center', width: '320px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid #4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={30} color="#4338CA" />
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#4338CA', margin: '0 0 8px' }}>Submitted Successfully!</p>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 28px' }}>
              {counsellorStatus === 'APPROVED'
                ? 'Your profile update has been submitted for review. You can continue working normally.'
                : 'Your profile is now under review by the Head of Counsellors.'}
            </p>
            <button
              onClick={() => navigate(counsellorStatus === 'APPROVED' ? '/counsellor' : '/counsellor/pending')}
              style={{ background: '#4338CA', border: 'none', borderRadius: '24px', color: '#fff', fontSize: '15px', fontWeight: 600, padding: '12px 48px', cursor: 'pointer' }}>
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
