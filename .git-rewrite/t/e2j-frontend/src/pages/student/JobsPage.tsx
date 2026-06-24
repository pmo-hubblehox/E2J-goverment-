import { useState, useEffect, useRef } from 'react';
import {
  Search, MapPin, Bookmark, BookmarkCheck, Users, Briefcase, Filter, ChevronRight,
  Calendar, Upload, Check, X, FileText, ChevronDown,
} from 'lucide-react';
import api from '../../services/api';

type JobTab = 'all' | 'recommended' | 'applied' | 'saved';
type SubSection = 'jobs' | 'internship' | 'documents' | 'interview';

interface ApiJob {
  id: number;
  jobId: string;
  jobRole: string;
  companyName: string;
  department: string;
  location: string;
  workMode: string;
  positions: number;
  employmentType: string;
  postingType: string;
  targetDate: string;
  attachJd: string;
  customQuestions: string[];
  createdAt: string;
}

interface Resume { id: number; fileName: string; fileUrl: string; isPrimary: boolean; uploadedAt: string; }
interface FullProfile {
  firstName?: string; lastName?: string; title?: string; middleName?: string;
  dob?: string; gender?: string; nationality?: string; maritalStatus?: string;
  physChallenged?: string; mobilePrimary?: string; mobileAlternate?: string;
  photoUrl?: string; email?: string;
  resumes?: Resume[];
  educations?: { id: number; degree: string; schoolUniversity: string; majorSpecialization: string; yearOfPassing: string; percentageCgpa: string }[];
  workExperiences?: { id: number; companyName: string; employmentType: string; location: string; fromDate: string; toDate: string }[];
  skills?: string[];
}

const COMPANY_COLORS = ['#E74C3C', '#F79E1B', '#0066CC', '#7B2FBE', '#16A34A', '#EC4899'];
const PRIMARY = '#3F41D1';
const PINK = '#E91E8C';
const BORDER = '#E2E8F0';
const TEXT = '#1E293B';
const SUB = '#64748B';

function CompanyLogo({ company, size = 40 }: { company: string; size?: number }) {
  const idx = company.charCodeAt(0) % COMPANY_COLORS.length;
  return (
    <div style={{ width: size, height: size, borderRadius: '10px', background: COMPANY_COLORS[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {company.charAt(0).toUpperCase()}
    </div>
  );
}

/* ─────────── Apply Modal ─────────── */
function ApplyModal({ job, onClose, onSuccess }: { job: ApiJob; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const hasQuestions = (job.customQuestions?.length ?? 0) > 0;
  const totalSteps = hasQuestions ? 3 : 2;

  useEffect(() => {
    api.get('/student/profile/full')
      .then(r => {
        const d = r.data?.data ?? r.data;
        setProfile(d);
        const primary = d?.resumes?.find((r: Resume) => r.isPrimary);
        if (primary) setSelectedResumeId(primary.id);
        else if (d?.resumes?.length) setSelectedResumeId(d.resumes[0].id);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));
    if (hasQuestions) setAnswers(new Array(job.customQuestions.length).fill(''));
  }, []);

  const handleResumeUpload = async (file: File) => {
    setUploadingResume(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('userType', 'student');
      fd.append('entityName', 'resume');
      fd.append('docType', 'resume');
      const uploadRes = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const rawUrl: string = uploadRes.data?.data?.url ?? uploadRes.data?.url ?? '';
      const fileUrl = rawUrl.startsWith('/api/') ? `http://localhost:8081${rawUrl}` : rawUrl;
      const addRes = await api.post('/student/profile/resumes', { fileName: file.name, fileUrl });
      const newResume = addRes.data?.data ?? addRes.data;
      setProfile(prev => prev ? { ...prev, resumes: [newResume, ...(prev.resumes ?? [])] } : prev);
      setSelectedResumeId(newResume.id);
    } catch { setError('Failed to upload resume. Please try again.'); }
    finally { setUploadingResume(false); }
  };

  const handleSubmit = async () => {
    if (!selectedResumeId) { setError('Please select a resume.'); return; }
    setSubmitting(true); setError('');
    try {
      const qaPayload = hasQuestions
        ? job.customQuestions.map((q, i) => ({ question: q, answer: answers[i] ?? '' }))
        : [];
      await api.post(`/student/jobs/${job.id}/apply`, { resumeId: selectedResumeId, questionAnswers: qaPayload });
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to submit. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: TEXT }}>Apply To {job.companyName}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: SUB }}>{job.jobRole} · {job.location} · Step {step + 1} of {totalSteps}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: SUB }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', padding: '12px 24px 0', gap: '6px' }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= step ? PRIMARY : BORDER }} />
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {error && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}

          {step === 0 && (
            <div>
              <p style={{ fontSize: '13px', color: SUB, marginBottom: '16px' }}>Select Resume For The Application</p>
              {loadingProfile ? <p style={{ fontSize: '13px', color: SUB }}>Loading resumes…</p>
                : (profile?.resumes ?? []).length === 0
                  ? <div style={{ textAlign: 'center', padding: '32px', color: SUB, fontSize: '13px' }}>No resumes uploaded. Upload one below.</div>
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                      {(profile?.resumes ?? []).map(r => (
                        <div key={r.id} onClick={() => setSelectedResumeId(r.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: `2px solid ${selectedResumeId === r.id ? PRIMARY : BORDER}`, borderRadius: '10px', cursor: 'pointer', background: selectedResumeId === r.id ? '#EEF2FF' : '#fff' }}>
                          <FileText size={28} color={selectedResumeId === r.id ? PRIMARY : '#94A3B8'} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{r.fileName}</div>
                            <div style={{ fontSize: '11px', color: SUB }}>Uploaded On {r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div>
                          </div>
                          {r.isPrimary && <span style={{ fontSize: '11px', fontWeight: 600, color: PRIMARY, border: `1px solid ${PRIMARY}`, borderRadius: '6px', padding: '2px 8px' }}>Primary</span>}
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selectedResumeId === r.id ? PRIMARY : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedResumeId === r.id ? PRIMARY : '#fff' }}>
                            {selectedResumeId === r.id && <Check size={12} color="#fff" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleResumeUpload(e.target.files[0]); }} />
              <button onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume}
                style={{ padding: '9px 20px', borderRadius: '100px', border: `1.5px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                {uploadingResume ? 'Uploading…' : <><Upload size={13} style={{ display: 'inline', marginRight: '6px' }} />Upload Resume</>}
              </button>
              <p style={{ fontSize: '11px', color: SUB, marginTop: '6px' }}>DOC, DOCX, PDF (2 MB)</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <p style={{ fontSize: '13px', color: SUB, marginBottom: '16px' }}>Your profile details will be shared with {job.companyName}.</p>
              {loadingProfile ? <p style={{ fontSize: '13px', color: SUB }}>Loading…</p> : (
                <>
                  <div style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', marginBottom: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: `1px solid ${BORDER}` }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>Personal Information</span>
                    </div>
                    <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[['First Name', profile?.firstName], ['Last Name', profile?.lastName], ['Date of Birth', profile?.dob], ['Gender', profile?.gender], ['Nationality', profile?.nationality], ['Mobile', profile?.mobilePrimary]].map(([label, val]) => (
                        <div key={label as string}>
                          <div style={{ fontSize: '11px', color: SUB, marginBottom: '2px' }}>{label}</div>
                          <div style={{ fontSize: '13px', color: val ? TEXT : '#CBD5E1', fontWeight: 500 }}>{val || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {(profile?.educations ?? []).length > 0 && (
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', marginBottom: '16px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>Education</span>
                      </div>
                      {(profile?.educations ?? []).map((e, i) => (
                        <div key={e.id} style={{ padding: '12px 16px', borderBottom: i < (profile?.educations?.length ?? 0) - 1 ? `1px solid ${BORDER}` : 'none' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{e.degree}</div>
                          <div style={{ fontSize: '12px', color: SUB }}>{e.schoolUniversity}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {(profile?.skills ?? []).length > 0 && (
                    <div style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>Skills</span>
                      </div>
                      <div style={{ padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(profile?.skills ?? []).map(s => (
                          <span key={s} style={{ fontSize: '12px', color: PRIMARY, border: `1px solid ${PRIMARY}`, borderRadius: '100px', padding: '4px 12px', background: '#EEF2FF' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 2 && hasQuestions && (
            <div>
              <p style={{ fontSize: '13px', color: SUB, marginBottom: '20px' }}>{job.companyName} has a few questions.</p>
              {job.customQuestions.map((q, i) => (
                <div key={i} style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: TEXT, display: 'block', marginBottom: '8px' }}>{q}</label>
                  <input value={answers[i] ?? ''} onChange={e => setAnswers(prev => prev.map((a, idx) => idx === i ? e.target.value : a))}
                    placeholder="Enter your answer"
                    style={{ width: '100%', height: '44px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0 14px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={step === 0 ? onClose : () => { setError(''); setStep(s => s - 1); }}
            style={{ padding: '9px 24px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT }}>
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < totalSteps - 1 ? (
            <button onClick={() => { if (step === 0 && !selectedResumeId) { setError('Please select a resume.'); return; } setError(''); setStep(s => s + 1); }}
              style={{ padding: '9px 28px', borderRadius: '100px', border: 'none', background: PINK, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              style={{ padding: '9px 28px', borderRadius: '100px', border: 'none', background: PINK, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Success Modal ─────────── */
function SuccessModal({ jobTitle, companyName, onClose }: { jobTitle: string; companyName: string; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '40px 32px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={30} color="#16A34A" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: TEXT }}>Application Submitted!</h3>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: SUB, lineHeight: 1.6 }}>
          Your application for <strong>{jobTitle}</strong> at <strong>{companyName}</strong> has been submitted successfully.
        </p>
        <button onClick={onClose} style={{ padding: '10px 32px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Done</button>
      </div>
    </div>
  );
}

/* ─────────── Job Detail Modal ─────────── */
function resolveJdUrl(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/api/')) return `http://localhost:8081${raw}`;
  return ''; // bare filename or garbage — not a real URL
}

function JobDetailModal({ job, isApplied, onClose, onApply }: { job: ApiJob; isApplied: boolean; onClose: () => void; onApply: () => void }) {
  const jdUrl = resolveJdUrl(job.attachJd);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <CompanyLogo company={job.companyName} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: TEXT }}>{job.jobRole}</h2>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: SUB }}>{job.companyName}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: PRIMARY, border: '1px solid #C7D2FE', borderRadius: '20px', padding: '3px 10px', background: '#EEF2FF' }}>{job.department}</span>
                <span style={{ fontSize: '11px', color: SUB, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={11} />{job.location}</span>
                <span style={{ fontSize: '11px', color: SUB, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '3px 10px' }}>{job.workMode}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, padding: '4px', flexShrink: 0 }}><X size={20} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 12px' }}>Job Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                ['Employment Type', job.employmentType],
                ['Work Mode', job.workMode],
                ['Department', job.department],
                ['Location', job.location],
                ['Positions', String(job.positions)],
                ['Target Date', job.targetDate],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '3px' }}>{k}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{v}</div>
                </div>
              ))}
            </div>
            {jdUrl && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${BORDER}` }}>
                <a href={jdUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: PRIMARY, textDecoration: 'none', fontWeight: 500 }}>
                  <FileText size={14} /> View Job Description
                </a>
              </div>
            )}
          </div>

          {(job.customQuestions ?? []).length > 0 && (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: TEXT, margin: '0 0 10px' }}>Screening Questions ({job.customQuestions.length})</h4>
              {job.customQuestions.map((q, i) => (
                <div key={i} style={{ fontSize: '13px', color: SUB, marginBottom: '6px', display: 'flex', gap: '8px' }}>
                  <span style={{ color: PRIMARY, fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>{q}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', fontSize: '13px', cursor: 'pointer', color: TEXT }}>Close</button>
          {isApplied ? (
            <button disabled style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', background: '#DCFCE7', color: '#16A34A', fontSize: '13px', fontWeight: 600, cursor: 'default', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} /> Applied
            </button>
          ) : (
            <button onClick={onApply} style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', background: PINK, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Apply Now <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Filter Dropdown ─────────── */
function FilterDropdown({ workMode, setWorkMode, location, setLocation, locations }: {
  workMode: string; setWorkMode: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  locations: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasFilter = workMode || location;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', height: '40px', border: `1px solid ${hasFilter ? PRIMARY : BORDER}`, borderRadius: '8px', background: hasFilter ? '#EEF2FF' : '#fff', fontSize: '13px', cursor: 'pointer', color: hasFilter ? PRIMARY : TEXT }}>
        <Filter size={14} /> Filter {hasFilter ? '●' : ''}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '44px', right: 0, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, padding: '16px', minWidth: '220px' }}>
          <div style={{ marginBottom: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: SUB, textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: '0.05em' }}>Work Mode</p>
            {['', 'Online', 'Offline', 'Hybrid'].map(m => (
              <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: 'pointer', fontSize: '13px', color: TEXT }}>
                <input type="radio" name="wm" checked={workMode === m} onChange={() => { setWorkMode(m); }} style={{ accentColor: PRIMARY }} />
                {m || 'All'}
              </label>
            ))}
          </div>
          {locations.length > 0 && (
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: SUB, textTransform: 'uppercase', margin: '0 0 8px', letterSpacing: '0.05em' }}>Location</p>
              {['', ...locations.slice(0, 6)].map(l => (
                <label key={l} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: 'pointer', fontSize: '13px', color: TEXT }}>
                  <input type="radio" name="loc" checked={location === l} onChange={() => setLocation(l)} style={{ accentColor: PRIMARY }} />
                  {l || 'All'}
                </label>
              ))}
            </div>
          )}
          <button onClick={() => { setWorkMode(''); setLocation(''); setOpen(false); }}
            style={{ marginTop: '12px', width: '100%', padding: '8px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', fontSize: '12px', cursor: 'pointer', color: SUB }}>
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────── Main Page ─────────── */
export default function JobsPage() {
  const [subSection, setSubSection] = useState<SubSection>('jobs');
  const [tab, setTab] = useState<JobTab>('all');
  const [search, setSearch] = useState('');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [allJobs, setAllJobs] = useState<ApiJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailJob, setDetailJob] = useState<ApiJob | null>(null);
  const [applyJob, setApplyJob] = useState<ApiJob | null>(null);
  const [successJob, setSuccessJob] = useState<ApiJob | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [studentSkills, setStudentSkills] = useState<string[]>([]);
  const [aspirationRoles, setAspirationRoles] = useState<string[]>([]);

  useEffect(() => {
    api.get('/student/jobs')
      .then(r => {
        const raw: any[] = r.data?.data ?? [];
        setAllJobs(raw.map((j: any) => ({
          id: j.id, jobId: j.jobId,
          jobRole: j.jobRole ?? j.title ?? '—',
          companyName: j.companyName ?? '—',
          department: j.department ?? '—',
          location: j.location ?? '—',
          workMode: j.workMode ?? '—',
          positions: j.positions ?? 1,
          employmentType: j.employmentType ?? '',
          postingType: j.postingType ?? 'JOB',
          targetDate: j.targetDate ?? '',
          attachJd: j.attachJd ?? '',
          customQuestions: j.customQuestions ?? [],
          createdAt: j.createdAt ?? '',
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get('/student/applications')
      .then(r => setAppliedIds(new Set((r.data?.data ?? []).map((a: any) => Number(a.jobId)))))
      .catch(() => {});

    api.get('/student/profile/full')
      .then(r => {
        const skills = r.data?.data?.skills ?? r.data?.skills ?? [];
        setStudentSkills(skills);
      })
      .catch(() => {});

    api.get('/student/aspirations')
      .then(r => {
        const roles: string[] = (r.data?.data ?? r.data ?? []).map((a: any) => a.roleArea).filter(Boolean);
        setAspirationRoles(roles);
      })
      .catch((e) => { console.error('[Jobs] aspirations fetch failed:', e); });
  }, []);

  const toggleSaved = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const SUB_NAV: { key: SubSection; label: string }[] = [
    { key: 'jobs', label: 'Jobs' },
    { key: 'internship', label: 'Internship' },
    { key: 'documents', label: 'Documents' },
    { key: 'interview', label: 'Interview' },
  ];

  const JOB_TABS: { key: JobTab; label: string }[] = [
    { key: 'all', label: 'All Jobs' },
    { key: 'recommended', label: 'Recommended Jobs' },
    { key: 'applied', label: 'Applied Jobs' },
    { key: 'saved', label: 'Saved Jobs' },
  ];

  const uniqueLocations = [...new Set(allJobs.map(j => j.location).filter(Boolean))];

  const typeFiltered = allJobs.filter(j =>
    subSection === 'internship' ? j.postingType === 'INTERNSHIP' : j.postingType === 'JOB'
  );

  const tabFiltered = typeFiltered.filter(j => {
    if (tab === 'applied') return appliedIds.has(j.id);
    if (tab === 'saved') return savedIds.has(j.id);
    if (tab === 'recommended') {
      const jobTitle = (j.jobRole ?? '').toLowerCase();
      const jobDept  = (j.department ?? '').toLowerCase();
      const GENERIC = new Set(['engineer', 'manager', 'analyst', 'developer', 'specialist', 'officer', 'executive', 'associate', 'lead', 'intern', 'consultant']);
      const matchesAspiration = aspirationRoles.some(role => {
        const allWords = role.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const domainWords = allWords.filter(w => !GENERIC.has(w));
        const words = domainWords.length > 0 ? domainWords : allWords;
        return words.some(w => jobTitle.includes(w) || jobDept.includes(w));
      });
      const matchingSkill = studentSkills.find(s => s.length >= 3 && (jobTitle.includes(s.toLowerCase()) || jobDept.includes(s.toLowerCase())));
      const matchesSkills = !!matchingSkill;
      if (aspirationRoles.length === 0 && studentSkills.length === 0) return true;
      return matchesAspiration || matchesSkills;
    }
    return true;
  });

  const filteredJobs = tabFiltered.filter(j => {
    const matchSearch = !search ||
      j.jobRole.toLowerCase().includes(search.toLowerCase()) ||
      j.companyName.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase());
    const matchWorkMode = !workModeFilter || j.workMode?.toLowerCase() === workModeFilter.toLowerCase();
    const matchLocation = !locationFilter || j.location === locationFilter;
    return matchSearch && matchWorkMode && matchLocation;
  });

  const NavBar = () => (
    <div style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '0 24px', flexShrink: 0 }}>
      <div style={{ display: 'flex' }}>
        {SUB_NAV.map(s => (
          <button key={s.key} onClick={() => { setSubSection(s.key); setTab('all'); }}
            style={{ padding: '14px 0', marginRight: '28px', fontSize: '13px', fontWeight: 500, color: subSection === s.key ? PRIMARY : SUB, background: 'none', border: 'none', borderBottom: subSection === s.key ? `2px solid ${PRIMARY}` : '2px solid transparent', cursor: 'pointer' }}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (subSection === 'interview') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <NavBar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#94A3B8' }}>
          <Calendar size={40} strokeWidth={1.2} /><p style={{ fontSize: '14px', margin: 0 }}>No interviews scheduled</p>
        </div>
      </div>
    );
  }

  if (subSection === 'documents') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <NavBar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#94A3B8' }}>
          <Briefcase size={40} strokeWidth={1.2} /><p style={{ fontSize: '14px', margin: 0 }}>No documents uploaded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <NavBar />

      {/* Controls bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
        {/* Tab chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {JOB_TABS.map(t => {
            let count: number | null = null;
            if (t.key === 'applied') count = typeFiltered.filter(j => appliedIds.has(j.id)).length;
            if (t.key === 'saved') count = typeFiltered.filter(j => savedIds.has(j.id)).length;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding: '7px 16px', borderRadius: '20px', border: `1.5px solid ${tab === t.key ? PRIMARY : BORDER}`, background: tab === t.key ? PRIMARY : '#fff', color: tab === t.key ? '#fff' : TEXT, fontSize: '12px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}>
                {t.label}
                {count !== null && count > 0 && (
                  <span style={{ fontSize: '10px', background: tab === t.key ? 'rgba(255,255,255,0.3)' : '#EEF2FF', color: tab === t.key ? '#fff' : PRIMARY, borderRadius: '10px', padding: '1px 6px', fontWeight: 700 }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs, companies..."
            style={{ paddingLeft: '32px', paddingRight: '12px', height: '40px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', outline: 'none', width: '240px', boxSizing: 'border-box' }} />
        </div>

        {/* Filter */}
        <FilterDropdown workMode={workModeFilter} setWorkMode={setWorkModeFilter} location={locationFilter} setLocation={setLocationFilter} locations={uniqueLocations} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#F8FAFC' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: SUB, fontSize: '14px' }}>Loading…</div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '12px', color: '#94A3B8' }}>
            <Briefcase size={40} strokeWidth={1.2} />
            <p style={{ fontSize: '14px', margin: 0, fontWeight: 500, color: SUB }}>
              {tab === 'applied' ? 'No applications yet' : tab === 'saved' ? 'No saved jobs' : tab === 'recommended' ? 'No recommendations found' : `No ${subSection === 'internship' ? 'internships' : 'jobs'} available`}
            </p>
            {tab !== 'all' && (
              <button onClick={() => setTab('all')} style={{ fontSize: '13px', color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Browse all jobs</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {filteredJobs.map(j => {
              const applied = appliedIds.has(j.id);
              const saved = savedIds.has(j.id);
              const daysAgo = j.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(j.createdAt).getTime()) / 86400000)) : null;
              return (
                <div key={j.id} onClick={() => setDetailJob(j)}
                  style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}`, padding: '18px', cursor: 'pointer', transition: 'box-shadow 0.15s', display: 'flex', flexDirection: 'column', gap: '12px' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(63,65,209,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <CompanyLogo company={j.companyName} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT, marginBottom: '2px' }}>{j.jobRole}</div>
                          <div style={{ fontSize: '12px', color: SUB }}>{j.companyName}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {daysAgo !== null && <span style={{ fontSize: '10px', color: '#94A3B8' }}>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>}
                          <button onClick={e => toggleSaved(j.id, e)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: saved ? PRIMARY : '#94A3B8' }}>
                            {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: PRIMARY, border: '1px solid #C7D2FE', borderRadius: '20px', padding: '3px 10px', background: '#EEF2FF' }}>{j.department}</span>
                    <span style={{ fontSize: '11px', color: SUB, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={10} />{j.location}</span>
                    <span style={{ fontSize: '11px', color: SUB, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '3px 10px' }}>{j.workMode}</span>
                    <span style={{ fontSize: '11px', color: SUB, border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '3px' }}><Users size={10} />{j.positions} Position{j.positions !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Footer */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    {applied ? (
                      <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={13} />Applied</span>
                    ) : (
                      <span style={{ fontSize: '12px', color: SUB }}>{j.employmentType}</span>
                    )}
                    <button onClick={e => { e.stopPropagation(); if (!applied) { setApplyJob(j); } }}
                      style={{ padding: '7px 18px', borderRadius: '100px', border: 'none', background: applied ? '#DCFCE7' : PINK, color: applied ? '#16A34A' : '#fff', fontSize: '12px', fontWeight: 600, cursor: applied ? 'default' : 'pointer' }}>
                      {applied ? 'Applied' : 'Apply Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Job detail modal */}
      {detailJob && !applyJob && (
        <JobDetailModal
          job={detailJob}
          isApplied={appliedIds.has(detailJob.id)}
          onClose={() => setDetailJob(null)}
          onApply={() => { setApplyJob(detailJob); setDetailJob(null); }}
        />
      )}

      {applyJob && (
        <ApplyModal job={applyJob} onClose={() => setApplyJob(null)}
          onSuccess={() => {
            setAppliedIds(prev => new Set([...prev, applyJob.id]));
            setSuccessJob(applyJob);
            setApplyJob(null);
          }}
        />
      )}

      {successJob && (
        <SuccessModal jobTitle={successJob.jobRole} companyName={successJob.companyName} onClose={() => setSuccessJob(null)} />
      )}
    </div>
  );
}
