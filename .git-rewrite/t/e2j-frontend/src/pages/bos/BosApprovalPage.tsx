import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const PRIMARY = '#3F41D1';
const TEXT    = '#1E293B';
const SUB     = '#64748B';
const BORDER  = '#E2E8F0';
const BG      = '#F8FAFC';

interface Approval {
  id: number;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks: string | null;
  decidedAt: string | null;
  createdAt: string;
  curriculum: {
    id: number;
    programName: string;
    major: string;
    degree: string;
    academicYear: string;
    status: string;
  };
  bosMember: { name: string; designation: string; organization: string; };
}

interface Module  { number: number; name: string; hours: number; }
interface Subject { code: string; name: string; objectives: string[]; outcomes: string[]; modules: Module[]; }
interface Semester { name: string; subjects: Subject[]; }

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Pending Review', color: '#92400E', bg: '#FEF3C7' },
  APPROVED: { label: 'Approved',       color: '#15803D', bg: '#DCFCE7' },
  REJECTED: { label: 'Rejected',       color: '#B91C1C', bg: '#FEE2E2' },
};

async function fetchAndParseSyllabus(url: string): Promise<Semester[]> {
  try {
    const path = url.startsWith('/api/') ? url.slice(4) : url;
    const res = await api.get(path, { responseType: 'arraybuffer' });
    const wb = XLSX.read(res.data, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (rows.length < 2) return [];
    const semesters: Semester[] = [];
    let curSem: Semester | null = null;
    let curSub: Subject | null = null;
    for (let i = 1; i < rows.length; i++) {
      const [semRaw, code, name, modNo, modName, , hours, objRaw, outRaw] = rows[i];
      if (!modName && !modNo) continue;
      const semName = semRaw ? `Semester ${semRaw}` : (curSem?.name ?? 'Semester 1');
      if (!curSem || curSem.name !== semName) {
        curSem = { name: semName, subjects: [] };
        semesters.push(curSem);
        curSub = null;
      }
      const subCode = String(code || '').trim();
      const subName = String(name || '').trim();
      if (subCode && subCode !== (curSub?.code ?? '')) {
        const objectives = objRaw ? String(objRaw).split('\n').map((s: string) => s.trim()).filter(Boolean) : [];
        const outcomes   = outRaw ? String(outRaw).split('\n').map((s: string) => s.trim()).filter(Boolean) : [];
        curSub = { code: subCode, name: subName, objectives, outcomes, modules: [] };
        curSem.subjects.push(curSub);
      }
      if (curSub) {
        curSub.modules.push({ number: Number(modNo) || curSub.modules.length + 1, name: String(modName).trim(), hours: Number(hours) || 0 });
      }
    }
    return semesters;
  } catch { return []; }
}

export default function BosApprovalPage() {
  const { user, clearAuth } = useAuth();
  const [approvals, setApprovals]   = useState<Approval[]>([]);
  const [selected,  setSelected]    = useState<Approval | null>(null);
  const [remarks,   setRemarks]     = useState('');
  const [loading,   setLoading]     = useState(false);
  const [confirmed, setConfirmed]   = useState<'APPROVED' | 'REJECTED' | null>(null);

  // preview state
  const [preview,       setPreview]       = useState<Approval | null>(null);
  const [semesters,     setSemesters]     = useState<Semester[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [expandedSems,  setExpandedSems]  = useState<Set<string>>(new Set());
  const [expandedSubs,  setExpandedSubs]  = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get('/bos/approvals').then(r => setApprovals(r.data?.data ?? [])).catch(() => {});
  }, []);

  const [approvalType, setApprovalType] = useState<string>('ORIGINAL');

  const openPreview = async (a: Approval) => {
    setPreview(a);
    setSemesters([]);
    setExpandedSems(new Set());
    setExpandedSubs(new Set());
    setPreviewLoading(true);
    try {
      const res = await api.get(`/bos/curriculum/${a.curriculum.id}/preview`);
      const { syllabusUrl, approvalType: aType, curriculumJson } = res.data?.data ?? {};
      setApprovalType(aType ?? 'ORIGINAL');

      if (aType === 'AI_GENERATED' && curriculumJson) {
        // Show AI-generated semesters from stored JSON
        try {
          const parsed = JSON.parse(curriculumJson);
          const aiSems: Semester[] = (parsed.semesters ?? []).map((s: any) => ({
            name: s.name,
            subjects: (s.subjects ?? []).map((sub: any) => ({
              code: sub.code,
              name: sub.name,
              objectives: sub.objectives ?? [],
              outcomes: sub.outcomes ?? [],
              modules: (sub.modules ?? []).map((m: any) => ({ number: m.number, name: m.name, hours: m.hours ?? 0 })),
            })),
          }));
          setSemesters(aiSems);
          setExpandedSems(new Set(aiSems.map(s => s.name)));
        } catch { setSemesters([]); }
      } else if (syllabusUrl) {
        const parsed = await fetchAndParseSyllabus(syllabusUrl);
        setSemesters(parsed);
        setExpandedSems(new Set(parsed.map(s => s.name)));
      }
    } finally { setPreviewLoading(false); }
  };

  const toggleSem = (name: string) => setExpandedSems(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s; });
  const toggleSub = (key: string) => setExpandedSubs(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  const decide = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.post(`/bos/approvals/${selected.id}/decide`, { decision, remarks });
      setApprovals(prev => prev.map(a => a.id === selected.id
        ? { ...a, decision, remarks, decidedAt: new Date().toISOString() } : a));
      setConfirmed(decision);
    } finally { setLoading(false); }
  };

  const closeModal = () => { setSelected(null); setRemarks(''); setConfirmed(null); };
  const pending  = approvals.filter(a => a.decision === 'PENDING');
  const reviewed = approvals.filter(a => a.decision !== 'PENDING');

  // ── PREVIEW VIEW ─────────────────────────────────────────────────────────────
  if (preview) return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: SUB, fontSize: '13px' }}>
            <ArrowLeft size={16} /> Back
          </button>
          <span style={{ color: BORDER }}>|</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: TEXT }}>
            {preview.curriculum.degree} — {preview.curriculum.programName}
            {preview.curriculum.major && ` (${preview.curriculum.major})`}
          </span>
          <span style={{ fontSize: '12px', color: SUB, background: BG, border: `1px solid ${BORDER}`, borderRadius: '100px', padding: '2px 10px' }}>{preview.curriculum.academicYear}</span>
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '100px', background: approvalType === 'AI_GENERATED' ? '#EEF2FF' : '#F0FDF4', color: approvalType === 'AI_GENERATED' ? PRIMARY : '#15803D' }}>
            {approvalType === 'AI_GENERATED' ? '🤖 AI Recommended' : '📄 Original'}
          </span>
        </div>
        {preview.decision === 'PENDING' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setSelected(preview); setPreview(null); }} style={{ border: 'none', borderRadius: '8px', background: '#FEE2E2', color: '#B91C1C', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
            <button onClick={() => { setSelected(preview); setPreview(null); }} style={{ border: 'none', borderRadius: '8px', background: PRIMARY, color: '#fff', padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: SUB }}>Loading curriculum…</div>
        ) : semesters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: SUB }}>No syllabus data available for preview.</div>
        ) : semesters.map(sem => (
          <div key={sem.name} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', marginBottom: '12px', overflow: 'hidden' }}>
            <button onClick={() => toggleSem(sem.name)} style={{ width: '100%', background: '#EEF2FF', border: 'none', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: PRIMARY }}>{sem.name}</span>
              {expandedSems.has(sem.name) ? <ChevronDown size={16} color={PRIMARY} /> : <ChevronRight size={16} color={PRIMARY} />}
            </button>
            {expandedSems.has(sem.name) && sem.subjects.map(sub => {
              const key = `${sem.name}-${sub.code}`;
              return (
                <div key={sub.code} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <button onClick={() => toggleSub(key)} style={{ width: '100%', background: 'none', border: 'none', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', background: BG, border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '2px 8px', color: SUB, fontWeight: 600 }}>{sub.code}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{sub.name}</span>
                    </div>
                    {expandedSubs.has(key) ? <ChevronDown size={14} color={SUB} /> : <ChevronRight size={14} color={SUB} />}
                  </button>
                  {expandedSubs.has(key) && (
                    <div style={{ padding: '0 16px 16px 16px' }}>
                      {sub.objectives.filter(Boolean).length > 0 && (
                        <>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: TEXT, margin: '8px 0 4px' }}>Course Objectives</p>
                          {sub.objectives.filter(Boolean).map((o, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#374151', lineHeight: 1.6, marginBottom: '2px' }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#374151', flexShrink: 0, marginTop: '7px' }} />{o}
                            </div>
                          ))}
                        </>
                      )}
                      {sub.outcomes.filter(Boolean).length > 0 && (
                        <>
                          <p style={{ fontSize: '12px', fontWeight: 600, color: TEXT, margin: '8px 0 4px' }}>Expected Course Outcome</p>
                          {sub.outcomes.filter(Boolean).map((o, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#374151', lineHeight: 1.6, marginBottom: '2px' }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#374151', flexShrink: 0, marginTop: '7px' }} />{o}
                            </div>
                          ))}
                        </>
                      )}
                      {sub.modules.length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {sub.modules.map(m => (
                            <div key={m.number} style={{ display: 'flex', justifyContent: 'space-between', background: BG, borderRadius: '6px', padding: '6px 10px', fontSize: '12px', color: TEXT }}>
                              <span>Module {m.number} — {m.name}</span>
                              {m.hours > 0 && <span style={{ color: SUB }}>{m.hours} hrs</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  // ── LIST VIEW ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>E</span>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: TEXT }}>BOS Review Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: SUB }}>{user?.name}</span>
          <button onClick={clearAuth} style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', color: TEXT }}>Logout</button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Pending Review', value: pending.length,                                          color: '#92400E', bg: '#FEF3C7' },
            { label: 'Approved',       value: approvals.filter(a => a.decision === 'APPROVED').length, color: '#15803D', bg: '#DCFCE7' },
            { label: 'Rejected',       value: approvals.filter(a => a.decision === 'REJECTED').length, color: '#B91C1C', bg: '#FEE2E2' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: SUB, marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {pending.length > 0 && (
          <>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: '0 0 16px' }}>Pending Review ({pending.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {pending.map(a => <ApprovalCard key={a.id} approval={a} onReview={() => openPreview(a)} />)}
            </div>
          </>
        )}

        {reviewed.length > 0 && (
          <>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: '0 0 16px' }}>Reviewed ({reviewed.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reviewed.map(a => <ApprovalCard key={a.id} approval={a} />)}
            </div>
          </>
        )}

        {approvals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: SUB }}>
            <Clock size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', fontWeight: 500 }}>No curriculum approvals assigned yet</p>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '32px' }}>
            {confirmed ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: confirmed === 'APPROVED' ? '#DCFCE7' : '#FEE2E2', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {confirmed === 'APPROVED' ? <CheckCircle size={32} color="#15803D" /> : <XCircle size={32} color="#B91C1C" />}
                </div>
                <p style={{ fontSize: '16px', fontWeight: 700, color: TEXT, margin: '0 0 8px' }}>
                  {confirmed === 'APPROVED' ? 'Curriculum Approved' : 'Curriculum Rejected'}
                </p>
                <p style={{ fontSize: '13px', color: SUB, margin: '0 0 24px' }}>
                  {confirmed === 'APPROVED'
                    ? 'Your approval has been recorded. The curriculum will proceed once all BOS members approve.'
                    : 'The curriculum has been sent back to the institute for revision.'}
                </p>
                <button onClick={closeModal} style={{ border: 'none', borderRadius: '20px', background: PRIMARY, color: '#fff', padding: '10px 40px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Confirm Decision</h3>
                <p style={{ fontSize: '13px', color: SUB, margin: '0 0 20px' }}>
                  {selected.curriculum.programName}{selected.curriculum.major ? ` — ${selected.curriculum.major}` : ''} · {selected.curriculum.academicYear}
                </p>
                <label style={{ fontSize: '13px', fontWeight: 600, color: TEXT, display: 'block', marginBottom: '8px' }}>Remarks (optional)</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Add comments or feedback..."
                  rows={4}
                  style={{ width: '100%', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button onClick={closeModal} disabled={loading}
                    style={{ flex: 1, border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', padding: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', color: TEXT }}>
                    Cancel
                  </button>
                  <button onClick={() => decide('REJECTED')} disabled={loading}
                    style={{ flex: 1, border: 'none', borderRadius: '8px', background: '#FEE2E2', color: '#B91C1C', padding: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    Reject
                  </button>
                  <button onClick={() => decide('APPROVED')} disabled={loading}
                    style={{ flex: 1, border: 'none', borderRadius: '8px', background: PRIMARY, color: '#fff', padding: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    {loading ? '...' : 'Approve'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalCard({ approval, onReview }: { approval: Approval; onReview?: () => void }) {
  const s = STATUS_STYLE[approval.decision];
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: TEXT }}>{approval.curriculum.programName}</span>
          {approval.curriculum.major && (
            <span style={{ fontSize: '12px', color: SUB, background: BG, border: `1px solid ${BORDER}`, borderRadius: '100px', padding: '2px 10px' }}>{approval.curriculum.major}</span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: SUB }}>
          {approval.curriculum.degree} · {approval.curriculum.academicYear}
          {approval.decidedAt && ` · Reviewed ${new Date(approval.decidedAt).toLocaleDateString('en-IN')}`}
        </div>
        {approval.remarks && (
          <div style={{ fontSize: '12px', color: SUB, marginTop: '6px', fontStyle: 'italic' }}>"{approval.remarks}"</div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: s.color, background: s.bg, padding: '4px 12px', borderRadius: '100px' }}>{s.label}</span>
        {onReview && (
          <button onClick={onReview} style={{ border: `1px solid ${PRIMARY}`, borderRadius: '8px', background: '#fff', color: PRIMARY, padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Review
          </button>
        )}
      </div>
    </div>
  );
}
