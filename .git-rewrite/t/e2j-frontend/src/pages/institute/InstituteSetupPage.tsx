import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Trash2, Edit2, X, Upload, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const PRIMARY = '#3F41D1';
const BG      = '#F4F5FF';
const BORDER  = '#E2E8F0';
const TEXT    = '#212121';
const SUB     = '#666666';

const card: React.CSSProperties    = { background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px', marginBottom: '20px' };
const tbl: React.CSSProperties     = { width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' };
const th: React.CSSProperties      = { padding: '10px 14px', textAlign: 'left' as const, color: SUB, fontWeight: 500, background: '#F8FAFC', borderBottom: `1px solid ${BORDER}` };
const td: React.CSSProperties      = { padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, color: TEXT };
const inputSt: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: TEXT, outline: 'none', background: '#fff' };
const selectSt: React.CSSProperties = { ...inputSt, appearance: 'none' as const };
const labelSt: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 500, color: SUB, marginBottom: '4px' };
const row: React.CSSProperties     = { display: 'flex', flexWrap: 'wrap' as const, gap: '14px' };
const fhalf: React.CSSProperties   = { flex: '1 1 200px', minWidth: 0 };
const ffull: React.CSSProperties   = { flex: '1 1 100%', minWidth: 0 };

// validators
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v: string) => /^[6-9]\d{9}$/.test(v.replace(/[\s+\-]/g, ''));

// numeric-only filter — blocks letters at input level, no silent parseInt corruption
const numOnly    = (v: string) => v.replace(/[^0-9]/g, '');
const decOnly    = (v: string) => v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
const isReqFilled = (v: string) => v.trim() !== '';
const isPosInt   = (v: string) => /^\d+$/.test(v.trim()) && parseInt(v) > 0;
const isPosNum   = (v: string) => /^\d+(\.\d+)?$/.test(v.trim()) && parseFloat(v) >= 0;

function Inp({ label, req, value, onChange, placeholder, type, half, error, numeric, decimal }: {
  label: string; req?: boolean; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; half?: boolean; error?: string; numeric?: boolean; decimal?: boolean;
}) {
  const handleChange = (v: string) => {
    if (numeric) onChange(numOnly(v));
    else if (decimal) onChange(decOnly(v));
    else onChange(v);
  };
  return (
    <div style={half ? fhalf : ffull}>
      <label style={labelSt}>{label}{req && <span style={{ color: '#E6393E' }}> *</span>}</label>
      <input
        type={type ?? 'text'}
        inputMode={numeric || decimal ? 'decimal' : undefined}
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder ?? ''}
        style={{ ...inputSt, borderColor: error ? '#E6393E' : BORDER }}
      />
      {error && <span style={{ fontSize: '11px', color: '#E6393E', marginTop: '3px', display: 'block' }}>{error}</span>}
    </div>
  );
}

function Sel({ label, req, value, onChange, options, half, error }: {
  label: string; req?: boolean; value: string; onChange: (v: string) => void; options: string[]; half?: boolean; error?: string;
}) {
  return (
    <div style={half ? fhalf : ffull}>
      <label style={labelSt}>{label}{req && <span style={{ color: '#E6393E' }}> *</span>}</label>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={{ ...selectSt, borderColor: error ? '#E6393E' : BORDER }}>
          {options.map(o => <option key={o} value={o}>{o || `Select`}</option>)}
        </select>
        <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: SUB, pointerEvents: 'none' }} />
      </div>
      {error && <span style={{ fontSize: '11px', color: '#E6393E', marginTop: '3px', display: 'block' }}>{error}</span>}
    </div>
  );
}

function YesNo({ label, req, value, onChange }: { label: string; req?: boolean; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div style={ffull}>
      <label style={labelSt}>{label}{req && <span style={{ color: '#E6393E' }}> *</span>}</label>
      <div style={{ display: 'flex', gap: '24px', marginTop: '6px' }}>
        {[true, false].map(v => (
          <label key={String(v)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', color: TEXT }}>
            <input type="radio" name={label} checked={value === v} onChange={() => onChange(v)} style={{ accentColor: PRIMARY }} />
            {v ? 'Yes' : 'No'}
          </label>
        ))}
      </div>
    </div>
  );
}

function FileUpload({ label, req, instituteName, docType, value, onChange, half }: {
  label: string; req?: boolean; instituteName: string; docType: string;
  value: string; onChange: (url: string) => void; half?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('userType', 'institute');
      fd.append('entityName', instituteName); fd.append('docType', docType);
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(res.data?.data?.url ?? '');
    } catch { /* ignore */ } finally { setUploading(false); }
  };
  return (
    <div style={half ? fhalf : ffull}>
      <label style={labelSt}>{label}{req && <span style={{ color: '#E6393E' }}> *</span>}</label>
      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px', background: '#F8FAFC' }}>
          <span style={{ fontSize: '13px', color: TEXT, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Uploaded</span>
          <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E6393E' }}><X size={13} /></button>
        </div>
      ) : (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', background: '#F8FAFC' }}>
          <Upload size={13} color={SUB} />
          <span style={{ fontSize: '13px', color: uploading ? PRIMARY : SUB }}>{uploading ? 'Uploading…' : 'Browse'}</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0]); }} />
          <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: 'auto' }}>PDF/JPG/PNG (1MB)</span>
        </label>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = { background: PRIMARY, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, padding: '8px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };
const btnDanger: React.CSSProperties  = { background: 'none', border: 'none', cursor: 'pointer', color: '#E6393E' };
const btnEdit: React.CSSProperties    = { background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY };

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${BORDER}` }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: TEXT }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Step 1: Programs ──────────────────────────────────────────────────────────
function StepPrograms({ instName }: { instName: string }) {
  const [programs, setPrograms] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ degree: '', name: '', duration: '', intakeCapacity: '', totalFees: '', deadline: '', majors: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/institute/programs?size=100').then(r => setPrograms(r.data?.data?.content ?? [])).catch(() => {});
  }, []);

  const open = (p?: any) => {
    setEditing(p ?? null);
    setFormErrors({});
    setForm(p ? { degree: p.degree ?? '', name: p.name ?? '', duration: String(p.duration ?? ''), intakeCapacity: String(p.intakeCapacity ?? ''), totalFees: String(p.totalFees ?? ''), deadline: p.deadline ?? '', majors: (p.majors ?? []).join(', ') } : { degree: '', name: '', duration: '', intakeCapacity: '', totalFees: '', deadline: '', majors: '' });
    setShowModal(true);
  };

  const validateProgram = () => {
    const e: Record<string, string> = {};
    if (!form.degree)                    e.degree = 'Degree is required';
    if (!isReqFilled(form.name))         e.name = 'Program name is required';
    if (!isPosInt(form.duration))        e.duration = 'Enter a valid duration (e.g. 4)';
    if (!isPosInt(form.intakeCapacity))  e.intakeCapacity = 'Enter a valid intake capacity';
    if (!isPosNum(form.totalFees))       e.totalFees = 'Enter a valid fee amount';
    return e;
  };

  const save = async () => {
    const e = validateProgram();
    setFormErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      const payload = { degree: form.degree, name: form.name.trim(), duration: parseInt(form.duration), intakeCapacity: parseInt(form.intakeCapacity), totalFees: parseFloat(form.totalFees), deadline: form.deadline || null, majors: form.majors.split(',').map(s => s.trim()).filter(Boolean), status: 'UPLOADED' };
      if (editing) { const r = await api.put(`/institute/programs/${editing.id}`, payload); setPrograms(ps => ps.map(p => p.id === editing.id ? r.data.data : p)); }
      else { const r = await api.post('/institute/programs', payload); setPrograms(ps => [...ps, r.data.data]); }
      setShowModal(false);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    await api.delete(`/institute/programs/${id}`);
    setPrograms(ps => ps.filter(p => p.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '10px' }}>
        <label style={{ ...btnPrimary, cursor: 'pointer' }}>
          <Upload size={14} /> Bulk Upload
          <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={async e => {
            if (!e.target.files?.[0]) return;
            const fd = new FormData(); fd.append('file', e.target.files[0]);
            const r = await api.post('/institute/programs/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert(`${r.data?.data?.uploaded ?? 0} programs uploaded`);
            api.get('/institute/programs?size=100').then(r2 => setPrograms(r2.data?.data?.content ?? []));
          }} />
        </label>
        <button style={btnPrimary} onClick={() => open()}><Plus size={14} /> Add</button>
      </div>

      <div style={card}>
        <table style={tbl}>
          <thead>
            <tr>{['Program ID', 'Name Of Program', 'Majors', 'Duration (Yrs)', 'Total Fees', 'Intake', 'Deadline', 'Action'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {programs.length === 0 ? (
              <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: SUB, padding: '32px' }}>No programs added yet. Click + Add to begin.</td></tr>
            ) : programs.map(p => (
              <tr key={p.id}>
                <td style={td}>{p.programId ?? '—'}</td>
                <td style={td}>{p.degree} — {p.name}</td>
                <td style={td}>{(p.majors ?? []).join(', ')}</td>
                <td style={td}>{p.duration}</td>
                <td style={td}>₹{(p.totalFees ?? 0).toLocaleString()}</td>
                <td style={td}>{p.intakeCapacity}</td>
                <td style={td}>{p.deadline ?? '—'}</td>
                <td style={td}>
                  <button style={btnEdit} onClick={() => open(p)}><Edit2 size={14} /></button>
                  <button style={btnDanger} onClick={() => del(p.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Program' : 'Add Program'} onClose={() => setShowModal(false)}>
          <div style={row}>
            <Sel label="Degree" req value={form.degree} onChange={v => setForm(f => ({ ...f, degree: v }))} options={['', 'B.Tech', 'M.Tech', 'BBA', 'MBA', 'B.Sc', 'M.Sc', 'Diploma', 'Ph.D']} half error={formErrors.degree} />
            <Inp label="Program Name" req value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Computer Science & Engineering" half error={formErrors.name} />
            <Inp label="Duration (Years)" req numeric value={form.duration} onChange={v => setForm(f => ({ ...f, duration: v }))} placeholder="4" half error={formErrors.duration} />
            <Inp label="Intake Capacity" req numeric value={form.intakeCapacity} onChange={v => setForm(f => ({ ...f, intakeCapacity: v }))} placeholder="60" half error={formErrors.intakeCapacity} />
            <Inp label="Total Fees (₹)" req decimal value={form.totalFees} onChange={v => setForm(f => ({ ...f, totalFees: v }))} placeholder="500000" half error={formErrors.totalFees} />
            <Inp label="Deadline" value={form.deadline} onChange={v => setForm(f => ({ ...f, deadline: v }))} type="date" half />
            <Inp label="Majors (comma separated)" value={form.majors} onChange={v => setForm(f => ({ ...f, majors: v }))} placeholder="AI, ML, Data Science" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => setShowModal(false)} style={{ padding: '9px 20px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ ...btnPrimary, padding: '9px 20px' }}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Step 2: Students ──────────────────────────────────────────────────────────
function StepStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [showBulk, setShowBulk] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/institute/students?size=100').then(r => setStudents(r.data?.data?.content ?? [])).catch(() => {});
  }, []);

  const bulkUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await api.post('/institute/students/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert(`${r.data?.data?.uploaded ?? 0} students uploaded`);
      api.get('/institute/students?size=100').then(r2 => setStudents(r2.data?.data?.content ?? []));
      setShowBulk(false);
    } catch { /* ignore */ } finally { setUploading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '10px' }}>
        <button style={btnPrimary} onClick={() => setShowBulk(true)}><Upload size={14} /> Bulk Upload</button>
      </div>

      <div style={card}>
        <table style={tbl}>
          <thead>
            <tr>{['Student ID', 'Student Name', 'Program', 'Area of Specialization', 'Email Address', 'Contact Number', 'Action'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: SUB, padding: '32px' }}>No students uploaded yet. Use Bulk Upload to add students.</td></tr>
            ) : students.map(s => (
              <tr key={s.id}>
                <td style={td}>{s.studentId ?? '—'}</td>
                <td style={td}>{s.name}</td>
                <td style={td}>{s.program}</td>
                <td style={td}>{s.major}</td>
                <td style={td}>{s.email}</td>
                <td style={td}>{s.phone}</td>
                <td style={td}><button style={btnDanger} onClick={async () => { await api.delete(`/institute/students/${s.id}`); setStudents(prev => prev.filter(x => x.id !== s.id)); }}><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBulk && (
        <Modal title="Bulk Upload Students" onClose={() => setShowBulk(false)}>
          <p style={{ fontSize: '13px', color: SUB, margin: '0 0 16px' }}>Upload your data through CSV or XLS file.</p>
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${BORDER}`, borderRadius: '8px', padding: '40px', cursor: 'pointer', gap: '8px' }}>
            <Upload size={24} color={SUB} />
            <span style={{ fontSize: '13px', color: SUB }}>Drag Your File Here Or <span style={{ color: PRIMARY, fontWeight: 600 }}>Browse File</span></span>
            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Maximum File Size is 5MB</span>
            <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => { if (e.target.files?.[0]) bulkUpload(e.target.files[0]); }} />
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', alignItems: 'center' }}>
            <button onClick={async () => { const r = await api.get('/institute/students/sample', { responseType: 'blob' }); const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = 'Sample_Students.xlsx'; a.click(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: '13px', fontWeight: 500 }}>Download Template</button>
            <button onClick={() => setShowBulk(false)} style={{ padding: '9px 20px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>{uploading ? 'Uploading…' : 'Cancel'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Multi-day selector ────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function MultiDaySelect({ label, req, value, onChange, error }: {
  label: string; req?: boolean; value: string[]; onChange: (v: string[]) => void; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (day: string) => onChange(value.includes(day) ? value.filter(d => d !== day) : [...value, day]);

  return (
    <div style={ffull}>
      <label style={labelSt}>{label}{req && <span style={{ color: '#E6393E' }}> *</span>}</label>
      <div style={{ position: 'relative' }}>
        <div
          onClick={() => setOpen(o => !o)}
          style={{ ...inputSt, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderColor: error ? '#E6393E' : BORDER, minHeight: '42px' }}
        >
          <span style={{ fontSize: '14px', color: value.length ? TEXT : '#94A3B8' }}>
            {value.length ? value.join(', ') : 'Select days'}
          </span>
          <ChevronDown size={14} color={SUB} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </div>
        {open && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50, marginTop: '4px', overflow: 'hidden' }}>
            {DAYS_OF_WEEK.map(day => (
              <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', background: value.includes(day) ? '#F4F5FF' : '#fff', borderBottom: `1px solid ${BORDER}` }}>
                <input
                  type="checkbox"
                  checked={value.includes(day)}
                  onChange={() => toggle(day)}
                  style={{ accentColor: PRIMARY, width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', color: TEXT }}>{day}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      {error && <span style={{ fontSize: '11px', color: '#E6393E', marginTop: '3px', display: 'block' }}>{error}</span>}
    </div>
  );
}

// ─── Step 3: Academic Team ─────────────────────────────────────────────────────
function StepAcademicTeam({ instName }: { instName: string }) {
  const [tab, setTab] = useState<'faculty' | 'bos'>('faculty');
  const [faculty, setFaculty] = useState<any[]>([]);
  const [bosMembers, setBosMembers] = useState<any[]>([]);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showBosModal, setShowBosModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);
  const [editingBos, setEditingBos] = useState<any>(null);
  const [fForm, setFForm] = useState<{ name: string; expertise: string; days: string[]; mode: string; status: string }>({ name: '', expertise: '', days: [], mode: '', status: 'AVAILABLE' });
  const [fErrors, setFErrors] = useState<Record<string, string>>({});
  const [bForm, setBForm] = useState({ name: '', organization: '', designation: '', expertise: '', department: '', email: '', phone: '' });
  const [bErrors, setBErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/institute/faculty?size=100').then(r => setFaculty(r.data?.data?.content ?? [])).catch(() => {});
    api.get('/institute/bos-members').then(r => setBosMembers(r.data?.data ?? [])).catch(() => {});
  }, []);

  const openFaculty = (f?: any) => {
    setEditingFaculty(f ?? null);
    setFErrors({});
    setFForm(f
      ? { name: f.name ?? '', expertise: (f.expertise ?? []).join(', '), days: f.days ?? [], mode: f.mode ?? '', status: f.status ?? 'AVAILABLE' }
      : { name: '', expertise: '', days: [], mode: '', status: 'AVAILABLE' });
    setShowFacultyModal(true);
  };

  const validateFaculty = () => {
    const e: Record<string, string> = {};
    if (!isReqFilled(fForm.name))      e.name = 'Faculty name is required';
    if (!isReqFilled(fForm.expertise)) e.expertise = 'Expertise is required';
    if (fForm.days.length === 0)       e.days = 'Select at least one available day';
    if (!fForm.mode)                   e.mode = 'Mode is required';
    return e;
  };

  const saveFaculty = async () => {
    const e = validateFaculty();
    setFErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      const payload = { name: fForm.name.trim(), expertise: fForm.expertise.split(',').map(s => s.trim()).filter(Boolean), days: fForm.days, mode: fForm.mode, status: fForm.status };
      if (editingFaculty) { const r = await api.put(`/institute/faculty/${editingFaculty.id}`, payload); setFaculty(fs => fs.map(f => f.id === editingFaculty.id ? r.data.data : f)); }
      else { const r = await api.post('/institute/faculty', payload); setFaculty(fs => [...fs, r.data.data]); }
      setShowFacultyModal(false);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const openBos = (b?: any) => {
    setEditingBos(b ?? null);
    setBErrors({});
    setBForm(b ? { name: b.name ?? '', organization: b.organization ?? '', designation: b.designation ?? '', expertise: b.expertise ?? '', department: b.department ?? '', email: b.email ?? '', phone: b.phone ?? '' } : { name: '', organization: '', designation: '', expertise: '', department: '', email: '', phone: '' });
    setShowBosModal(true);
  };

  const validateBos = () => {
    const e: Record<string, string> = {};
    if (!isReqFilled(bForm.name))         e.name = 'Name is required';
    if (!isReqFilled(bForm.organization)) e.organization = 'Organization is required';
    if (!isReqFilled(bForm.designation))  e.designation = 'Designation is required';
    if (!isReqFilled(bForm.expertise))    e.expertise = 'Expertise is required';
    if (!isReqFilled(bForm.department))   e.department = 'Department is required';
    if (!isReqFilled(bForm.email))        e.email = 'Email is required';
    else if (!isValidEmail(bForm.email))  e.email = 'Enter a valid email';
    if (!isReqFilled(bForm.phone))        e.phone = 'Phone is required';
    else if (!isValidPhone(bForm.phone))  e.phone = 'Enter a valid 10-digit mobile';
    return e;
  };

  const saveBos = async () => {
    const e = validateBos();
    setBErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      if (editingBos) { const r = await api.put(`/institute/bos-members/${editingBos.id}`, bForm); setBosMembers(bs => bs.map(b => b.id === editingBos.id ? r.data.data : b)); }
      else { const r = await api.post('/institute/bos-members', bForm); setBosMembers(bs => [...bs, r.data.data]); }
      setShowBosModal(false);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const tabBtn = (t: 'faculty' | 'bos', label: string) => (
    <button onClick={() => setTab(t)} style={{ padding: '8px 20px', border: 'none', borderBottom: `2px solid ${tab === t ? PRIMARY : 'transparent'}`, background: 'none', color: tab === t ? PRIMARY : SUB, fontSize: '14px', fontWeight: tab === t ? 600 : 400, cursor: 'pointer' }}>{label}</button>
  );

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>{tabBtn('faculty', 'Faculty Details')}{tabBtn('bos', 'BOS Members Details')}</div>
        <button style={btnPrimary} onClick={() => tab === 'faculty' ? openFaculty() : openBos()}><Plus size={14} /> Add</button>
      </div>

      {tab === 'faculty' && (
        <div style={card}>
          <table style={tbl}>
            <thead><tr>{['Faculty Name', 'Expertise', 'Days', 'Mode', 'GL Status', 'Action'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {faculty.length === 0 ? (
                <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: SUB, padding: '32px' }}>No faculty added yet.</td></tr>
              ) : faculty.map(f => (
                <tr key={f.id}>
                  <td style={td}>{f.name}</td>
                  <td style={td}>{(f.expertise ?? []).join(', ')}</td>
                  <td style={td}>{(f.days ?? []).join(', ')}</td>
                  <td style={td}>{f.mode}</td>
                  <td style={td}><span style={{ background: f.status === 'AVAILABLE' ? '#DCFCE7' : '#FEE2E2', color: f.status === 'AVAILABLE' ? '#15803D' : '#B91C1C', borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 600 }}>{f.status}</span></td>
                  <td style={td}>
                    <button style={btnEdit} onClick={() => openFaculty(f)}><Edit2 size={14} /></button>
                    <button style={btnDanger} onClick={async () => { await api.delete(`/institute/faculty/${f.id}`); setFaculty(fs => fs.filter(x => x.id !== f.id)); }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bos' && (
        <div style={card}>
          <table style={tbl}>
            <thead><tr>{['BOS Name', 'Organization', 'Designation', 'Expertise', 'Department', 'Email', 'Contact', 'Action'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {bosMembers.length === 0 ? (
                <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: SUB, padding: '32px' }}>No BOS members added yet.</td></tr>
              ) : bosMembers.map(b => (
                <tr key={b.id}>
                  <td style={td}>{b.name}</td>
                  <td style={td}>{b.organization}</td>
                  <td style={td}>{b.designation}</td>
                  <td style={td}>{b.expertise}</td>
                  <td style={td}>{b.department}</td>
                  <td style={td}>{b.email}</td>
                  <td style={td}>{b.phone}</td>
                  <td style={td}>
                    <button style={btnEdit} onClick={() => openBos(b)}><Edit2 size={14} /></button>
                    <button style={btnDanger} onClick={async () => { await api.delete(`/institute/bos-members/${b.id}`); setBosMembers(bs => bs.filter(x => x.id !== b.id)); }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showFacultyModal && (
        <Modal title={editingFaculty ? 'Edit Faculty' : 'Add Faculty'} onClose={() => setShowFacultyModal(false)}>
          <div style={row}>
            <Inp label="Faculty Name" req value={fForm.name} onChange={v => setFForm(f => ({ ...f, name: v }))} placeholder="Full name" half error={fErrors.name} />
            <Sel label="Mode" req value={fForm.mode} onChange={v => setFForm(f => ({ ...f, mode: v }))} options={['', 'Online', 'Offline', 'Hybrid']} half error={fErrors.mode} />
            <Inp label="Expertise (comma separated)" req value={fForm.expertise} onChange={v => setFForm(f => ({ ...f, expertise: v }))} placeholder="Computer Science, AI" error={fErrors.expertise} />
            <MultiDaySelect label="Available Days" req value={fForm.days} onChange={v => setFForm(f => ({ ...f, days: v }))} error={fErrors.days} />
            <Sel label="GL Status" value={fForm.status} onChange={v => setFForm(f => ({ ...f, status: v }))} options={['AVAILABLE', 'UNAVAILABLE']} half />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => setShowFacultyModal(false)} style={{ padding: '9px 20px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={saveFaculty} disabled={saving} style={{ ...btnPrimary, padding: '9px 20px' }}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}

      {showBosModal && (
        <Modal title={editingBos ? 'Edit BOS Member' : 'Add BOS Member'} onClose={() => setShowBosModal(false)}>
          <div style={row}>
            <Inp label="BOS Name" req value={bForm.name} onChange={v => setBForm(f => ({ ...f, name: v }))} placeholder="Full name" half error={bErrors.name} />
            <Inp label="Organization" req value={bForm.organization} onChange={v => setBForm(f => ({ ...f, organization: v }))} placeholder="IIT Bombay" half error={bErrors.organization} />
            <Inp label="Designation" req value={bForm.designation} onChange={v => setBForm(f => ({ ...f, designation: v }))} placeholder="Professor & Head" half error={bErrors.designation} />
            <Inp label="Expertise" req value={bForm.expertise} onChange={v => setBForm(f => ({ ...f, expertise: v }))} placeholder="Thermal Engineering" half error={bErrors.expertise} />
            <Inp label="Department" req value={bForm.department} onChange={v => setBForm(f => ({ ...f, department: v }))} placeholder="Dept of Computer Science" half error={bErrors.department} />
            <Inp label="Email" req type="email" value={bForm.email} onChange={v => setBForm(f => ({ ...f, email: v }))} placeholder="name@org.ac.in" half error={bErrors.email} />
            <Inp label="Phone" req value={bForm.phone} onChange={v => setBForm(f => ({ ...f, phone: v }))} placeholder="9876543210" half error={bErrors.phone} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => setShowBosModal(false)} style={{ padding: '9px 20px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={saveBos} disabled={saving} style={{ ...btnPrimary, padding: '9px 20px' }}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Step 4: Infra Details ─────────────────────────────────────────────────────
function StepInfra({ instName }: { instName: string }) {
  const [infraTab, setInfraTab] = useState<'basic' | 'rooms' | 'labs' | 'safety' | 'power'>('basic');

  // Basic + Safety + Power (single record)
  const [infra, setInfra] = useState<any>({});
  const [infraSaving, setInfraSaving] = useState(false);

  // Rooms
  const [rooms, setRooms] = useState<any[]>([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [rForm, setRForm] = useState({ roomType: '', roomCount: '', area: '', personCapacity: '', equipment: '', notes: '', pricing: '', pricingUnit: 'Per Session' });
  const [rErrors, setRErrors] = useState<Record<string, string>>({});

  // Labs
  const [labs, setLabs] = useState<any[]>([]);
  const [showLabModal, setShowLabModal] = useState(false);
  const [editingLab, setEditingLab] = useState<any>(null);
  const [lForm, setLForm] = useState<any>({ labName: '', buildingName: '', floor: '', acAvailable: null, fansAvailable: null, noiseFree: null, partition: null, lighting: null, printer: null, cctvAvailable: null, networkType: 'LAN', lanSingleMultiple: 'Single', lanType: 'CAT 6', networkTopology: 'Star', networkSpeed: '', numComputers: '', numBuffers: '', computerCompany: '', ramCapacity: '', operatingSystem: '', browserName: '', browserVersion: '', pricing: '', pricingUnit: 'Per Session' });
  const [lErrors, setLErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/institute/infra').then(r => setInfra(r.data?.data ?? {})).catch(() => {});
    api.get('/institute/rooms').then(r => setRooms(r.data?.data ?? [])).catch(() => {});
    api.get('/institute/labs').then(r => setLabs(r.data?.data ?? [])).catch(() => {});
  }, []);

  const saveInfra = async () => {
    setInfraSaving(true);
    try { await api.put('/institute/infra', infra); alert('Saved!'); } catch { /* ignore */ } finally { setInfraSaving(false); }
  };

  const upd = (key: string, val: any) => setInfra((p: any) => ({ ...p, [key]: val }));

  const openRoom = (r?: any) => {
    setEditingRoom(r ?? null);
    setRErrors({});
    setRForm(r ? { roomType: r.roomType ?? '', roomCount: String(r.roomCount ?? ''), area: r.area ?? '', personCapacity: String(r.personCapacity ?? ''), equipment: (r.equipment ?? []).join(', '), notes: r.notes ?? '', pricing: String(r.pricing ?? ''), pricingUnit: r.pricingUnit ?? 'Per Session' } : { roomType: '', roomCount: '', area: '', personCapacity: '', equipment: '', notes: '', pricing: '', pricingUnit: 'Per Session' });
    setShowRoomModal(true);
  };

  const validateRoom = () => {
    const e: Record<string, string> = {};
    if (!rForm.roomType)                   e.roomType = 'Room type is required';
    if (!isPosInt(rForm.roomCount))        e.roomCount = 'Enter a valid room count';
    if (!isReqFilled(rForm.area))          e.area = 'Area is required';
    if (!isPosInt(rForm.personCapacity))   e.personCapacity = 'Enter a valid capacity';
    if (!isReqFilled(rForm.equipment))     e.equipment = 'At least one equipment item is required';
    if (!isPosNum(rForm.pricing))          e.pricing = 'Enter a valid price';
    return e;
  };

  const saveRoom = async () => {
    const e = validateRoom();
    setRErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      const payload = { roomType: rForm.roomType, roomCount: parseInt(rForm.roomCount), area: rForm.area.trim(), personCapacity: parseInt(rForm.personCapacity), equipment: rForm.equipment.split(',').map((s: string) => s.trim()).filter(Boolean), notes: rForm.notes, pricing: parseFloat(rForm.pricing), pricingUnit: rForm.pricingUnit };
      if (editingRoom) { const r = await api.put(`/institute/rooms/${editingRoom.id}`, payload); setRooms(rs => rs.map(x => x.id === editingRoom.id ? r.data.data : x)); }
      else { const r = await api.post('/institute/rooms', payload); setRooms(rs => [...rs, r.data.data]); }
      setShowRoomModal(false);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const openLab = (l?: any) => {
    setEditingLab(l ?? null);
    setLErrors({});
    setLForm(l ? { ...l, networkSpeed: String(l.networkSpeed ?? ''), numComputers: String(l.numComputers ?? ''), numBuffers: String(l.numBuffers ?? ''), pricing: String(l.pricing ?? '') } : { labName: '', buildingName: '', floor: '', acAvailable: null, fansAvailable: null, noiseFree: null, partition: null, lighting: null, printer: null, cctvAvailable: null, networkType: 'LAN', lanSingleMultiple: 'Single', lanType: 'CAT 6', networkTopology: 'Star', networkSpeed: '', numComputers: '', numBuffers: '', computerCompany: '', ramCapacity: '', operatingSystem: '', browserName: '', browserVersion: '', pricing: '', pricingUnit: 'Per Session' });
    setShowLabModal(true);
  };

  const validateLab = () => {
    const e: Record<string, string> = {};
    if (!isReqFilled(lForm.labName))       e.labName = 'Lab name is required';
    if (!isReqFilled(lForm.buildingName))  e.buildingName = 'Building name is required';
    if (!isReqFilled(lForm.floor))         e.floor = 'Floor is required';
    if (!isPosInt(lForm.networkSpeed))     e.networkSpeed = 'Enter a valid speed in Mbps';
    if (!isPosInt(lForm.numComputers))     e.numComputers = 'Enter a valid number';
    if (!isPosInt(lForm.numBuffers))       e.numBuffers = 'Enter a valid number';
    if (!isReqFilled(lForm.computerCompany)) e.computerCompany = 'Required';
    if (!isReqFilled(lForm.ramCapacity))   e.ramCapacity = 'Required';
    if (!lForm.operatingSystem)            e.operatingSystem = 'Required';
    if (!isReqFilled(lForm.browserName))   e.browserName = 'Required';
    if (!isReqFilled(lForm.browserVersion)) e.browserVersion = 'Required';
    if (!isPosNum(lForm.pricing))          e.pricing = 'Enter a valid price';
    return e;
  };

  const saveLab = async () => {
    const e = validateLab();
    setLErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      const payload = { ...lForm, networkSpeed: parseInt(lForm.networkSpeed), numComputers: parseInt(lForm.numComputers), numBuffers: parseInt(lForm.numBuffers), pricing: parseFloat(lForm.pricing) };
      if (editingLab) { const r = await api.put(`/institute/labs/${editingLab.id}`, payload); setLabs(ls => ls.map(x => x.id === editingLab.id ? r.data.data : x)); }
      else { const r = await api.post('/institute/labs', payload); setLabs(ls => [...ls, r.data.data]); }
      setShowLabModal(false);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const infraTabs: { key: 'basic' | 'rooms' | 'labs' | 'safety' | 'power'; label: string }[] = [
    { key: 'basic', label: 'Basic Details' },
    { key: 'rooms', label: 'Room Details' },
    { key: 'labs', label: 'Lab Details' },
    { key: 'safety', label: 'Safety Measure Details' },
    { key: 'power', label: 'Power Backup Details' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: '20px', gap: '4px' }}>
        {infraTabs.map(t => (
          <button key={t.key} onClick={() => setInfraTab(t.key)}
            style={{ padding: '8px 16px', border: 'none', borderBottom: `2px solid ${infraTab === t.key ? PRIMARY : 'transparent'}`, background: 'none', color: infraTab === t.key ? PRIMARY : SUB, fontSize: '13px', fontWeight: infraTab === t.key ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Basic Details */}
      {infraTab === 'basic' && (
        <div style={card}>
          <div style={row}>
            <FileUpload label="Building Entrance Image" req instituteName={instName} docType="building-entrance" value={infra.buildingEntranceImg ?? ''} onChange={v => upd('buildingEntranceImg', v)} half />
            <Inp label="Number Of Floors" req value={String(infra.numFloors ?? '')} onChange={v => upd('numFloors', v)} placeholder="3" half />
            <Inp label="Land Area" req value={infra.landArea ?? ''} onChange={v => upd('landArea', v)} placeholder="17.5 Acres" half />
            <Inp label="Built-Up Area" req value={infra.builtUpArea ?? ''} onChange={v => upd('builtUpArea', v)} placeholder="13,712 Sq. Meters" half />
            <Inp label="Land Owner Name" req value={infra.landOwnerName ?? ''} onChange={v => upd('landOwnerName', v)} placeholder="Trust/Owner name" half />
            <YesNo label="Separate Entry & Exit Gate?" req value={infra.separateGates ?? null} onChange={v => upd('separateGates', v)} />
            {infra.separateGates && <>
              <FileUpload label="Entry Gate Image" req instituteName={instName} docType="entry-gate" value={infra.entryGateImg ?? ''} onChange={v => upd('entryGateImg', v)} half />
              <FileUpload label="Exit Gate Image" req instituteName={instName} docType="exit-gate" value={infra.exitGateImg ?? ''} onChange={v => upd('exitGateImg', v)} half />
            </>}
            <FileUpload label="Registration Desk" req instituteName={instName} docType="registration-desk" value={infra.registrationDeskImg ?? ''} onChange={v => upd('registrationDeskImg', v)} half />
            <FileUpload label="Reception Area" req instituteName={instName} docType="reception-area" value={infra.receptionAreaImg ?? ''} onChange={v => upd('receptionAreaImg', v)} half />
            <YesNo label="Parking Facility?" req value={infra.parking ?? null} onChange={v => upd('parking', v)} />
            <YesNo label="Suitable For Person With Disability (PWD)?" req value={infra.pwd ?? null} onChange={v => upd('pwd', v)} />
            {infra.pwd && <>
              <FileUpload label="PWD Facility Image" req instituteName={instName} docType="pwd" value={infra.pwdImg ?? ''} onChange={v => upd('pwdImg', v)} half />
              <Inp label="Lift Count" req value={String(infra.liftCount ?? '')} onChange={v => upd('liftCount', v)} placeholder="4" half />
              <FileUpload label="Lift Image" req instituteName={instName} docType="lift" value={infra.liftImg ?? ''} onChange={v => upd('liftImg', v)} half />
            </>}
            <YesNo label="Washrooms Available?" req value={infra.washroomsAvailable ?? null} onChange={v => upd('washroomsAvailable', v)} />
            {infra.washroomsAvailable && <>
              <YesNo label="Washrooms Available On Each Floor?" req value={infra.washroomsPerFloor ?? null} onChange={v => upd('washroomsPerFloor', v)} />
              <FileUpload label="Washrooms Image" req instituteName={instName} docType="washroom" value={infra.washroomsImg ?? ''} onChange={v => upd('washroomsImg', v)} half />
              <YesNo label="Are There Separate Male And Female Washrooms?" req value={infra.separateWashrooms ?? null} onChange={v => upd('separateWashrooms', v)} />
              {infra.separateWashrooms && <>
                <FileUpload label="Male Washroom Image" req instituteName={instName} docType="male-washroom" value={infra.maleWashroomImg ?? ''} onChange={v => upd('maleWashroomImg', v)} half />
                <FileUpload label="Female Washroom Image" req instituteName={instName} docType="female-washroom" value={infra.femaleWashroomImg ?? ''} onChange={v => upd('femaleWashroomImg', v)} half />
              </>}
            </>}
            <YesNo label="CCTV Coverage Available?" req value={infra.cctvAvailable ?? null} onChange={v => upd('cctvAvailable', v)} />
            {infra.cctvAvailable && <FileUpload label="CCTV Image" req instituteName={instName} docType="cctv" value={infra.cctvImg ?? ''} onChange={v => upd('cctvImg', v)} half />}
            <YesNo label="Drinking Water Available?" req value={infra.drinkingWater ?? null} onChange={v => upd('drinkingWater', v)} />
            {infra.drinkingWater && <FileUpload label="Drinking Water Image" req instituteName={instName} docType="drinking-water" value={infra.drinkingWaterImg ?? ''} onChange={v => upd('drinkingWaterImg', v)} half />}
            <YesNo label="AC Available In Rooms?" req value={infra.acAvailable ?? null} onChange={v => upd('acAvailable', v)} />
            {infra.acAvailable && <FileUpload label="AC Image" req instituteName={instName} docType="ac" value={infra.acImg ?? ''} onChange={v => upd('acImg', v)} half />}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={saveInfra} disabled={infraSaving} style={{ ...btnPrimary, padding: '10px 24px' }}>{infraSaving ? 'Saving…' : 'Save Basic Details'}</button>
          </div>
        </div>
      )}

      {/* Rooms */}
      {infraTab === 'rooms' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button style={btnPrimary} onClick={() => openRoom()}><Plus size={14} /> Add Room Type</button>
          </div>
          <div style={card}>
            <table style={tbl}>
              <thead><tr>{['Type Of Room', 'Room Count', 'Area', 'Person Capacity', 'Equipment', 'Pricing', 'Action'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: SUB, padding: '32px' }}>No rooms added yet.</td></tr>
                ) : rooms.map(r => (
                  <tr key={r.id}>
                    <td style={td}>{r.roomType}</td>
                    <td style={td}>{r.roomCount}</td>
                    <td style={td}>{r.area}</td>
                    <td style={td}>{r.personCapacity}</td>
                    <td style={td}>{(r.equipment ?? []).join(', ')}</td>
                    <td style={td}>₹{r.pricing} / {r.pricingUnit}</td>
                    <td style={td}>
                      <button style={btnEdit} onClick={() => openRoom(r)}><Edit2 size={14} /></button>
                      <button style={btnDanger} onClick={async () => { await api.delete(`/institute/rooms/${r.id}`); setRooms(rs => rs.filter(x => x.id !== r.id)); }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showRoomModal && (
            <Modal title={editingRoom ? 'Edit Room' : 'Add Room Type'} onClose={() => setShowRoomModal(false)}>
              <div style={row}>
                <Sel label="Type Of Room" req value={rForm.roomType} onChange={v => setRForm((f: any) => ({ ...f, roomType: v }))} options={['', 'Classroom', 'Seminar Hall', 'Conference Room', 'Library', 'Auditorium']} half error={rErrors.roomType} />
                <Inp label="Room Count" req numeric value={rForm.roomCount} onChange={v => setRForm((f: any) => ({ ...f, roomCount: v }))} placeholder="24" half error={rErrors.roomCount} />
                <Inp label="Area (Sq. Meters)" req value={rForm.area} onChange={v => setRForm((f: any) => ({ ...f, area: v }))} placeholder="60 Sq. Meters" half error={rErrors.area} />
                <Sel label="Person Intake Capacity Per Room" req value={rForm.personCapacity} onChange={v => setRForm((f: any) => ({ ...f, personCapacity: v }))} options={['', '25', '30', '40', '50', '60', '100', '200', '500']} half error={rErrors.personCapacity} />
                <Inp label="Equipment (comma separated)" req value={rForm.equipment} onChange={v => setRForm((f: any) => ({ ...f, equipment: v }))} placeholder="Digital Board, AC, Projector" error={rErrors.equipment} />
                <Inp label="Additional Notes" value={rForm.notes} onChange={v => setRForm((f: any) => ({ ...f, notes: v }))} placeholder="Any special notes" />
                <Inp label="Pricing (₹)" req decimal value={rForm.pricing} onChange={v => setRForm((f: any) => ({ ...f, pricing: v }))} placeholder="399" half error={rErrors.pricing} />
                <Sel label="Pricing Unit" req value={rForm.pricingUnit} onChange={v => setRForm((f: any) => ({ ...f, pricingUnit: v }))} options={['Per Session', 'Per Day', 'Per Hour', 'Per Month']} half />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setShowRoomModal(false)} style={{ padding: '9px 20px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveRoom} disabled={saving} style={{ ...btnPrimary, padding: '9px 20px' }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* Labs */}
      {infraTab === 'labs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button style={btnPrimary} onClick={() => openLab()}><Plus size={14} /> Add Lab</button>
          </div>
          <div style={card}>
            <table style={tbl}>
              <thead><tr>{['Lab Name', 'Building', 'Floor', 'Computers', 'Network Speed', 'Pricing', 'Action'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {labs.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: SUB, padding: '32px' }}>No labs added yet.</td></tr>
                ) : labs.map(l => (
                  <tr key={l.id}>
                    <td style={td}>{l.labName}</td>
                    <td style={td}>{l.buildingName}</td>
                    <td style={td}>{l.floor}</td>
                    <td style={td}>{l.numComputers}</td>
                    <td style={td}>{l.networkSpeed} Mbps</td>
                    <td style={td}>₹{l.pricing} / {l.pricingUnit}</td>
                    <td style={td}>
                      <button style={btnEdit} onClick={() => openLab(l)}><Edit2 size={14} /></button>
                      <button style={btnDanger} onClick={async () => { await api.delete(`/institute/labs/${l.id}`); setLabs(ls => ls.filter(x => x.id !== l.id)); }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showLabModal && (
            <Modal title={editingLab ? 'Edit Lab' : 'Add Lab'} onClose={() => setShowLabModal(false)}>
              <div style={row}>
                <Inp label="Lab Name" req value={lForm.labName} onChange={v => setLForm((f: any) => ({ ...f, labName: v }))} placeholder="Computer Lab 1" half error={lErrors.labName} />
                <Inp label="Building Name" req value={lForm.buildingName} onChange={v => setLForm((f: any) => ({ ...f, buildingName: v }))} placeholder="Main Building" half error={lErrors.buildingName} />
                <Inp label="Floor" req value={lForm.floor} onChange={v => setLForm((f: any) => ({ ...f, floor: v }))} placeholder="Ground Floor" half error={lErrors.floor} />
                <div style={{ flex: '1 1 100%', borderTop: `1px solid ${BORDER}`, margin: '4px 0' }} />
                <YesNo label="Do The Labs Have AC Available?" req value={lForm.acAvailable} onChange={v => setLForm((f: any) => ({ ...f, acAvailable: v }))} />
                <YesNo label="Do The Labs Have Fans Available?" req value={lForm.fansAvailable} onChange={v => setLForm((f: any) => ({ ...f, fansAvailable: v }))} />
                <YesNo label="Are The Labs Noise Free And Soundproof?" req value={lForm.noiseFree} onChange={v => setLForm((f: any) => ({ ...f, noiseFree: v }))} />
                <YesNo label="Do The Labs Have Partition Available Between 2 Nodes?" req value={lForm.partition} onChange={v => setLForm((f: any) => ({ ...f, partition: v }))} />
                <YesNo label="Does All The Labs Have Appropriate Lighting Available?" req value={lForm.lighting} onChange={v => setLForm((f: any) => ({ ...f, lighting: v }))} />
                <YesNo label="Do The Labs Have Printer Available?" req value={lForm.printer} onChange={v => setLForm((f: any) => ({ ...f, printer: v }))} />
                <YesNo label="CCTV Available?" req value={lForm.cctvAvailable} onChange={v => setLForm((f: any) => ({ ...f, cctvAvailable: v }))} />
                {lForm.cctvAvailable && <>
                  <Inp label="No. Of CCTV Installed" req numeric value={String(lForm.cctvCount ?? '')} onChange={v => setLForm((f: any) => ({ ...f, cctvCount: v }))} placeholder="75" half />
                  <Inp label="No. Of Nodes Covered In Surveillance" req numeric value={String(lForm.cctvNodes ?? '')} onChange={v => setLForm((f: any) => ({ ...f, cctvNodes: v }))} placeholder="20" half />
                  <Inp label="No. Of Days Recording Available" req numeric value={String(lForm.cctvDays ?? '')} onChange={v => setLForm((f: any) => ({ ...f, cctvDays: v }))} placeholder="30" half />
                  <YesNo label="Does CCTV Capture Clear And High-Quality Images?" req value={lForm.cctvHighQuality ?? null} onChange={v => setLForm((f: any) => ({ ...f, cctvHighQuality: v }))} />
                  <YesNo label="Are There Any Blind Spots?" req value={lForm.blindSpots ?? null} onChange={v => setLForm((f: any) => ({ ...f, blindSpots: v }))} />
                </>}
                <div style={{ flex: '1 1 100%', borderTop: `1px solid ${BORDER}`, margin: '4px 0' }} />
                <Sel label="Network Type" req value={lForm.networkType} onChange={v => setLForm((f: any) => ({ ...f, networkType: v }))} options={['LAN', 'WiFi', 'LAN + WiFi']} half />
                <Sel label="Single/Multiple LAN" req value={lForm.lanSingleMultiple} onChange={v => setLForm((f: any) => ({ ...f, lanSingleMultiple: v }))} options={['Single', 'Multiple']} half />
                <Sel label="LAN Type" req value={lForm.lanType} onChange={v => setLForm((f: any) => ({ ...f, lanType: v }))} options={['CAT 5', 'CAT 6', 'CAT 6A', 'Fiber']} half />
                <Sel label="Topology" req value={lForm.networkTopology} onChange={v => setLForm((f: any) => ({ ...f, networkTopology: v }))} options={['Star', 'Bus', 'Ring', 'Mesh']} half />
                <Inp label="Network Speed (In Mbps)" req numeric value={lForm.networkSpeed} onChange={v => setLForm((f: any) => ({ ...f, networkSpeed: v }))} placeholder="100" half error={lErrors.networkSpeed} />
                <div style={{ flex: '1 1 100%', borderTop: `1px solid ${BORDER}`, margin: '4px 0' }} />
                <Inp label="No. Of Computers Available" req numeric value={lForm.numComputers} onChange={v => setLForm((f: any) => ({ ...f, numComputers: v }))} placeholder="120" half error={lErrors.numComputers} />
                <Inp label="No. Of Buffers Available" req numeric value={lForm.numBuffers} onChange={v => setLForm((f: any) => ({ ...f, numBuffers: v }))} placeholder="5" half error={lErrors.numBuffers} />
                <Inp label="Company Of The Model" req value={lForm.computerCompany} onChange={v => setLForm((f: any) => ({ ...f, computerCompany: v }))} placeholder="Dell" half error={lErrors.computerCompany} />
                <Inp label="RAM Capacity" req value={lForm.ramCapacity} onChange={v => setLForm((f: any) => ({ ...f, ramCapacity: v }))} placeholder="8 GB" half error={lErrors.ramCapacity} />
                <Sel label="Operating System" req value={lForm.operatingSystem} onChange={v => setLForm((f: any) => ({ ...f, operatingSystem: v }))} options={['', 'Windows 11', 'Windows 10', 'Ubuntu', 'macOS']} half error={lErrors.operatingSystem} />
                <Inp label="Browser Name" req value={lForm.browserName} onChange={v => setLForm((f: any) => ({ ...f, browserName: v }))} placeholder="Google Chrome" half error={lErrors.browserName} />
                <Inp label="Browser Version" req value={lForm.browserVersion} onChange={v => setLForm((f: any) => ({ ...f, browserVersion: v }))} placeholder="121.X Or Latest Stable" half error={lErrors.browserVersion} />
                <div style={{ flex: '1 1 100%', borderTop: `1px solid ${BORDER}`, margin: '4px 0' }} />
                <Inp label="Pricing (₹)" req decimal value={lForm.pricing} onChange={v => setLForm((f: any) => ({ ...f, pricing: v }))} placeholder="199" half error={lErrors.pricing} />
                <Sel label="Pricing Unit" req value={lForm.pricingUnit} onChange={v => setLForm((f: any) => ({ ...f, pricingUnit: v }))} options={['Per Session', 'Per Day', 'Per Hour', 'Per Month']} half />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setShowLabModal(false)} style={{ padding: '9px 20px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveLab} disabled={saving} style={{ ...btnPrimary, padding: '9px 20px' }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* Safety */}
      {infraTab === 'safety' && (
        <div style={card}>
          <div style={row}>
            <YesNo label="First Aid Kit Available?" req value={infra.firstAidKit ?? null} onChange={v => upd('firstAidKit', v)} />
            {infra.firstAidKit && <FileUpload label="First Aid Kit Image" req instituteName={instName} docType="first-aid" value={infra.firstAidKitImg ?? ''} onChange={v => upd('firstAidKitImg', v)} half />}
            <YesNo label="Are Fire Extinguishers Available On Each Floor?" req value={infra.fireExtPerFloor ?? null} onChange={v => upd('fireExtPerFloor', v)} />
            <YesNo label="Are Fire Extinguishers Easily Accessible During Fire Emergency?" req value={infra.fireExtAccessible ?? null} onChange={v => upd('fireExtAccessible', v)} />
            {(infra.fireExtPerFloor || infra.fireExtAccessible) && <FileUpload label="Fire Extinguishers Image" req instituteName={instName} docType="fire-ext" value={infra.fireExtImg ?? ''} onChange={v => upd('fireExtImg', v)} half />}
            <YesNo label="Assembly Area In Case Of Fire Emergency?" req value={infra.assemblyArea ?? null} onChange={v => upd('assemblyArea', v)} />
            <YesNo label="Safety Signage For Emergency Evacuation?" req value={infra.safetySigns ?? null} onChange={v => upd('safetySigns', v)} />
            <YesNo label="Does The Venue Have Insurance Covered For Risk Of Assets Loss, Third Party Accidents Etc?" req value={infra.insurance ?? null} onChange={v => upd('insurance', v)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={saveInfra} disabled={infraSaving} style={{ ...btnPrimary, padding: '10px 24px' }}>{infraSaving ? 'Saving…' : 'Save Safety Details'}</button>
          </div>
        </div>
      )}

      {/* Power */}
      {infraTab === 'power' && (
        <div style={card}>
          <div style={row}>
            <YesNo label="Power Genset Available?" req value={infra.powerGenset ?? null} onChange={v => upd('powerGenset', v)} />
            {infra.powerGenset && <>
              <Sel label="Genset Type" req value={infra.gensetType ?? ''} onChange={v => upd('gensetType', v)} options={['', 'Silent Diesel Generator (SDG)', 'Open Diesel Generator', 'Gas Generator', 'Hybrid']} half />
              <Inp label="DG Capacity" req value={infra.dgCapacity ?? ''} onChange={v => upd('dgCapacity', v)} placeholder="250 KVA" half />
            </>}
            <YesNo label="Is UPS Available?" req value={infra.upsAvailable ?? null} onChange={v => upd('upsAvailable', v)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={saveInfra} disabled={infraSaving} style={{ ...btnPrimary, padding: '10px 24px' }}>{infraSaving ? 'Saving…' : 'Save Power Details'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Setup Wizard ─────────────────────────────────────────────────────────
const SETUP_STEPS = ['Program Details', 'Student Details', 'Academic Team', 'Infra Details'];

export default function InstituteSetupPage() {
  const navigate = useNavigate();
  const user     = useAuthStore(s => s.user);
  const [step, setStep]       = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [instName, setInstName]     = useState('institute');

  useEffect(() => {
    api.get('/institute/profile').then(r => {
      const savedName: string = r.data?.data?.name ?? '';
      if (savedName) setInstName(savedName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, ''));
    }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/institute/setup/complete');
      setSubmitted(true);
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '32px 32px 120px', boxSizing: 'border-box' }}>
        {/* Header */}
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Institute Registration</h1>
        <p style={{ fontSize: '13px', color: SUB, margin: '0 0 28px', lineHeight: 1.6 }}>
          "Kindly Fill In The Required Information Below To Complete Your Onboarding To The Portal. This Will Ensure A Smooth Setup And Enable Full Access To The Platform Features."
        </p>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          {SETUP_STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < SETUP_STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: done || active ? PRIMARY : '#E2E8F0', color: done || active ? '#fff' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                    {done ? <Check size={15} /> : i + 1}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? PRIMARY : done ? PRIMARY : '#94A3B8', whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < SETUP_STEPS.length - 1 && <div style={{ flex: 1, height: '2px', background: done ? PRIMARY : '#E2E8F0', margin: '0 16px' }} />}
              </div>
            );
          })}
        </div>

        <div style={{ display: step === 0 ? 'block' : 'none' }}><StepPrograms instName={instName} /></div>
        <div style={{ display: step === 1 ? 'block' : 'none' }}><StepStudents /></div>
        <div style={{ display: step === 2 ? 'block' : 'none' }}><StepAcademicTeam instName={instName} /></div>
        <div style={{ display: step === 3 ? 'block' : 'none' }}><StepInfra instName={instName} /></div>
      </div>

      {/* Fixed footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: `1px solid ${BORDER}`, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <p style={{ fontSize: '12px', color: SUB, margin: 0 }}>© 2024, Powered By <span style={{ color: PRIMARY, fontWeight: 600 }}>HubbleHox</span></p>
        <div style={{ display: 'flex', gap: '12px' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ padding: '10px 28px', border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', fontSize: '14px', fontWeight: 500, color: TEXT, cursor: 'pointer' }}>
              Back
            </button>
          )}
          <button
            onClick={() => { if (step < SETUP_STEPS.length - 1) setStep(s => s + 1); else handleSubmit(); }}
            disabled={submitting}
            style={{ padding: '10px 32px', border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Submitting…' : step === SETUP_STEPS.length - 1 ? 'Submit' : 'Next'}
          </button>
        </div>
      </div>

      {/* Success modal */}
      {submitted && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '48px 40px', textAlign: 'center', width: '360px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={30} color={PRIMARY} />
            </div>
            <p style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>Setup Complete!</p>
            <p style={{ fontSize: '13px', color: SUB, margin: '0 0 24px' }}>Your application has been submitted for review. Our team will verify and approve within 2–3 business days.</p>
            <button onClick={() => navigate('/institute/application-status')}
              style={{ background: PRIMARY, border: 'none', borderRadius: '24px', color: '#fff', fontSize: '15px', fontWeight: 600, padding: '12px 48px', cursor: 'pointer' }}>
              Track Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
