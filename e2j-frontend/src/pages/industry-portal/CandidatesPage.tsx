import { useState, useEffect } from 'react';
import { Search, Download, Users, X, FileText, Mail, Phone, Briefcase, ChevronRight, Star, ExternalLink, Calendar, Clock, MapPin } from 'lucide-react';
import api from '../../services/api';

const BORDER = '#E2E8F0';
const TEXT = '#1E293B';
const SUB = '#64748B';
const PRIMARY = '#3F41D1';

const STAGE_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  APPLIED:            { color: '#64748B', bg: '#F1F5F9',  label: 'Applied' },
  SHORTLISTED:        { color: '#7C3AED', bg: '#EDE9FE',  label: 'Shortlisted' },
  INTERVIEW_SCHEDULED:{ color: '#1D4ED8', bg: '#DBEAFE',  label: 'Interview Scheduled' },
  OFFERED:            { color: '#15803D', bg: '#DCFCE7',  label: 'Offered' },
  REJECTED:           { color: '#B91C1C', bg: '#FEE2E2',  label: 'Rejected' },
};

function resolveUrl(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/api/')) return `http://localhost:8081${raw}`;
  return '';
}

interface OfferLetter {
  id: number; designation: string; department: string; ctc: number; fixedCtc: number; variableCtc: number;
  joiningDate: string; workLocation: string; workMode: string; benefits: string; specialNote: string;
  offerExpiry: string; status: string;
}

interface Applicant {
  applicationId: number; jobId: number; jobRole: string; department: string; postingType: string;
  studentId: number; studentName: string; studentEmail: string; studentPhone: string;
  resumeUrl: string; resumeFileName: string; stage: string; currentRound: number; appliedAt: string;
  questionAnswers: string;
  interviewScheduledAt: string; interviewMode: string; interviewLink: string; interviewVenue: string;
  interviewDurationMinutes: number; interviewerNames: string; interviewInstructions: string;
  feedbackOverallRating: number; feedbackTechRating: number; feedbackCommRating: number;
  feedbackProblemRating: number; feedbackCultureRating: number;
  feedbackStrengths: string; feedbackConcerns: string; feedbackNotes: string;
  rejectionReason: string; showRejectionToCandidate: boolean;
  offerLetter: OfferLetter | null;
}

interface QA { question: string; answer: string; }
function parseQA(raw: string): QA[] {
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function fmtDate(s: string) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* ── Star Rating ── */
function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
      <span style={{ fontSize: '13px', color: TEXT }}>{label}</span>
      <div style={{ display: 'flex', gap: '3px' }}>
        {[1,2,3,4,5].map(n => (
          <Star key={n} size={18} fill={n <= value ? '#F59E0B' : 'none'}
            color={n <= value ? '#F59E0B' : '#CBD5E1'} style={{ cursor: 'pointer' }}
            onClick={() => onChange(n)} />
        ))}
      </div>
    </div>
  );
}

/* ── Modal wrapper ── */
function Modal({ title, subtitle, onClose, children, footer }: {
  title: string; subtitle?: string; onClose: () => void;
  children: React.ReactNode; footer: React.ReactNode;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '22px 28px 18px', borderBottom: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: TEXT }}>{title}</div>
            {subtitle && <div style={{ fontSize: '13px', color: SUB, marginTop: '3px' }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB, padding: '2px' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '22px 28px', overflowY: 'auto', flex: 1 }}>{children}</div>
        <div style={{ padding: '16px 28px', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>{footer}</div>
      </div>
    </div>
  );
}

function Btn({ onClick, children, variant = 'primary', disabled }: { onClick?: () => void; children: React.ReactNode; variant?: 'primary' | 'outline' | 'danger' | 'green'; disabled?: boolean }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: PRIMARY, color: '#fff', border: 'none' },
    outline: { background: '#fff', color: SUB, border: `1.5px solid ${BORDER}` },
    danger:  { background: '#EF4444', color: '#fff', border: 'none' },
    green:   { background: '#16A34A', color: '#fff', border: 'none' },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '10px 22px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, ...styles[variant] }}>
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  );
}

const inputSt: React.CSSProperties = { width: '100%', border: `1.5px solid #CBD5E1`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: TEXT, outline: 'none', background: '#fff' };

/* ── Schedule Interview Modal ── */
function ScheduleModal({ applicant, onClose, onDone }: { applicant: Applicant; onClose: () => void; onDone: (updated: Applicant) => void }) {
  const [form, setForm] = useState({ scheduledAt: '', durationMinutes: '60', interviewMode: 'Online', interviewLink: '', interviewVenue: '', interviewerNames: '', instructions: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.scheduledAt) return alert('Please select interview date & time.');
    setSaving(true);
    try {
      const r = await api.post(`/industry-portal/applicants/${applicant.applicationId}/schedule-interview`, {
        scheduledAt: new Date(form.scheduledAt).toISOString().replace('Z', ''),
        durationMinutes: parseInt(form.durationMinutes) || 60,
        interviewMode: form.interviewMode,
        interviewLink: form.interviewLink || null,
        interviewVenue: form.interviewVenue || null,
        interviewerNames: form.interviewerNames || null,
        instructions: form.instructions || null,
      });
      onDone(r.data.data);
    } catch { alert('Failed to schedule interview.'); } finally { setSaving(false); }
  };

  return (
    <Modal title="Schedule Interview" subtitle={`${applicant.studentEmail} · ${applicant.jobRole}`} onClose={onClose}
      footer={<><Btn variant="outline" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving ? 'Scheduling…' : 'Confirm Schedule'}</Btn></>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Field label="Interview Date & Time *">
          <input type="datetime-local" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} style={inputSt} />
        </Field>
        <Field label="Duration">
          <select value={form.durationMinutes} onChange={e => set('durationMinutes', e.target.value)} style={inputSt}>
            {['15','30','45','60','90','120'].map(d => <option key={d} value={d}>{d} minutes</option>)}
          </select>
        </Field>
      </div>
      <Field label="Mode">
        <div style={{ display: 'flex', gap: '12px' }}>
          {['Online', 'Offline'].map(m => (
            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input type="radio" name="mode" checked={form.interviewMode === m} onChange={() => set('interviewMode', m)} /> {m}
            </label>
          ))}
        </div>
      </Field>
      {form.interviewMode === 'Online' ? (
        <Field label="Meeting Link">
          <input placeholder="https://meet.google.com/..." value={form.interviewLink} onChange={e => set('interviewLink', e.target.value)} style={inputSt} />
        </Field>
      ) : (
        <Field label="Venue / Address">
          <input placeholder="Office address or venue" value={form.interviewVenue} onChange={e => set('interviewVenue', e.target.value)} style={inputSt} />
        </Field>
      )}
      <Field label="Interviewer Name(s)">
        <input placeholder="e.g. Rohan Verma, Tech Lead" value={form.interviewerNames} onChange={e => set('interviewerNames', e.target.value)} style={inputSt} />
      </Field>
      <Field label="Instructions for Candidate (optional)">
        <textarea rows={3} placeholder="e.g. Please keep your resume ready. Be 5 mins early." value={form.instructions} onChange={e => set('instructions', e.target.value)} style={{ ...inputSt, resize: 'vertical' }} />
      </Field>
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#1D4ED8' }}>
        📧 Candidate will see interview details in their application on E2J.
      </div>
    </Modal>
  );
}

/* ── Feedback Modal ── */
function FeedbackModal({ applicant, onClose, onDone }: { applicant: Applicant; onClose: () => void; onDone: (updated: Applicant) => void }) {
  const [ratings, setRatings] = useState({ overall: applicant.feedbackOverallRating || 0, tech: applicant.feedbackTechRating || 0, comm: applicant.feedbackCommRating || 0, problem: applicant.feedbackProblemRating || 0, culture: applicant.feedbackCultureRating || 0 });
  const [form, setForm] = useState({ strengths: applicant.feedbackStrengths || '', concerns: applicant.feedbackConcerns || '', notes: applicant.feedbackNotes || '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.post(`/industry-portal/applicants/${applicant.applicationId}/feedback`, {
        overallRating: ratings.overall, techRating: ratings.tech, commRating: ratings.comm,
        problemRating: ratings.problem, cultureRating: ratings.culture,
        strengths: form.strengths, concerns: form.concerns, notes: form.notes,
      });
      onDone(r.data.data);
    } catch { alert('Failed to save feedback.'); } finally { setSaving(false); }
  };

  return (
    <Modal title="Interview Feedback" subtitle={`${applicant.studentEmail} · Round ${applicant.currentRound}`} onClose={onClose}
      footer={<><Btn variant="outline" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Feedback'}</Btn></>}>
      <Field label="Overall Rating">
        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
          {[1,2,3,4,5].map(n => (
            <Star key={n} size={24} fill={n <= ratings.overall ? '#F59E0B' : 'none'}
              color={n <= ratings.overall ? '#F59E0B' : '#CBD5E1'} style={{ cursor: 'pointer' }}
              onClick={() => setRatings(r => ({ ...r, overall: n }))} />
          ))}
        </div>
      </Field>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>Rate on Parameters</div>
        <StarRow label="Technical Skills"  value={ratings.tech}    onChange={v => setRatings(r => ({ ...r, tech: v }))} />
        <StarRow label="Communication"     value={ratings.comm}    onChange={v => setRatings(r => ({ ...r, comm: v }))} />
        <StarRow label="Problem Solving"   value={ratings.problem} onChange={v => setRatings(r => ({ ...r, problem: v }))} />
        <StarRow label="Cultural Fit"      value={ratings.culture} onChange={v => setRatings(r => ({ ...r, culture: v }))} />
      </div>
      <Field label="Strengths Observed">
        <textarea rows={3} placeholder="e.g. Strong React skills, clear communicator…" value={form.strengths} onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))} style={{ ...inputSt, resize: 'vertical' }} />
      </Field>
      <Field label="Areas of Concern">
        <textarea rows={3} placeholder="e.g. Needs more system design experience…" value={form.concerns} onChange={e => setForm(f => ({ ...f, concerns: e.target.value }))} style={{ ...inputSt, resize: 'vertical' }} />
      </Field>
      <Field label="Internal Notes (not visible to candidate)">
        <textarea rows={2} placeholder="Private notes for your team…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputSt, resize: 'vertical' }} />
      </Field>
    </Modal>
  );
}

/* ── Reject Modal ── */
function RejectModal({ applicant, onClose, onDone }: { applicant: Applicant; onClose: () => void; onDone: (updated: Applicant) => void }) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showToCandidate, setShowToCandidate] = useState(false);
  const [candidateMsg, setCandidateMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const finalReason = reason === 'Other' ? customReason : reason;
      const r = await api.post(`/industry-portal/applicants/${applicant.applicationId}/reject`, {
        reason: showToCandidate ? candidateMsg : finalReason,
        showToCandidate,
      });
      onDone(r.data.data);
    } catch { alert('Failed to reject candidate.'); } finally { setSaving(false); }
  };

  return (
    <Modal title="Reject Candidate" subtitle={`${applicant.studentEmail} · ${applicant.jobRole}`} onClose={onClose}
      footer={<><Btn variant="outline" onClick={onClose}>Cancel</Btn><Btn variant="danger" onClick={save} disabled={saving}>{saving ? 'Rejecting…' : 'Confirm Rejection'}</Btn></>}>
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#92400E', marginBottom: '18px' }}>
        ⚠️ This action will mark the candidate as Rejected.
      </div>
      <Field label="Reason for Rejection (internal)">
        <select value={reason} onChange={e => setReason(e.target.value)} style={inputSt}>
          <option value="">— Select a reason —</option>
          {['Skills do not match requirements', 'Position already filled', 'Salary expectations too high', 'Did not clear technical round', 'Did not clear HR round', 'No-show for interview', 'Other'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
      {reason === 'Other' && (
        <Field label="Specify reason">
          <input value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Describe the reason…" style={inputSt} />
        </Field>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#F8FAFC', border: `1.5px solid ${BORDER}`, borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
        <div style={{ position: 'relative', width: '40px', height: '22px', flexShrink: 0, marginTop: '2px' }}>
          <input type="checkbox" checked={showToCandidate} onChange={e => setShowToCandidate(e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} id="showToggle" />
          <label htmlFor="showToggle" style={{ position: 'absolute', inset: 0, background: showToCandidate ? PRIMARY : '#CBD5E1', borderRadius: '22px', cursor: 'pointer', transition: '.2s' }}>
            <span style={{ position: 'absolute', width: '16px', height: '16px', left: showToCandidate ? '21px' : '3px', top: '3px', background: '#fff', borderRadius: '50%', transition: '.2s' }} />
          </label>
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>Share rejection reason with candidate</div>
          <div style={{ fontSize: '11px', color: SUB, marginTop: '2px' }}>If ON, candidate sees your message in their application status.</div>
        </div>
      </div>
      {showToCandidate && (
        <Field label="Message to Candidate">
          <textarea rows={4} placeholder="e.g. Thank you for your time. After careful consideration, we've decided to move forward with other candidates…" value={candidateMsg} onChange={e => setCandidateMsg(e.target.value)} style={{ ...inputSt, resize: 'vertical' }} />
        </Field>
      )}
    </Modal>
  );
}

/* ── Offer Letter Modal ── */
function OfferModal({ applicant, onClose, onDone }: { applicant: Applicant; onClose: () => void; onDone: (updated: Applicant) => void }) {
  const ex = applicant.offerLetter;
  const [form, setForm] = useState({ designation: ex?.designation || '', department: ex?.department || '', ctc: ex?.ctc?.toString() || '', fixedCtc: ex?.fixedCtc?.toString() || '', variableCtc: ex?.variableCtc?.toString() || '', joiningDate: ex?.joiningDate || '', workLocation: ex?.workLocation || '', workMode: ex?.workMode || 'Work from Office', benefits: ex?.benefits || '', specialNote: ex?.specialNote || '', offerExpiry: ex?.offerExpiry || '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.designation || !form.ctc || !form.joiningDate) return alert('Designation, CTC and Joining Date are required.');
    setSaving(true);
    try {
      const r = await api.post(`/industry-portal/applicants/${applicant.applicationId}/offer-letter`, {
        ...form, ctc: parseInt(form.ctc) || null, fixedCtc: parseInt(form.fixedCtc) || null, variableCtc: parseInt(form.variableCtc) || null,
      });
      // refresh applicant
      const full = await api.get(`/industry-portal/applicants/${applicant.applicationId}`);
      onDone(full.data.data);
    } catch { alert('Failed to generate offer letter.'); } finally { setSaving(false); }
  };

  return (
    <Modal title={ex ? 'Update Offer Letter' : 'Generate Offer Letter'} subtitle={`${applicant.studentEmail} · ${applicant.jobRole}`} onClose={onClose}
      footer={<><Btn variant="outline" onClick={onClose}>Cancel</Btn><Btn variant="green" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Generate & Send Offer'}</Btn></>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <Field label="Designation *"><input value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="e.g. Senior Backend Engineer" style={inputSt} /></Field>
        <Field label="Department"><input value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Engineering" style={inputSt} /></Field>
        <Field label="Annual CTC (₹) *"><input type="number" value={form.ctc} onChange={e => set('ctc', e.target.value)} placeholder="e.g. 1200000" style={inputSt} /></Field>
        <Field label="Fixed Component (₹)"><input type="number" value={form.fixedCtc} onChange={e => set('fixedCtc', e.target.value)} placeholder="e.g. 1000000" style={inputSt} /></Field>
        <Field label="Variable Component (₹)"><input type="number" value={form.variableCtc} onChange={e => set('variableCtc', e.target.value)} placeholder="e.g. 200000" style={inputSt} /></Field>
        <Field label="Work Mode"><select value={form.workMode} onChange={e => set('workMode', e.target.value)} style={inputSt}><option>Work from Office</option><option>Remote</option><option>Hybrid</option></select></Field>
        <Field label="Joining Date *"><input type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} style={inputSt} /></Field>
        <Field label="Work Location"><input value={form.workLocation} onChange={e => set('workLocation', e.target.value)} placeholder="e.g. Mumbai / Remote" style={inputSt} /></Field>
        <Field label="Offer Expiry Date"><input type="date" value={form.offerExpiry} onChange={e => set('offerExpiry', e.target.value)} style={inputSt} /></Field>
      </div>
      <Field label="Benefits (optional)"><textarea rows={2} value={form.benefits} onChange={e => set('benefits', e.target.value)} placeholder="e.g. Health insurance, Laptop, 18 days leave…" style={{ ...inputSt, resize: 'vertical' }} /></Field>
      <Field label="Special Note (optional)"><textarea rows={2} value={form.specialNote} onChange={e => set('specialNote', e.target.value)} placeholder="Any conditions or special notes…" style={{ ...inputSt, resize: 'vertical' }} /></Field>
    </Modal>
  );
}

/* ── Candidate Review Drawer ── */
function ReviewDrawer({ applicant, onClose, onUpdate }: { applicant: Applicant; onClose: () => void; onUpdate: (a: Applicant) => void }) {
  const [modal, setModal] = useState<'schedule' | 'feedback' | 'offer' | 'reject' | null>(null);
  const [shortlisting, setShortlisting] = useState(false);
  const qaList = parseQA(applicant.questionAnswers);
  const resumeUrl = resolveUrl(applicant.resumeUrl);
  const st = STAGE_STYLE[applicant.stage] ?? STAGE_STYLE.APPLIED;

  const shortlist = async () => {
    setShortlisting(true);
    try {
      const r = await api.post(`/industry-portal/applicants/${applicant.applicationId}/shortlist`);
      onUpdate(r.data.data);
    } catch { alert('Failed to shortlist.'); } finally { setShortlisting(false); }
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100 }} />

      {/* Drawer */}
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '560px', background: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 32px rgba(0,0,0,0.15)', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, background: '#F8FAFC', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: PRIMARY, flexShrink: 0 }}>
              {(applicant.studentEmail ?? '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: TEXT }}>{applicant.studentEmail}</div>
              <div style={{ fontSize: '12px', color: SUB, marginTop: '2px' }}>Applied for <strong>{applicant.jobRole}</strong>{applicant.department ? ` · ${applicant.department}` : ''}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' as const }}>
                <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg }}>{st.label}</span>
                {applicant.currentRound > 0 && <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '11px', background: '#EEF2FF', color: PRIMARY, fontWeight: 600 }}>Round {applicant.currentRound}</span>}
                <span style={{ fontSize: '11px', color: SUB, alignSelf: 'center' }}>Applied {fmtDate(applicant.appliedAt)}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB }}><X size={20} /></button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: '8px', flexWrap: 'wrap' as const, flexShrink: 0 }}>
          {applicant.stage === 'APPLIED' && (
            <button onClick={shortlist} disabled={shortlisting}
              style={{ padding: '8px 16px', borderRadius: '100px', background: PRIMARY, color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {shortlisting ? 'Shortlisting…' : '✓ Shortlist'}
            </button>
          )}
          {(applicant.stage === 'SHORTLISTED' || applicant.stage === 'INTERVIEW_SCHEDULED') && (
            <button onClick={() => setModal('schedule')}
              style={{ padding: '8px 16px', borderRadius: '100px', background: PRIMARY, color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <Calendar size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {applicant.stage === 'INTERVIEW_SCHEDULED' ? 'Schedule Next Round' : 'Schedule Interview'}
            </button>
          )}
          {applicant.stage === 'INTERVIEW_SCHEDULED' && (
            <button onClick={() => setModal('feedback')}
              style={{ padding: '8px 16px', borderRadius: '100px', background: '#7C3AED', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Add Feedback
            </button>
          )}
          {(applicant.stage === 'SHORTLISTED' || applicant.stage === 'INTERVIEW_SCHEDULED') && (
            <button onClick={() => setModal('offer')}
              style={{ padding: '8px 16px', borderRadius: '100px', background: '#16A34A', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Generate Offer
            </button>
          )}
          {applicant.stage === 'OFFERED' && (
            <button onClick={() => setModal('offer')}
              style={{ padding: '8px 16px', borderRadius: '100px', background: '#16A34A', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Update Offer
            </button>
          )}
          {applicant.stage !== 'REJECTED' && applicant.stage !== 'OFFERED' && (
            <button onClick={() => setModal('reject')}
              style={{ padding: '8px 16px', borderRadius: '100px', background: '#fff', color: '#DC2626', border: '1.5px solid #FCA5A5', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Reject
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Interview scheduled info */}
          {applicant.stage === 'INTERVIEW_SCHEDULED' && applicant.interviewScheduledAt && (
            <div style={{ background: '#EEF2FF', border: `1.5px solid ${PRIMARY}`, borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: PRIMARY, marginBottom: '8px' }}>📅 Round {applicant.currentRound} Scheduled</div>
              <div style={{ fontSize: '13px', color: TEXT, fontWeight: 600 }}>{fmtDateTime(applicant.interviewScheduledAt)}</div>
              {applicant.interviewDurationMinutes && <div style={{ fontSize: '12px', color: SUB, marginTop: '3px' }}><Clock size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} />{applicant.interviewDurationMinutes} mins · {applicant.interviewMode}</div>}
              {applicant.interviewLink && <a href={applicant.interviewLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: PRIMARY, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', textDecoration: 'none' }}><ExternalLink size={11} />Join Meeting</a>}
              {applicant.interviewVenue && <div style={{ fontSize: '12px', color: SUB, marginTop: '3px' }}><MapPin size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} />{applicant.interviewVenue}</div>}
              {applicant.interviewerNames && <div style={{ fontSize: '12px', color: SUB, marginTop: '3px' }}>Interviewer: {applicant.interviewerNames}</div>}
            </div>
          )}

          {/* Offer status */}
          {applicant.offerLetter && (
            <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803D', marginBottom: '6px' }}>🎉 Offer Sent</div>
              <div style={{ fontSize: '13px', color: TEXT }}>{applicant.offerLetter.designation} · ₹{(applicant.offerLetter.ctc / 100000).toFixed(1)}L CTC</div>
              <div style={{ fontSize: '12px', color: SUB, marginTop: '3px' }}>Status: <strong>{applicant.offerLetter.status}</strong> · Joining: {applicant.offerLetter.joiningDate ? new Date(applicant.offerLetter.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
            </div>
          )}

          {/* Contact */}
          <DrawerSection title="Contact" icon={<Mail size={14} color={PRIMARY} />}>
            <DRow label="Email" value={applicant.studentEmail} />
            <DRow label="Phone" value={applicant.studentPhone || '—'} />
          </DrawerSection>

          {/* Resume */}
          <DrawerSection title="Resume" icon={<FileText size={14} color={PRIMARY} />}>
            {resumeUrl ? (
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: '8px', textDecoration: 'none', color: PRIMARY, fontSize: '13px', fontWeight: 600, background: '#F8FAFC' }}>
                <FileText size={15} /> {applicant.resumeFileName || 'View Resume'} <ExternalLink size={12} />
              </a>
            ) : <span style={{ fontSize: '13px', color: '#CBD5E1' }}>No resume attached</span>}
          </DrawerSection>

          {/* Application Details */}
          <DrawerSection title="Application Details" icon={<Briefcase size={14} color={PRIMARY} />}>
            <DRow label="Job Role" value={applicant.jobRole} />
            <DRow label="Department" value={applicant.department} />
            <DRow label="Type" value={applicant.postingType} />
            <DRow label="Applied" value={fmtDate(applicant.appliedAt)} />
          </DrawerSection>

          {/* Feedback (if present) */}
          {applicant.feedbackOverallRating != null && applicant.feedbackOverallRating > 0 && (
            <DrawerSection title="Interview Feedback" icon={<Star size={14} color={PRIMARY} />}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '10px' }}>
                {[1,2,3,4,5].map(n => <Star key={n} size={16} fill={n <= applicant.feedbackOverallRating ? '#F59E0B' : 'none'} color={n <= applicant.feedbackOverallRating ? '#F59E0B' : '#CBD5E1'} />)}
                <span style={{ fontSize: '12px', color: SUB, marginLeft: '6px', alignSelf: 'center' }}>{applicant.feedbackOverallRating}/5</span>
              </div>
              {applicant.feedbackStrengths && <DRow label="Strengths" value={applicant.feedbackStrengths} />}
              {applicant.feedbackConcerns && <DRow label="Concerns" value={applicant.feedbackConcerns} />}
            </DrawerSection>
          )}

          {/* Screening Q&A */}
          {qaList.length > 0 && (
            <DrawerSection title={`Screening Answers (${qaList.length})`} icon={<ChevronRight size={14} color={PRIMARY} />}>
              {qaList.map((qa, i) => (
                <div key={i} style={{ marginBottom: i < qaList.length - 1 ? '12px' : 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT, marginBottom: '4px' }}>{i + 1}. {qa.question}</div>
                  <div style={{ fontSize: '13px', color: SUB, background: '#F8FAFC', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '8px 12px' }}>{qa.answer || <em style={{ color: '#CBD5E1' }}>No answer provided</em>}</div>
                </div>
              ))}
            </DrawerSection>
          )}
        </div>
      </div>

      {/* Sub-modals */}
      {modal === 'schedule' && <ScheduleModal applicant={applicant} onClose={() => setModal(null)} onDone={a => { onUpdate(a); setModal(null); }} />}
      {modal === 'feedback' && <FeedbackModal applicant={applicant} onClose={() => setModal(null)} onDone={a => { onUpdate(a); setModal(null); }} />}
      {modal === 'reject'   && <RejectModal   applicant={applicant} onClose={() => setModal(null)} onDone={a => { onUpdate(a); setModal(null); onClose(); }} />}
      {modal === 'offer'    && <OfferModal    applicant={applicant} onClose={() => setModal(null)} onDone={a => { onUpdate(a); setModal(null); }} />}
    </>
  );
}

function DrawerSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        {icon}<span style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>{title}</span>
      </div>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '12px 14px', background: '#fff' }}>{children}</div>
    </div>
  );
}

function DRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ width: '120px', fontSize: '12px', color: SUB, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '13px', color: TEXT, fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

/* ── Main Page ── */
export default function CandidatesPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [selected, setSelected] = useState<Applicant | null>(null);

  useEffect(() => {
    api.get('/industry-portal/applicants')
      .then(r => setApplicants(r.data?.data ?? []))
      .catch(() => setApplicants([]))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (updated: Applicant) => {
    setApplicants(prev => prev.map(a => a.applicationId === updated.applicationId ? updated : a));
    setSelected(updated);
  };

  const filtered = applicants.filter(a => {
    const matchSearch = !search || a.studentEmail?.toLowerCase().includes(search.toLowerCase()) || a.jobRole?.toLowerCase().includes(search.toLowerCase());
    const matchStage = !stageFilter || a.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const handleExport = () => {
    const rows = [['Email', 'Phone', 'Job Role', 'Stage', 'Round', 'Applied Date']];
    filtered.forEach(a => rows.push([a.studentEmail ?? '', a.studentPhone ?? '', a.jobRole ?? '', a.stage ?? '', String(a.currentRound ?? 0), a.appliedAt ? new Date(a.appliedAt).toLocaleDateString('en-IN') : '']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const el = document.createElement('a'); el.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); el.download = 'candidates.csv'; el.click();
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
          style={{ height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '0 12px', fontSize: '13px', outline: 'none', color: TEXT, background: '#fff' }}>
          <option value="">All Stages</option>
          {Object.entries(STAGE_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: SUB }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or job"
            style={{ paddingLeft: '32px', paddingRight: '12px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '100px', fontSize: '13px', outline: 'none', width: '220px' }} />
        </div>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 14px', height: '36px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', cursor: 'pointer', color: TEXT, fontSize: '13px' }}>
          <Download size={14} /> Export
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${BORDER}`, overflow: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#F8FAFC' }}>
              {['Job Role', 'Candidate', 'Applied', 'Stage', 'Interview', 'Resume'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: SUB }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: SUB }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: SUB }}>
                <Users size={36} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, color: TEXT, marginBottom: '6px' }}>No candidates yet</div>
                <div style={{ fontSize: '13px' }}>Candidates who apply to your job postings will appear here.</div>
              </td></tr>
            ) : filtered.map(a => {
              const st = STAGE_STYLE[a.stage] ?? STAGE_STYLE.APPLIED;
              const resumeUrl = resolveUrl(a.resumeUrl);
              return (
                <tr key={a.applicationId} onClick={() => setSelected(a)} style={{ borderBottom: `1px solid ${BORDER}`, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: TEXT }}>{a.jobRole}</div>
                    <div style={{ fontSize: '11px', color: SUB }}>{a.department}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: PRIMARY, flexShrink: 0 }}>
                        {(a.studentEmail ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: TEXT }}>{a.studentEmail}</div>
                        {a.studentPhone && <div style={{ fontSize: '11px', color: SUB }}>{a.studentPhone}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: SUB, fontSize: '12px' }}>{fmtDate(a.appliedAt)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg }}>{st.label}</span>
                    {a.currentRound > 0 && <div style={{ fontSize: '11px', color: SUB, marginTop: '3px' }}>Round {a.currentRound}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: a.interviewScheduledAt ? '#7C3AED' : SUB }}>
                    {a.interviewScheduledAt ? fmtDateTime(a.interviewScheduledAt) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                    {resumeUrl
                      ? <a href={resumeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: PRIMARY, textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={13} />View</a>
                      : <span style={{ fontSize: '12px', color: '#CBD5E1' }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && <ReviewDrawer applicant={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} />}
    </div>
  );
}
