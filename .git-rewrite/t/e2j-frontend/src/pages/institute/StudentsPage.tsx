import { useEffect, useRef, useState } from 'react';
import { Search, Filter, Download, Upload, X } from 'lucide-react';
import api from '../../services/api';
import { downloadCSV } from '../../utils/csvExport';

interface Student {
  id: number;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  degree: string;
  schoolUniversity: string;
  major: string;
  yearOfPassing: string;
  cgpa: number;
  status: string;
}


const STATUS_STYLE: Record<string, React.CSSProperties> = {
  ACTIVE: { color: '#4F46E5', fontWeight: 700 },
  PLACED: { color: '#16A34A', fontWeight: 700 },
  INACTIVE: { color: '#DC2626', fontWeight: 700 },
};

const col: React.CSSProperties = { padding: '13px 16px', fontSize: '13px', color: '#1E293B', borderBottom: '1px solid #F1F5F9' };
const hcol: React.CSSProperties = { padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' as const };

const AVATAR_COLORS = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#7C3AED'];

function StudentDetailDrawer({ student, onClose }: { student: Student; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{ width: '400px', background: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>Student Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: AVATAR_COLORS[student.id % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, flexShrink: 0 }}>
              {student.name[0]}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>{student.name}</div>
              <div style={{ fontSize: '13px', color: '#64748B' }}>{student.email}</div>
              <span style={{ ...(STATUS_STYLE[student.status] ?? {}), fontSize: '12px' }}>{student.status}</span>
            </div>
          </div>

          {[
            { label: 'Student ID',           value: student.studentId },
            { label: 'Email',                value: student.email },
            { label: 'Phone',                value: student.phone },
            { label: 'Degree/Qualification', value: student.degree },
            { label: 'School/University',    value: student.schoolUniversity },
            { label: 'Major/Specialization', value: student.major },
            { label: 'Year Of Passing',      value: student.yearOfPassing },
            { label: 'CGPA',                 value: student.cgpa ? String(student.cgpa) : '—' },
          ].filter(r => r.value).map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>{row.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BulkUploadModal({ onClose }: { onClose: (uploaded: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const downloadSample = async () => {
    try {
      const res = await api.get('/institute/students/sample', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'students_sample.xlsx'; a.click(); URL.revokeObjectURL(url);
    } catch { alert('Could not download sample.'); }
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file first.'); return; }
    setUploading(true); setError('');
    try {
      const fd = new FormData(); fd.append('file', file);
      await api.post('/institute/students/bulk', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onClose(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Upload failed. Check the file format and try again.');
    } finally { setUploading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '460px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>Bulk Upload Students</h3>
          <button onClick={() => onClose(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
        </div>

        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 8px', lineHeight: 1.6 }}>
          Download the sample Excel file, fill in student data, then upload it here.
        </p>
        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#3F41D1', lineHeight: 1.6 }}>
          ✓ Student login accounts are auto-created for each row with an email address.<br />
          Login ID = Email address &nbsp;·&nbsp; Password = Email address
        </div>

        <button onClick={downloadSample}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #4F46E5', borderRadius: '8px', background: '#EEF2FF', color: '#4F46E5', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '20px' }}>
          <Download size={14} /> Download Sample Excel
        </button>

        <div onClick={() => inputRef.current?.click()}
          style={{ border: '2px dashed #CBD5E1', borderRadius: '10px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: file ? '#F0FDF4' : '#FAFAFA', marginBottom: '16px' }}>
          <Upload size={24} style={{ color: file ? '#16A34A' : '#94A3B8', margin: '0 auto 8px' }} />
          {file
            ? <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#16A34A' }}>{file.name}</p>
            : <>
                <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Click to browse or drag & drop</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>Accepts .xlsx, .xls files only</p>
              </>
          }
          <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
            onChange={e => { setFile(e.target.files?.[0] ?? null); setError(''); }} />
        </div>

        {error && <p style={{ fontSize: '12px', color: '#EF4444', margin: '0 0 14px' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={() => onClose(false)} style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleUpload} disabled={uploading}
            style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: uploading ? '#818CF8' : '#4338CA', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer' }}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

const FI = ({ label, value, onChange, req, placeholder }: { label: string; value: string; onChange: (v: string) => void; req?: boolean; placeholder?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{label}{req && <span style={{ color: '#EF4444' }}> *</span>}</label>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? ''}
      style={{ padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff' }} />
  </div>
);

function AddStudentModal({ onClose }: { onClose: (added: boolean) => void }) {
  const [form, setForm] = useState({ studentId: '', name: '', email: '', phone: '', degree: '', schoolUniversity: '', major: '', yearOfPassing: '', cgpa: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Full Name is required.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/institute/students', {
        studentId: form.studentId || null,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        degree: form.degree || null,
        schoolUniversity: form.schoolUniversity || null,
        major: form.major || null,
        yearOfPassing: form.yearOfPassing || null,
        cgpa: form.cgpa ? parseFloat(form.cgpa) : null,
      });
      onClose(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to add student. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>Add Student</h3>
          <button onClick={() => onClose(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <FI label="Full Name" value={form.name} onChange={set('name')} req />
          <FI label="Student ID / Roll No" value={form.studentId} onChange={set('studentId')} placeholder="e.g. PIT-2024-CSE-001" />
          <FI label="Email" value={form.email} onChange={set('email')} placeholder="student@college.edu" />
          <FI label="Phone" value={form.phone} onChange={set('phone')} placeholder="10-digit number" />
        </div>

        <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.05em' }}>Education Details</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
          <FI label="Degree / Qualification" value={form.degree} onChange={set('degree')} placeholder="e.g. B.Tech, MBA" />
          <FI label="School / University" value={form.schoolUniversity} onChange={set('schoolUniversity')} placeholder="e.g. IIT Bombay" />
          <FI label="Major / Specialization" value={form.major} onChange={set('major')} placeholder="e.g. Computer Science" />
          <FI label="Year Of Passing" value={form.yearOfPassing} onChange={set('yearOfPassing')} placeholder="e.g. 2025" />
          <FI label="CGPA / Percentage" value={form.cgpa} onChange={set('cgpa')} placeholder="e.g. 8.5" />
        </div>

        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '12px', color: '#3F41D1', lineHeight: 1.6 }}>
          ✓ A login account will be auto-created if an email is provided.<br />
          Login ID = Email &nbsp;·&nbsp; Password = Email
        </div>

        {error && <p style={{ fontSize: '12px', color: '#EF4444', margin: '0 0 14px' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={() => onClose(false)} style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: saving ? '#818CF8' : '#4338CA', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Add Student'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = () => {
    api.get('/institute/students', { params: { size: 50 } })
      .then((r: any) => setStudents(r.data.data?.content ?? []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const display = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(q) || (s.studentId ?? '').toLowerCase().includes(q) || (s.degree ?? '').toLowerCase().includes(q) || (s.schoolUniversity ?? '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    downloadCSV('students.csv',
      ['Name', 'Student ID', 'Email', 'Phone', 'Degree', 'School/University', 'Major', 'Year Of Passing', 'CGPA', 'Status'],
      display.map(s => [s.name, s.studentId, s.email, s.phone, s.degree, s.schoolUniversity, s.major, s.yearOfPassing, s.cgpa, s.status])
    );
  };

  return (
    <div style={{ padding: '20px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
        <span>Home</span><span>›</span><span style={{ color: '#1E293B', fontWeight: 500 }}>Students</span>
      </div>

      {successMsg && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 16px', marginBottom: '12px', fontSize: '13px', color: '#15803D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {successMsg}
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803D' }}><X size={14} /></button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 32px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#fff' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowFilter(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${showFilter || statusFilter ? '#3F41D1' : '#E2E8F0'}`, borderRadius: '8px', background: showFilter || statusFilter ? '#EEF2FF' : '#fff', padding: '9px 14px', fontSize: '13px', color: showFilter || statusFilter ? '#3F41D1' : '#64748B', cursor: 'pointer' }}>
            <Filter size={13} /> Filter {statusFilter && `(${statusFilter})`}
          </button>
          {showFilter && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, padding: '12px', minWidth: '200px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', margin: '0 0 8px' }}>Status</p>
              {['', 'ACTIVE', 'PLACED', 'INACTIVE'].map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', fontSize: '13px', color: '#1E293B' }}>
                  <input type="radio" name="statusFilter" checked={statusFilter === s} onChange={() => { setStatusFilter(s); setShowFilter(false); }} style={{ accentColor: '#3F41D1' }} />
                  {s || 'All Statuses'}
                </label>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', padding: '9px 14px', fontSize: '13px', color: '#64748B', cursor: 'pointer' }}>
          <Download size={13} /> Export
        </button>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #3F41D1', borderRadius: '20px', background: '#fff', color: '#3F41D1', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            + Add Student
          </button>
          <button onClick={() => setShowUpload(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', border: 'none', borderRadius: '20px', background: '#E04D8A', color: '#fff', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <Upload size={14} /> Bulk Upload
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Student Name', 'Student ID', 'Degree', 'School/University', 'Year Of Passing', 'CGPA', 'Status', ''].map(h => (
                <th key={h} style={hcol}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map((s, i) => (
              <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudent(s)}>
                <td style={col}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                      {s.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{s.name}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>{s.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...col, color: '#4F46E5' }}>{s.studentId || '—'}</td>
                <td style={col}>{s.degree || '—'}</td>
                <td style={col}>{s.schoolUniversity || '—'}</td>
                <td style={col}>{s.yearOfPassing || '—'}</td>
                <td style={{ ...col, fontWeight: 600, color: s.cgpa >= 8.5 ? '#16A34A' : s.cgpa >= 7 ? '#1E293B' : '#DC2626' }}>{s.cgpa || '—'}</td>
                <td style={col}><span style={STATUS_STYLE[s.status] ?? { color: '#64748B', fontWeight: 700 }}>{s.status}</span></td>
                <td style={col}>
                  <button onClick={e => { e.stopPropagation(); setSelectedStudent(s); }}
                    style={{ background: '#EEF2FF', border: 'none', borderRadius: '6px', color: '#4F46E5', padding: '4px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {display.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>No students found. Use Bulk Upload to add students.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
        <span style={{ fontSize: '13px', color: '#64748B' }}>Showing {display.length} students</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['←', '1', '2', '3', '→'].map((p, i) => (
            <button key={i} style={{ width: '28px', height: '28px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '12px', background: p === '1' ? '#4338CA' : '#fff', color: p === '1' ? '#fff' : '#64748B', cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      </div>

      {selectedStudent && <StudentDetailDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
      {showUpload && (
        <BulkUploadModal onClose={(uploaded) => {
          setShowUpload(false);
          if (uploaded) { setSuccessMsg('Students uploaded successfully!'); load(); }
        }} />
      )}
      {showAdd && (
        <AddStudentModal onClose={(added) => {
          setShowAdd(false);
          if (added) { setSuccessMsg('Student added successfully!'); load(); }
        }} />
      )}
    </div>
  );
}
