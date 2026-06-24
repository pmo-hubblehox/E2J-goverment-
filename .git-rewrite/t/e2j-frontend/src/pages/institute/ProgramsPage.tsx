import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, Plus, ChevronDown, X, Paperclip, ChevronUp, Download, Trash2, Filter, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { downloadCSV } from '../../utils/csvExport';
import { downloadCreditStructureSample, downloadSyllabusSample, downloadCalendarSample } from '../../utils/sampleExcel';
import api from '../../services/api';
import type { Program, ApiResponse, PaginatedResponse } from '../../types';

// ── Excel validators ──────────────────────────────────────────────────────────

function validateSyllabus(file: File): Promise<string | null> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) return resolve('File has no sheets.');
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (rows.length < 2) return resolve('File is empty — no data rows found.');
        const hdr = rows[0].map((h: any) => String(h).toLowerCase().trim());
        const required = ['semester', 'subject code', 'subject name', 'module no', 'module name'];
        const missing = required.filter(r => !hdr.some(h => h.includes(r.split(' ')[0]) && h.includes(r.split(' ').slice(-1)[0])));
        if (missing.length) return resolve(`Missing required columns: ${missing.map(m => `"${m}"`).join(', ')}. Please use the Sample Syllabus format.`);
        const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim()));
        if (dataRows.length === 0) return resolve('File has headers but no data. Please add syllabus content.');
        const semCol = hdr.findIndex(h => h.includes('semester'));
        const semesters = new Set(dataRows.map(r => String(r[semCol] || '').trim()).filter(Boolean));
        if (semesters.size === 0) return resolve('No semester values found. Ensure the Semester column is filled.');
        resolve(null);
      } catch { resolve('Could not read the file. Ensure it is a valid .xlsx or .xls file.'); }
    };
    reader.readAsArrayBuffer(file);
  });
}

function validateCreditStructure(file: File): Promise<string | null> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' });
        const ws = wb.Sheets['Credit Structure'] ?? wb.Sheets[wb.SheetNames[0]];
        if (!ws) return resolve('File has no sheets.');
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (rows.length < 2) return resolve('File is empty — no data rows found.');
        const hdr = rows[0].map((h: any) => String(h).toLowerCase().trim());
        if (!hdr.some(h => h.includes('semester')) || !hdr.some(h => h.includes('course') || h.includes('subject'))) {
          return resolve('Missing required columns. Expected at least "Semester" and "Course Name/Subject". Please use the Sample Credits format.');
        }
        const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim()));
        if (dataRows.length === 0) return resolve('File has headers but no data. Please add credit structure content.');
        resolve(null);
      } catch { resolve('Could not read the file. Ensure it is a valid .xlsx or .xls file.'); }
    };
    reader.readAsArrayBuffer(file);
  });
}

function validateCalendar(file: File): Promise<string | null> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) return resolve('File has no sheets.');
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (rows.length < 2) return resolve('File is empty — no data rows found.');
        const hdr = rows[0].map((h: any) => String(h).toLowerCase().trim());
        if (!hdr.some(h => h.includes('day') || h.includes('date') || h.includes('semester'))) {
          return resolve('Missing required columns. Expected "Day/Date" and "Semester". Please use the Sample Calendar format.');
        }
        const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim()));
        if (dataRows.length === 0) return resolve('File has headers but no data. Please add calendar content.');
        resolve(null);
      } catch { resolve('Could not read the file. Ensure it is a valid .xlsx or .xls file.'); }
    };
    reader.readAsArrayBuffer(file);
  });
}

const DOC_VALIDATORS: Record<string, (f: File) => Promise<string | null>> = {
  syllabus: validateSyllabus,
  credit:   validateCreditStructure,
  calendar: validateCalendar,
};

const PRIMARY = '#3F41D1';
const BORDER  = '#E2E8F0';
const TEXT    = '#212121';
const SUB     = '#666666';

const DEGREES         = ['B.Tech', 'M.Tech', 'MBA', 'BBA', 'B.Sc', 'M.Sc', 'Ph.D', 'Diploma'];
const DURATIONS       = ['1 Year', '2 Years', '3 Years', '4 Years', '5 Years', '6 Years'];
const ACADEMIC_YEARS  = (() => {
  const base = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => { const y = base - 1 + i; return `${y}-${String(y + 1).slice(2)}`; });
})();
const SPECIALIZATIONS = [
  'Artificial Intelligence & Data Science', 'Robotics', 'Cloud Computing',
  'Cyber Security', 'VLSI Design', 'Embedded Systems', 'Finance', 'Marketing', 'HR',
];

const hcol: React.CSSProperties = {
  padding: '10px 16px', fontSize: '12px', fontWeight: 600, color: SUB,
  background: '#F8FAFC', borderBottom: `1px solid ${BORDER}`, textAlign: 'left', whiteSpace: 'nowrap',
};
const col: React.CSSProperties = {
  padding: '14px 16px', fontSize: '13px', color: TEXT, borderBottom: `1px solid ${BORDER}`,
};

/* ── Floating label input ─────────────────────────────────── */
function FloatInput({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  const up = focused || value !== '';
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1px solid ${focused ? PRIMARY : BORDER}`, borderRadius: '8px',
          padding: up ? '22px 14px 8px' : '15px 14px',
          fontSize: '14px', outline: 'none', background: '#fff', color: TEXT, transition: 'all .15s',
        }}
      />
      <label style={{
        position: 'absolute', left: '14px', top: up ? '7px' : '50%',
        transform: up ? 'none' : 'translateY(-50%)',
        fontSize: up ? '11px' : '14px', color: up ? PRIMARY : '#94A3B8',
        pointerEvents: 'none', transition: 'all .15s', fontWeight: up ? 600 : 400,
      }}>{label} *</label>
    </div>
  );
}

/* ── Floating label select ────────────────────────────────── */
function FloatSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  const [focused, setFocused] = useState(false);
  const up = focused || value !== '';
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1px solid ${focused ? PRIMARY : BORDER}`, borderRadius: '8px',
          padding: up ? '22px 36px 8px 14px' : '15px 36px 15px 14px',
          fontSize: '14px', outline: 'none', background: '#fff', color: up ? TEXT : 'transparent',
          appearance: 'none', cursor: 'pointer', transition: 'all .15s',
        }}
      >
        <option value="" />
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <label style={{
        position: 'absolute', left: '14px', top: up ? '7px' : '50%',
        transform: up ? 'none' : 'translateY(-50%)',
        fontSize: up ? '11px' : '14px', color: up ? PRIMARY : '#94A3B8',
        pointerEvents: 'none', transition: 'all .15s', fontWeight: up ? 600 : 400,
      }}>{label} *</label>
      <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: SUB, pointerEvents: 'none' }} />
    </div>
  );
}

/* ── Multi-select specializations ─────────────────────────── */
function MultiSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setFocused(false); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o]);
  const up = focused || value.length > 0;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => { setOpen(o => !o); setFocused(true); }}
        style={{
          border: `1px solid ${focused ? PRIMARY : BORDER}`, borderRadius: '8px',
          padding: up ? '22px 40px 8px 14px' : '15px 40px 15px 14px',
          minHeight: '52px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px',
          cursor: 'pointer', background: '#fff', position: 'relative', transition: 'all .15s',
        }}
      >
        <label style={{
          position: 'absolute', left: '14px', top: up ? '7px' : '50%',
          transform: up ? 'none' : 'translateY(-50%)',
          fontSize: up ? '11px' : '14px', color: up ? PRIMARY : '#94A3B8',
          pointerEvents: 'none', transition: 'all .15s', fontWeight: up ? 600 : 400,
        }}>Area of Specialization *</label>
        {value.map(v => (
          <span key={v} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#EEEEFF', border: `1px solid #C7C9F7`, borderRadius: '6px', padding: '3px 8px', fontSize: '12px', color: PRIMARY }}>
            {v}
            <button type="button" onClick={e => { e.stopPropagation(); toggle(v); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: PRIMARY, display: 'flex' }}>
              <X size={11} />
            </button>
          </span>
        ))}
        <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: SUB }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, marginTop: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {SPECIALIZATIONS.map(o => (
            <div key={o} onClick={() => toggle(o)}
              style={{ padding: '9px 14px', fontSize: '13px', cursor: 'pointer', background: value.includes(o) ? '#EEEEFF' : '#fff', color: value.includes(o) ? PRIMARY : TEXT, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', border: `2px solid ${value.includes(o) ? PRIMARY : BORDER}`, borderRadius: '3px', background: value.includes(o) ? PRIMARY : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {value.includes(o) && <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700 }}>✓</span>}
              </div>
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const BACKEND = 'http://localhost:8081';
const docUrl = (url?: string | null) => url ? (url.startsWith('http') ? url : `${BACKEND}${url}`) : null;

interface DocFieldProps {
  label: string;
  docType: string;
  savedUrl: string | null;
  onDownloadSample: () => void;
  programId: number;
  onSaved: (url: string) => void;
  accept?: string;
  hint?: string;
}

function DocUploadField({ label, docType, savedUrl, onDownloadSample, programId, onSaved, accept = '.pdf,.xlsx,.xls', hint = 'PDF / Excel (.xlsx) — Max 10MB' }: DocFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate Excel files before uploading
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const validator = DOC_VALIDATORS[docType];
    if (isExcel && validator) {
      const err = await validator(file);
      if (err) { setError(err); return; }
    }

    // Size check — 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum allowed size is 10MB.');
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('docType', docType);
    try {
      const r = await api.post(`/institute/programs/${programId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSaved(r.data?.data?.url ?? '');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const fileName = savedUrl ? savedUrl.split('/').pop() : null;
  const viewHref = docUrl(savedUrl);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{label} <span style={{ color: '#EF4444' }}>*</span></label>
        <button type="button" onClick={onDownloadSample}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: `1px solid ${PRIMARY}`, borderRadius: '16px', padding: '4px 12px', fontSize: '12px', color: PRIMARY, cursor: 'pointer' }}>
          <Download size={12} /> Download Sample
        </button>
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', marginBottom: '8px' }}>
          <AlertCircle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '12px', color: '#DC2626', lineHeight: 1.5 }}>{error}</span>
        </div>
      )}
      {uploading ? (
        <div style={{ padding: '14px', background: '#EEF2FF', border: `1px solid #C7D2FE`, borderRadius: '8px', fontSize: '13px', color: PRIMARY }}>
          Uploading…
        </div>
      ) : savedUrl ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px' }}>
          <span style={{ fontSize: '13px', color: '#16A34A', fontWeight: 500 }}>✓ {fileName}</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {viewHref && (
              <a href={viewHref} target="_blank" rel="noreferrer"
                style={{ fontSize: '12px', color: PRIMARY, fontWeight: 500, textDecoration: 'none' }}>View</a>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#64748B', fontSize: '12px', fontWeight: 500 }}>
              <input type="file" accept={accept} hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              Replace
            </label>
          </div>
        </div>
      ) : (
        <label style={{ display: 'block', border: '2px dashed #CBD5E1', borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#FAFAFA' }}>
          <input type="file" accept={accept} hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: SUB }}>Drag your file here or <span style={{ color: PRIMARY, fontWeight: 600 }}>Browse File</span></p>
          <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{hint}</p>
        </label>
      )}
    </div>
  );
}

/* ── Program detail accordion (with doc upload) ───────────── */
function ProgramDetailAccordion({ majorName, programName, programId, initialSyllabusUrl, initialCreditUrl, initialCalendarUrl }: {
  majorName: string; programName: string; programId: number;
  initialSyllabusUrl?: string | null; initialCreditUrl?: string | null; initialCalendarUrl?: string | null;
}) {
  const [open, setOpen]           = useState(true);
  const [syllabusUrl, setSyllabusUrl]   = useState<string | null>(initialSyllabusUrl ?? null);
  const [creditUrl, setCreditUrl]       = useState<string | null>(initialCreditUrl   ?? null);
  const [calendarUrl, setCalendarUrl]   = useState<string | null>(initialCalendarUrl ?? null);

  const allDone = !!(syllabusUrl && creditUrl && calendarUrl);

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '8px' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#F8FAFC', cursor: 'pointer' }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: TEXT }}>{programName} — {majorName}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: allDone ? '#DCFCE7' : '#FEF3C7', color: allDone ? '#16A34A' : '#D97706', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
            {allDone ? 'Complete' : 'InProgress'}
          </span>
          {open ? <ChevronUp size={16} color={SUB} /> : <ChevronDown size={16} color={SUB} />}
        </div>
      </div>
      {open && (
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DocUploadField label="Program Syllabus"        docType="syllabus" savedUrl={syllabusUrl} onDownloadSample={downloadSyllabusSample}       programId={programId} onSaved={setSyllabusUrl} />
          <DocUploadField label="Program Credit Structure" docType="credit"   savedUrl={creditUrl}   onDownloadSample={downloadCreditStructureSample} programId={programId} onSaved={setCreditUrl} />
          <DocUploadField label="Program Calendar"        docType="calendar" savedUrl={calendarUrl} onDownloadSample={downloadCalendarSample}        programId={programId} onSaved={setCalendarUrl} />
        </div>
      )}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function ProgramsPage() {
  const navigate = useNavigate();
  const [view, setView]           = useState<'list' | 'add'>('list');
  const [programs, setPrograms]   = useState<Program[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [brochure, setBrochure]   = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkMsg, setBulkMsg]     = useState('');
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const handleBulkUpload = async (file: File) => {
    setBulkUploading(true); setBulkMsg('');
    const fd = new FormData(); fd.append('file', file);
    try {
      await api.post('/institute/programs/bulk-upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBulkMsg('Upload successful!');
      load();
    } catch { setBulkMsg('Upload failed. Please use a valid CSV/Excel file.'); }
    finally { setBulkUploading(false); if (bulkInputRef.current) bulkInputRef.current.value = ''; }
  };
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState({
    degree: '', name: '', duration: '', intakeCapacity: '', totalFees: '', majors: [] as string[], academicYear: '',
  });

  const load = () => {
    setLoading(true);
    api.get<ApiResponse<PaginatedResponse<Program>>>('/institute/programs', { params: { size: 50 } })
      .then(r => setPrograms(r.data.data.content ?? []))
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openEdit = (p: Program) => {
    setEditingId(p.id);
    setForm({
      degree: p.degree,
      name: p.name,
      duration: `${p.duration} Year${p.duration !== 1 ? 's' : ''}`,
      intakeCapacity: String(p.intakeCapacity),
      totalFees: String(p.totalFees),
      majors: p.majors ?? [],
      academicYear: p.academicYear ?? '',
    });
    setBrochure(null);
    setSaveError('');
    setSavedProgram(p);   // existing program already has an id — unlock doc uploads immediately
    setView('add');
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ degree: '', name: '', duration: '', intakeCapacity: '', totalFees: '', majors: [] });
    setBrochure(null);
    setSaveError('');
    setSavedProgram(null);
  };

  const isValid = () =>
    !!form.degree && !!form.name && !!form.duration && !!form.intakeCapacity && !!form.totalFees && form.majors.length > 0;

  const [savedProgram, setSavedProgram] = useState<Program | null>(null);

  const handleSave = async (asDraft: boolean) => {
    if (!isValid()) { setSaveError('Please fill in all required fields.'); return; }
    setSaving(true); setSaveError('');
    try {
      const payload = {
        degree: form.degree,
        name: form.name,
        duration: parseInt(form.duration) || 4,
        intakeCapacity: parseInt(form.intakeCapacity) || 0,
        totalFees: parseFloat(form.totalFees) || 0,
        majors: form.majors,
        status: asDraft ? 'DRAFT' : 'UPLOADED',
      };
      let saved: Program;
      if (editingId) {
        const r = await api.put(`/institute/programs/${editingId}`, payload);
        saved = r.data?.data ?? { id: editingId, ...payload } as any;
      } else {
        const r = await api.post('/institute/programs', payload);
        saved = r.data?.data;
      }
      setSavedProgram(saved);
      load();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? err?.message ?? 'Save failed. Please try again.');
    } finally { setSaving(false); }
  };

  const handleFinish = async () => {
    if (savedProgram) {
      const majors = savedProgram.majors ?? [];
      const academicYear = form.academicYear || (() => {
        const now = new Date();
        const sy = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
        return `${sy}-${String((sy + 1) % 100).padStart(2, '0')}`;
      })();

      // Create one curriculum entry per specialization — dedup on backend is safe
      await Promise.all(
        (majors.length > 0 ? majors : ['']).map(major =>
          api.post('/institute/curriculum', {
            programId:   savedProgram.id,
            programName: savedProgram.name,
            degree:      savedProgram.degree,
            major,
            duration:    savedProgram.duration,
            academicYear,
          }).catch(() => {})
        )
      );
      navigate('/institute/curriculum', { state: { program: savedProgram } });
    }
    setSavedProgram(null);
    setView('list');
    resetForm();
  };

  const [degreeFilter, setDegreeFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const display = programs.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.degree.toLowerCase().includes(q);
    const matchDegree = !degreeFilter || p.degree === degreeFilter;
    return matchSearch && matchDegree;
  });

  const handleExport = () => {
    downloadCSV('programs.csv',
      ['Program ID', 'Degree', 'Name', 'Major', 'Duration (Years)', 'Intake Capacity', 'Total Fees', 'Status'],
      display.map(p => [p.programId ?? '', p.degree, p.name, (p.majors ?? []).join('; '), p.duration, p.intakeCapacity, p.totalFees, p.status ?? ''])
    );
  };

  /* ── Add / Edit form ── */
  if (view === 'add') return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8', marginBottom: '20px' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => { setView('list'); resetForm(); }}>Home</span>
        <span>›</span>
        <span style={{ cursor: 'pointer' }} onClick={() => { setView('list'); resetForm(); }}>Program Listing</span>
        <span>›</span>
        <span style={{ color: TEXT, fontWeight: 500 }}>{editingId ? 'Edit Program' : 'Add Program'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <FloatSelect label="Degree" value={form.degree} onChange={v => setForm(f => ({ ...f, degree: v }))} options={DEGREES} />
        <FloatInput  label="Name of Program" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
        <FloatSelect label="Duration" value={form.duration} onChange={v => setForm(f => ({ ...f, duration: v }))} options={DURATIONS} />

        {/* Brochure — floating label file picker */}
        <div style={{ position: 'relative' }}>
          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: `1px solid ${BORDER}`, borderRadius: '8px',
            padding: brochure ? '22px 14px 8px' : '15px 14px',
            cursor: 'pointer', background: '#fff', minHeight: '52px', transition: 'all .15s',
          }}>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={e => setBrochure(e.target.files?.[0] ?? null)} />
            <span style={{ fontSize: '14px', color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {brochure ? brochure.name : ''}
            </span>
            {brochure
              ? <button type="button" onClick={e => { e.preventDefault(); setBrochure(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex' }}><X size={14} /></button>
              : <Paperclip size={16} style={{ color: SUB, flexShrink: 0 }} />
            }
          </label>
          <label style={{
            position: 'absolute', left: '14px', top: brochure ? '7px' : '50%',
            transform: brochure ? 'none' : 'translateY(-50%)',
            fontSize: brochure ? '11px' : '14px', color: brochure ? PRIMARY : '#94A3B8',
            pointerEvents: 'none', transition: 'all .15s', fontWeight: brochure ? 600 : 400,
          }}>Brochure *</label>
          {!brochure && <p style={{ margin: '4px 0 0 2px', fontSize: '11px', color: '#94A3B8' }}>PDF, JPG, JPEG, PNG — Max 1MB</p>}
        </div>

        <FloatInput label="Intake Capacity" value={form.intakeCapacity} onChange={v => setForm(f => ({ ...f, intakeCapacity: v }))} type="number" />
        <FloatInput label="Program Fees (In INR)" value={form.totalFees} onChange={v => setForm(f => ({ ...f, totalFees: v }))} type="number" />
        <FloatSelect label="Academic Year" value={form.academicYear} onChange={v => setForm(f => ({ ...f, academicYear: v }))} options={ACADEMIC_YEARS} />

        <div style={{ gridColumn: 'span 2' }}>
          <MultiSelect value={form.majors} onChange={majors => setForm(f => ({ ...f, majors }))} />
        </div>
      </div>

      {/* Program Details */}
      {form.majors.length > 0 && form.name && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>
              Program Details <span style={{ color: '#EF4444' }}>*</span>
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={downloadSyllabusSample}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: `1px solid ${SUB}`, borderRadius: '16px', padding: '6px 14px', fontSize: '12px', color: SUB, cursor: 'pointer' }}>
                <Download size={12} /> Sample Syllabus
              </button>
              <button type="button" onClick={downloadCreditStructureSample}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: `1px solid ${SUB}`, borderRadius: '16px', padding: '6px 14px', fontSize: '12px', color: SUB, cursor: 'pointer' }}>
                <Download size={12} /> Sample Credits
              </button>
              <button type="button" onClick={downloadCalendarSample}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: `1px solid ${SUB}`, borderRadius: '16px', padding: '6px 14px', fontSize: '12px', color: SUB, cursor: 'pointer' }}>
                <Download size={12} /> Sample Calendar
              </button>
              <button style={{ border: 'none', borderRadius: '20px', background: PRIMARY, color: '#fff', padding: '8px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Bulk Upload
              </button>
            </div>
          </div>
          {savedProgram
            ? form.majors.map(m => (
                <ProgramDetailAccordion key={m} majorName={m} programName={form.name}
                  programId={savedProgram.id}
                  initialSyllabusUrl={savedProgram.syllabusUrl}
                  initialCreditUrl={savedProgram.creditStructureUrl}
                  initialCalendarUrl={savedProgram.calendarUrl}
                />
              ))
            : form.majors.map(m => (
                <div key={m} style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px 18px', background: '#F8FAFC', color: '#94A3B8', fontSize: '13px' }}>
                  {form.name} — {m} &nbsp;·&nbsp; <em>Save the program first to upload documents</em>
                </div>
              ))
          }
        </div>
      )}

      {saveError && (
        <div style={{ marginBottom: '12px', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', fontSize: '13px', color: '#B91C1C' }}>
          ⚠️ {saveError}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: `1px solid ${BORDER}` }}>
        {savedProgram ? (
          <button onClick={handleFinish}
            style={{ border: 'none', borderRadius: '20px', background: '#16A34A', color: '#fff', padding: '10px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Done
          </button>
        ) : (
          <>
            <button onClick={() => { setView('list'); resetForm(); }}
              style={{ border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', padding: '10px 24px', fontSize: '14px', fontWeight: 500, color: TEXT, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={() => handleSave(true)} disabled={saving}
              style={{ border: `1px solid ${BORDER}`, borderRadius: '20px', background: '#fff', padding: '10px 24px', fontSize: '14px', fontWeight: 500, color: TEXT, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              Save As Draft
            </button>
            <button onClick={() => handleSave(false)} disabled={saving || !isValid()}
              style={{ border: 'none', borderRadius: '20px', background: isValid() && !saving ? '#E04D8A' : BORDER, color: isValid() && !saving ? '#fff' : SUB, padding: '10px 28px', fontSize: '14px', fontWeight: 600, cursor: isValid() && !saving ? 'pointer' : 'not-allowed' }}>
              {saving ? 'Saving…' : 'Upload'}
            </button>
          </>
        )}
      </div>
    </div>
  );

  /* ── List view ── */
  return (
    <div style={{ padding: '20px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
        <span>Program Management</span><span>›</span>
        <span style={{ color: TEXT, fontWeight: 500 }}>Program Listing</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 32px', border: `1px solid ${BORDER}`, borderRadius: '20px', fontSize: '13px', outline: 'none', background: '#fff' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFilter(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${showFilter || degreeFilter ? '#3F41D1' : BORDER}`, borderRadius: '8px', background: showFilter || degreeFilter ? '#EEF2FF' : '#fff', padding: '9px 14px', fontSize: '13px', color: showFilter || degreeFilter ? '#3F41D1' : SUB, cursor: 'pointer' }}>
            <Filter size={13} /> Filter {degreeFilter && `(${degreeFilter})`}
          </button>
          {showFilter && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, padding: '12px', minWidth: '180px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', margin: '0 0 8px' }}>Degree</p>
              {['', ...DEGREES].map(d => (
                <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', fontSize: '13px', color: '#1E293B' }}>
                  <input type="radio" name="degFilter" checked={degreeFilter === d} onChange={() => { setDegreeFilter(d); setShowFilter(false); }} style={{ accentColor: '#3F41D1' }} />
                  {d || 'All Degrees'}
                </label>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', padding: '9px 14px', fontSize: '13px', color: SUB, cursor: 'pointer' }}>
          <Download size={13} /> Export
        </button>
        <input ref={bulkInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleBulkUpload(e.target.files[0]); }} />
        <button onClick={() => bulkInputRef.current?.click()} disabled={bulkUploading} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', padding: '9px 14px', fontSize: '13px', color: SUB, cursor: bulkUploading ? 'not-allowed' : 'pointer', opacity: bulkUploading ? 0.7 : 1 }}>
          <Upload size={13} /> {bulkUploading ? 'Uploading…' : 'Bulk Upload'}
        </button>
        {bulkMsg && <span style={{ fontSize: '12px', color: bulkMsg.includes('success') ? '#16A34A' : '#DC2626' }}>{bulkMsg}</span>}
        <button onClick={() => { resetForm(); setView('add'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
          <Plus size={14} /> Add Program
        </button>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Program ID', 'Degree', 'Name Of Program', 'Major', 'Duration (Years)', 'Intake', 'Status', 'Action'].map(h => (
                <th key={h} style={hcol}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>Loading…</td></tr>
            ) : display.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>No programs found. Click "+ Add Program" to get started.</td></tr>
            ) : display.map(p => (
              <tr key={p.id} style={{ transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFF')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td style={{ ...col, color: PRIMARY, fontWeight: 700, fontSize: '12px' }}>{p.programId ?? '—'}</td>
                <td style={col}>{p.degree}</td>
                <td style={{ ...col, fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                <td style={{ ...col, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: SUB }}>{p.majors?.[0] ?? '—'}</td>
                <td style={col}>{p.duration}</td>
                <td style={col}>{p.intakeCapacity}</td>
                <td style={col}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: p.status === 'UPLOADED' ? '#16A34A' : '#D97706' }}>{p.status}</span>
                </td>
                <td style={col}>
                  <button onClick={() => openEdit(p)}
                    style={{ color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
