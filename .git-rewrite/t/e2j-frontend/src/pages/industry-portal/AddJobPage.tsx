import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowLeft, Paperclip, X } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const BORDER = '#A3A3A3';
const TEXT = '#212121';
const SUB = '#666666';
const LIGHT_BG = '#EEEEFF';

const isInternship = false; // AddJobPage is always JOB type

/* ── helpers ── */
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <span style={{ fontSize: '13px', color: TEXT, fontWeight: 500 }}>{children}{required && <span style={{ color: '#E6393E' }}> *</span>}</span>;
}
function FInput({ label, required, ...rest }: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Label required={required}>{label}</Label>
      <input {...rest} style={{ height: '42px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#fff', ...rest.style }} />
    </div>
  );
}
function FSelect({ label, required, options, ...rest }: { label: string; required?: boolean; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Label required={required}>{label}</Label>
      <div style={{ position: 'relative' }}>
        <select {...rest} style={{ width: '100%', height: '42px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0 36px 0 12px', fontSize: '13px', outline: 'none', background: '#fff', appearance: 'none', ...rest.style }}>
          <option value="">Select</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: SUB, pointerEvents: 'none' }} />
      </div>
    </div>
  );
}
function SectionHeader({ title, open, toggle }: { title: string; open: boolean; toggle: () => void }) {
  return (
    <button type="button" onClick={toggle}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: LIGHT_BG, border: 'none', padding: '14px 18px', cursor: 'pointer', borderRadius: '8px 8px 0 0' }}>
      <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{title}</span>
      {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  );
}
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border: `1px solid #D1D5DB`, borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' }}>
      <SectionHeader title={title} open={open} toggle={() => setOpen(o => !o)} />
      {open && <div style={{ padding: '20px 18px', background: '#fff' }}>{children}</div>}
    </div>
  );
}

interface InterviewRound { roundName: string; mode: string; type: string }

export default function AddJobPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const type = searchParams.get('type') === 'internship' ? 'INTERNSHIP' : 'JOB';
  const isIntern = type === 'INTERNSHIP';

  const [form, setForm] = useState({
    jobRole: '', department: '', employmentType: '', workMode: '', location: '', positions: 2,
    targetDate: '',
    internshipDuration: '', hasStipend: false, stipendAmount: '',
  });
  const [jdFile, setJdFile]         = useState<File | null>(null);
  const [jdUrl, setJdUrl]           = useState('');
  const [uploadingJd, setUploadingJd] = useState(false);
  const jdInputRef                  = useRef<HTMLInputElement>(null);
  const [assessments, setAssessments] = useState<string[]>([]);
  const [rounds, setRounds] = useState<InterviewRound[]>([{ roundName: '', mode: '', type: '' }]);
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/industry-portal/jobs/${id}`)
      .then(r => {
        const d = r.data?.data ?? r.data;
        if (!d) return;
        setForm({
          jobRole: d.jobRole ?? '', department: d.department ?? '',
          employmentType: d.employmentType ?? '', workMode: d.workMode ?? '',
          location: d.location ?? '', positions: d.positions ?? 2,
          targetDate: d.targetDate ?? '',
          internshipDuration: d.internshipDuration ?? '',
          hasStipend: d.hasStipend ?? false, stipendAmount: d.stipendAmount ?? '',
        });
        if (d.attachJd) {
          const raw: string = d.attachJd;
          const resolved = raw.startsWith('http://') || raw.startsWith('https://') ? raw
            : raw.startsWith('/api/') ? `http://localhost:8081${raw}` : '';
          if (resolved) setJdUrl(resolved);
        }
        if (d.assessmentMappings) { try { setAssessments(JSON.parse(d.assessmentMappings)); } catch {} }
        if (d.interviewRounds?.length) setRounds(d.interviewRounds);
        if (d.customQuestions?.length) setCustomQuestions(d.customQuestions);
      })
      .catch(() => {});
  }, [id]);

  const handleJdPick = async (file: File) => {
    setJdFile(file);
    setUploadingJd(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('userType', 'industry-partner');
      fd.append('entityName', 'jd');
      fd.append('docType', 'jd');
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const path: string = res.data?.data?.url ?? res.data?.url ?? '';
      // Convert relative /api/files/... path to absolute backend URL for browser to open directly
      const fullUrl = path.startsWith('/api/') ? `http://localhost:8081${path}` : path;
      setJdUrl(fullUrl);
    } catch { /* upload optional — keep file name visible */ }
    finally { setUploadingJd(false); }
  };

  const ASSESSMENT_OPTIONS = ['Psychometric Assessment', 'Physical Test', 'Communication Test', 'Technical Test'];

  const toggleAssessment = (a: string) => {
    setAssessments(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const addRound = () => setRounds(r => [...r, { roundName: '', mode: '', type: '' }]);
  const removeRound = (i: number) => setRounds(r => r.filter((_, idx) => idx !== i));
  const updateRound = (i: number, k: keyof InterviewRound, v: string) => {
    setRounds(r => r.map((rnd, idx) => idx === i ? { ...rnd, [k]: v } : rnd));
  };

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    setSaving(true);
    try {
      const payload = {
        postingType: type, ...form,
        positions: form.positions,
        targetDate: form.targetDate || null,
        attachJd: jdUrl || jdFile?.name || '',
        assessmentMappings: JSON.stringify(assessments),
        interviewRounds: rounds,
        customQuestions: customQuestions.filter(q => q.trim()),
        status,
      };
      if (isEdit) await api.put(`/industry-portal/jobs/${id}`, payload);
      else        await api.post('/industry-portal/jobs', payload);
      navigate('/industry-portal/jobs');
    } catch (e) {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const G2 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' } as React.CSSProperties;

  return (
    <div style={{ padding: '24px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button type="button" onClick={() => navigate('/industry-portal/jobs')}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={16} color={TEXT} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: TEXT }}>
            {isEdit ? 'Edit' : 'Add'} {isIntern ? 'Internship' : 'Job Posting'}
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: SUB }}>{isEdit ? 'Update the details below' : `Fill in the details below to create a new ${isIntern ? 'internship' : 'job'} posting`}</p>
        </div>
      </div>

      {/* Job Role Details */}
      <SectionCard title={isIntern ? 'Internship Role Details *' : 'Job Role Details *'}>
        <div style={G2}>
          <FInput label={isIntern ? 'Internship Role' : 'Job Role'} required value={form.jobRole}
            onChange={e => setForm(f => ({ ...f, jobRole: e.target.value }))} placeholder={isIntern ? 'Internship Role*' : 'Job Role*'} />
          <FSelect label="Department" required options={['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'IT']}
            value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          {isIntern
            ? <FSelect label="Duration" required options={['1 Month', '2 Months', '3 Months', '6 Months']}
                value={form.internshipDuration} onChange={e => setForm(f => ({ ...f, internshipDuration: e.target.value }))} />
            : <FSelect label="Employment Type" required options={['Full Time', 'Part Time', 'Contract', 'Freelance']}
                value={form.employmentType} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value }))} />
          }
          <FSelect label="Work Mode" required options={['Online', 'Offline', 'Hybrid']}
            value={form.workMode} onChange={e => setForm(f => ({ ...f, workMode: e.target.value }))} />
          <FSelect label="Location" required options={['Mumbai', 'Pune', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai']}
            value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label required>Job Positions</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button type="button" onClick={() => setForm(f => ({ ...f, positions: Math.max(1, f.positions - 1) }))}
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: '16px', fontWeight: 600, minWidth: '28px', textAlign: 'center' }}>
                {String(form.positions).padStart(2, '0')}
              </span>
              <button type="button" onClick={() => setForm(f => ({ ...f, positions: f.positions + 1 }))}
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>
          {isIntern && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Label>Stipend?</Label>
              <div style={{ display: 'flex', gap: '20px', paddingTop: '8px' }}>
                {['Yes', 'No'].map(v => (
                  <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="radio" name="stipend" checked={form.hasStipend === (v === 'Yes')}
                      onChange={() => setForm(f => ({ ...f, hasStipend: v === 'Yes' }))} /> {v}
                  </label>
                ))}
              </div>
            </div>
          )}
          {isIntern && form.hasStipend && (
            <FInput label="Amount" required value={form.stipendAmount}
              onChange={e => setForm(f => ({ ...f, stipendAmount: e.target.value }))} placeholder="Amount*" />
          )}
          <FInput label="Target Date" required type="date" value={form.targetDate}
            onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Label>Attach JD</Label>
            <input ref={jdInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleJdPick(e.target.files[0])} />
            <div onClick={() => jdInputRef.current?.click()}
              style={{ height: '42px', border: `1px dashed ${jdFile ? PRIMARY : BORDER}`, borderRadius: '8px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: jdFile ? '#EEF2FF' : '#fff', fontSize: '13px', color: jdFile ? PRIMARY : SUB }}>
              <Paperclip size={14} />
              {uploadingJd ? 'Uploading…' : jdFile ? jdFile.name : 'Click to attach JD (PDF/DOC)'}
              {jdFile && <button type="button" onClick={e => { e.stopPropagation(); setJdFile(null); setJdUrl(''); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: PRIMARY, display: 'flex' }}><X size={14} /></button>}
            </div>
          </div>
        </div>
      </SectionCard>


      {/* Recruitment Test */}
      <SectionCard title="Recruitment Test">
        <div style={{ marginBottom: '16px' }}>
          <Label>Assessment Mapping</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px', marginTop: '10px' }}>
            {ASSESSMENT_OPTIONS.map(a => {
              const selected = assessments.includes(a);
              return (
                <button key={a} type="button" onClick={() => toggleAssessment(a)}
                  style={{ padding: '6px 14px', border: `1px solid ${selected ? PRIMARY : BORDER}`, borderRadius: '100px', background: selected ? LIGHT_BG : '#fff', color: selected ? PRIMARY : TEXT, fontSize: '12px', fontWeight: selected ? 600 : 400, cursor: 'pointer' }}>
                  {a} {selected && '×'}
                </button>
              );
            })}
          </div>
        </div>

        <Label>Mapped Interview</Label>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Sr No', 'Interview Round', 'Interview Mode', 'Interview Type', 'Action'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: SUB, borderBottom: `1px solid ${BORDER}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rounds.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: '10px 12px', color: SUB }}>{String(i + 1).padStart(2, '0')}</td>
                <td style={{ padding: '6px 12px' }}>
                  <input value={r.roundName} onChange={e => updateRound(i, 'roundName', e.target.value)}
                    placeholder="Round Name" style={{ width: '100%', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '0 10px', fontSize: '13px', outline: 'none' }} />
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <div style={{ position: 'relative' }}>
                    <select value={r.mode} onChange={e => updateRound(i, 'mode', e.target.value)}
                      style={{ width: '100%', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '0 30px 0 10px', fontSize: '13px', appearance: 'none', outline: 'none' }}>
                      <option value="">Select</option>
                      {['Online', 'Offline', 'Both'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: SUB }} />
                  </div>
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <div style={{ position: 'relative' }}>
                    <select value={r.type} onChange={e => updateRound(i, 'type', e.target.value)}
                      style={{ width: '100%', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '0 30px 0 10px', fontSize: '13px', appearance: 'none', outline: 'none' }}>
                      <option value="">Select</option>
                      {['Individual', 'Panel', 'Group'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <ChevronDown size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: SUB }} />
                  </div>
                </td>
                <td style={{ padding: '6px 12px' }}>
                  <button type="button" onClick={() => removeRound(i)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: rounds.length === 1 ? '#ccc' : '#94A3B8' }} disabled={rounds.length === 1}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button type="button" onClick={addRound}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '100px', background: PRIMARY, color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={14} /> Add
          </button>
        </div>
      </SectionCard>

      {/* Custom Screening Questions (optional) */}
      <SectionCard title="Screening Questions (Optional)">
        <p style={{ fontSize: '13px', color: SUB, margin: '0 0 16px' }}>
          Add questions that candidates must answer when applying. These will appear in the application form.
        </p>
        {customQuestions.map((q, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
            <input
              value={q}
              onChange={e => setCustomQuestions(prev => prev.map((x, idx) => idx === i ? e.target.value : x))}
              placeholder={`Question ${i + 1}, e.g. How many years of experience in React?`}
              style={{ flex: 1, height: '40px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0 12px', fontSize: '13px', outline: 'none' }}
            />
            <button type="button" onClick={() => setCustomQuestions(prev => prev.filter((_, idx) => idx !== i))}
              style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setCustomQuestions(prev => [...prev, ''])}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '100px', background: '#EEF2FF', color: PRIMARY, border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
          <Plus size={14} /> Add Question
        </button>
      </SectionCard>

      {/* Bottom actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
        <button type="button" onClick={() => navigate('/industry-portal/jobs')}
          style={{ padding: '0 28px', height: '40px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT }}>
          Cancel
        </button>
        <button type="button" onClick={() => handleSave('DRAFT')} disabled={saving}
          style={{ padding: '0 28px', height: '40px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT }}>
          Save As Draft
        </button>
        <button type="button" onClick={() => handleSave('PUBLISHED')} disabled={saving}
          style={{ padding: '0 28px', height: '40px', borderRadius: '100px', border: 'none', background: '#E91E8C', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          {isIntern ? 'Submit' : 'Publish'}
        </button>
      </div>
    </div>
  );
}
