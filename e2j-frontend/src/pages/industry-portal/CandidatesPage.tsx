import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Download, MoreVertical, Users, X, FileText, Mail, Phone, Briefcase, GraduationCap, Award } from 'lucide-react';
import api from '../../services/api';

const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';
const PRIMARY = '#3F41D1';

const STAGE_STYLE: Record<string, { color: string; bg: string }> = {
  APPLIED:           { color: '#64748B', bg: '#F1F5F9' },
  SHORTLISTED:       { color: '#7C3AED', bg: '#EDE9FE' },
  INTERVIEW_ROUND_1: { color: '#1D4ED8', bg: '#DBEAFE' },
  INTERVIEW_ROUND_2: { color: '#92400E', bg: '#FEF3C7' },
  OFFERED:           { color: '#15803D', bg: '#DCFCE7' },
  REJECTED:          { color: '#B91C1C', bg: '#FEE2E2' },
};

const STAGES = ['APPLIED', 'SHORTLISTED', 'INTERVIEW_ROUND_1', 'INTERVIEW_ROUND_2', 'OFFERED', 'REJECTED'];

function stageLabel(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? s;
}

function resolveUrl(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/api/')) return `http://localhost:8081${raw}`;
  return '';
}

interface Applicant {
  applicationId: number;
  jobId: number;
  jobRole: string;
  department: string;
  postingType: string;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  resumeUrl: string;
  resumeFileName: string;
  stage: string;
  appliedAt: string;
  questionAnswers: string; // raw JSON: [{question, answer}, ...]
}

interface QA { question: string; answer: string; }

function parseQA(raw: string): QA[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as QA[]; }
  catch { return []; }
}

/* ─────── 3-dot stage menu ─────── */
function StageMenu({ applicationId, current, onUpdate }: { applicationId: number; current: string; onUpdate: (id: number, stage: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: SUB, display: 'flex', alignItems: 'center' }}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{ position: 'absolute', right: 0, top: '28px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '8px', zIndex: 20, minWidth: '180px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {STAGES.map(s => (
              <button key={s} onClick={() => { onUpdate(applicationId, s); setOpen(false); }}
                style={{ display: 'block', width: '100%', padding: '9px 14px', background: s === current ? '#F8FAFC' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: s === current ? PRIMARY : TEXT }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: STAGE_STYLE[s]?.color ?? SUB, marginRight: '8px' }} />
                {stageLabel(s)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────── Applicant Detail Drawer ─────── */
function ApplicantDrawer({ applicant, onClose, onUpdateStage }: { applicant: Applicant; onClose: () => void; onUpdateStage: (id: number, stage: string) => void }) {
  const st = STAGE_STYLE[applicant.stage] ?? STAGE_STYLE.APPLIED;
  const qaList = parseQA(applicant.questionAnswers);
  const resumeUrl = resolveUrl(applicant.resumeUrl);
  const initial = (applicant.studentEmail ?? '?').charAt(0).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 100 }} />

      {/* Drawer */}
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '480px', background: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'flex-start', gap: '14px', background: '#F8FAFC' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: PRIMARY, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: TEXT }}>{applicant.studentEmail}</div>
            <div style={{ fontSize: '12px', color: SUB, marginTop: '2px' }}>Applied for <strong>{applicant.jobRole}</strong> · {applicant.department}</div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: st.color, background: st.bg }}>{stageLabel(applicant.stage)}</span>
              <span style={{ fontSize: '11px', color: SUB }}>Applied {applicant.appliedAt ? new Date(applicant.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, padding: '4px', flexShrink: 0 }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Contact Info */}
          <Section title="Contact Information" icon={<Mail size={15} color={PRIMARY} />}>
            <InfoRow label="Email" value={applicant.studentEmail} />
            <InfoRow label="Phone" value={applicant.studentPhone || '—'} />
          </Section>

          {/* Resume */}
          <Section title="Resume" icon={<FileText size={15} color={PRIMARY} />}>
            {resumeUrl ? (
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: `1px solid ${BORDER}`, borderRadius: '8px', textDecoration: 'none', color: PRIMARY, fontSize: '13px', fontWeight: 600, background: '#F8FAFC', width: 'fit-content' }}>
                <FileText size={16} />
                {applicant.resumeFileName || 'View Resume'}
                <span style={{ fontSize: '11px', color: SUB, fontWeight: 400 }}>↗ Open PDF</span>
              </a>
            ) : (
              <span style={{ fontSize: '13px', color: '#CBD5E1' }}>No resume attached</span>
            )}
          </Section>

          {/* Application Details */}
          <Section title="Application Details" icon={<Briefcase size={15} color={PRIMARY} />}>
            <InfoRow label="Job Role" value={applicant.jobRole} />
            <InfoRow label="Department" value={applicant.department} />
            <InfoRow label="Applied Date" value={applicant.appliedAt ? new Date(applicant.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
          </Section>

          {/* Screening Answers */}
          {qaList.length > 0 && (
            <Section title={`Screening Answers (${qaList.length})`} icon={<Award size={15} color={PRIMARY} />}>
              {qaList.map((qa, i) => (
                <div key={i} style={{ marginBottom: i < qaList.length - 1 ? '14px' : 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT, marginBottom: '4px' }}>{i + 1}. {qa.question}</div>
                  <div style={{ fontSize: '13px', color: SUB, background: '#F8FAFC', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '8px 12px' }}>
                    {qa.answer || <em style={{ color: '#CBD5E1' }}>No answer provided</em>}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* Update Stage */}
          <Section title="Update Stage" icon={<GraduationCap size={15} color={PRIMARY} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {STAGES.map(s => {
                const ss = STAGE_STYLE[s];
                const isActive = applicant.stage === s;
                return (
                  <button key={s} onClick={() => { onUpdateStage(applicant.applicationId, s); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: `1.5px solid ${isActive ? ss.color : BORDER}`, borderRadius: '8px', background: isActive ? ss.bg : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ss.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, color: isActive ? ss.color : TEXT }}>{stageLabel(s)}</span>
                    {isActive && <span style={{ marginLeft: 'auto', fontSize: '11px', color: ss.color, fontWeight: 600 }}>Current</span>}
                  </button>
                );
              })}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        {icon}
        <span style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>{title}</span>
      </div>
      <div style={{ borderRadius: '8px', border: `1px solid ${BORDER}`, padding: '14px 16px', background: '#fff' }}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid #F1F5F9` }}>
      <span style={{ width: '140px', fontSize: '12px', color: SUB, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '13px', color: TEXT, fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

/* ─────── Main Page ─────── */
export default function CandidatesPage() {
  const [search, setSearch] = useState('');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('');
  const [selected, setSelected] = useState<Applicant | null>(null);

  useEffect(() => {
    api.get('/industry-portal/applicants')
      .then(r => setApplicants(r.data?.data ?? []))
      .catch(() => setApplicants([]))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateStage = async (id: number, stage: string) => {
    try {
      await api.patch(`/industry-portal/applicants/${id}/stage`, { stage });
      setApplicants(prev => prev.map(a => a.applicationId === id ? { ...a, stage } : a));
      setSelected(prev => prev?.applicationId === id ? { ...prev, stage } : prev);
    } catch { alert('Failed to update stage.'); }
  };

  const filtered = applicants.filter(a => {
    const matchSearch = !search ||
      a.studentEmail?.toLowerCase().includes(search.toLowerCase()) ||
      a.jobRole?.toLowerCase().includes(search.toLowerCase());
    const matchStage = !stageFilter || a.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const handleExport = () => {
    const rows = [['Email', 'Phone', 'Job Role', 'Stage', 'Applied Date']];
    filtered.forEach(a => rows.push([a.studentEmail ?? '', a.studentPhone ?? '', a.jobRole ?? '', a.stage ?? '', a.appliedAt ? new Date(a.appliedAt).toLocaleDateString('en-IN') : '']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const el = document.createElement('a');
    el.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    el.download = 'candidates.csv'; el.click();
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
          style={{ height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0 12px', fontSize: '13px', outline: 'none', color: TEXT, background: '#fff' }}>
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{stageLabel(s)}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: SUB }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or job"
            style={{ paddingLeft: '32px', paddingRight: '12px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '100px', fontSize: '13px', outline: 'none', width: '220px' }} />
        </div>
        <button onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 14px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', color: TEXT, fontSize: '13px' }}>
          <Download size={14} /> Export
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#F8FAFC' }}>
              {['Job Role', 'Candidate', 'Applied Date', 'Resume', 'Stage', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: SUB, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: SUB }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: SUB }}>
                  <Users size={36} color="#CBD5E1" style={{ marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: TEXT, marginBottom: '8px' }}>No candidates yet</div>
                  <div style={{ fontSize: '13px' }}>Candidates who apply to your job postings will appear here.</div>
                </td>
              </tr>
            ) : filtered.map(a => {
              const st = STAGE_STYLE[a.stage] ?? STAGE_STYLE.APPLIED;
              const resumeUrl = resolveUrl(a.resumeUrl);
              return (
                <tr key={a.applicationId} onClick={() => setSelected(a)}
                  style={{ borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{a.jobRole}</div>
                    <div style={{ fontSize: '11px', color: SUB }}>{a.department}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: PRIMARY, flexShrink: 0 }}>
                        {(a.studentEmail ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: TEXT, fontWeight: 500 }}>{a.studentEmail}</div>
                        {a.studentPhone && <div style={{ fontSize: '11px', color: SUB }}>{a.studentPhone}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: SUB, fontSize: '12px' }}>
                    {a.appliedAt ? new Date(a.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                    {resumeUrl ? (
                      <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: PRIMARY, textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={13} /> {a.resumeFileName ?? 'View Resume'}
                      </a>
                    ) : <span style={{ fontSize: '12px', color: '#CBD5E1' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: st.color, background: st.bg }}>
                      {stageLabel(a.stage)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                    <StageMenu applicationId={a.applicationId} current={a.stage} onUpdate={handleUpdateStage} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {selected && (
        <ApplicantDrawer
          applicant={selected}
          onClose={() => setSelected(null)}
          onUpdateStage={handleUpdateStage}
        />
      )}
    </div>
  );
}
