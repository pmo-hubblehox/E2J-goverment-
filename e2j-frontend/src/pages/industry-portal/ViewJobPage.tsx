import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, MapPin, Briefcase, Users, Calendar, FileText, ChevronDown } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';
const BG = '#F8FAFC';

const STAGE_STYLE: Record<string, { color: string; bg: string }> = {
  APPLIED:           { color: '#64748B', bg: '#F1F5F9' },
  SHORTLISTED:       { color: '#7C3AED', bg: '#EDE9FE' },
  INTERVIEW_ROUND_1: { color: '#1D4ED8', bg: '#DBEAFE' },
  INTERVIEW_ROUND_2: { color: '#92400E', bg: '#FEF3C7' },
  OFFERED:           { color: '#15803D', bg: '#DCFCE7' },
  REJECTED:          { color: '#B91C1C', bg: '#FEE2E2' },
};

function stageLabel(s: string) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? s;
}

function resolveUrl(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/api/')) return `http://localhost:8081${raw}`;
  return '';
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PUBLISHED:   { color: '#15803D', bg: '#DCFCE7' },
  UNPUBLISHED: { color: '#B91C1C', bg: '#FEE2E2' },
  DRAFT:       { color: '#64748B', bg: '#F1F5F9' },
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ minWidth: '180px', fontSize: '13px', color: SUB, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '13px', color: TEXT }}>{value}</span>
    </div>
  );
}

export default function ViewJobPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [expandedApplicant, setExpandedApplicant] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/industry-portal/jobs/${id}`)
      .then(r => setJob(r.data?.data ?? r.data))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
    api.get(`/industry-portal/jobs/${id}/applicants`)
      .then(r => setApplicants(r.data?.data ?? []))
      .catch(() => setApplicants([]));
  }, [id]);

  const handleUpdateStage = async (appId: number, stage: string) => {
    try {
      await api.patch(`/industry-portal/applicants/${appId}/stage`, { stage });
      setApplicants(prev => prev.map(a => a.applicationId === appId ? { ...a, stage } : a));
    } catch { alert('Failed to update stage.'); }
  };

  const isIntern = job?.postingType === 'INTERNSHIP';
  const st = STATUS_STYLE[job?.status] ?? STATUS_STYLE.DRAFT;

  return (
    <div style={{ padding: '24px', background: BG, minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/industry-portal/jobs')}
            style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={16} color={TEXT} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: TEXT }}>
              {loading ? 'Loading…' : job?.jobRole ?? 'Job Details'}
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: SUB }}>{isIntern ? 'Internship' : 'Job Posting'} · ID #{id}</p>
          </div>
        </div>
        {job && (
          <button onClick={() => navigate(`/industry-portal/jobs/${id}/edit`)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <Edit2 size={14} /> Edit
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: SUB }}>Loading…</div>
      ) : !job ? (
        <div style={{ textAlign: 'center', padding: '60px', color: SUB }}>Job not found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status + Meta */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: TEXT }}>{job.jobRole}</h3>
              <span style={{ padding: '4px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: st.color, background: st.bg }}>
                {job.status?.charAt(0) + (job.status?.slice(1).toLowerCase() ?? '')}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '16px' }}>
              {[
                { icon: Briefcase, text: job.department },
                { icon: MapPin,    text: job.location },
                { icon: Users,     text: `${job.positions} Position${job.positions !== 1 ? 's' : ''}` },
                { icon: Calendar,  text: job.targetDate ? `Target: ${job.targetDate}` : null },
              ].filter(i => i.text).map(({ icon: Icon, text }) => (
                <span key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: SUB }}>
                  <Icon size={14} /> {text}
                </span>
              ))}
            </div>
          </div>

          {/* Details */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: TEXT }}>Job Details</h4>
            <InfoRow label="Employment Type"    value={job.employmentType} />
            <InfoRow label="Work Mode"          value={job.workMode} />
            <InfoRow label="Department"         value={job.department} />
            <InfoRow label="Location"           value={job.location} />
            <InfoRow label="Positions"          value={job.positions} />
            <InfoRow label="Target Date"        value={job.targetDate} />
            {isIntern && <InfoRow label="Duration"     value={job.internshipDuration} />}
            {isIntern && job.hasStipend && <InfoRow label="Stipend" value={`₹${job.stipendAmount}`} />}
            {(() => {
              const raw = job.attachJd ?? '';
              const jdUrl = raw.startsWith('http://') || raw.startsWith('https://') ? raw
                : raw.startsWith('/api/') ? `http://localhost:8081${raw}` : '';
              return jdUrl ? (
                <div style={{ display: 'flex', gap: '12px', padding: '12px 0' }}>
                  <span style={{ minWidth: '180px', fontSize: '13px', color: SUB, fontWeight: 500 }}>JD Attachment</span>
                  <a href={jdUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: PRIMARY, textDecoration: 'none' }}>
                    <FileText size={14} /> View JD
                  </a>
                </div>
              ) : null;
            })()}
          </div>

          {/* Interview Rounds */}
          {job.interviewRounds?.length > 0 && (
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 700, color: TEXT }}>Interview Rounds</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: BG }}>
                    {['#', 'Round Name', 'Mode', 'Type'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: SUB, borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {job.interviewRounds.map((r: any, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '10px 12px', color: SUB }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px', color: TEXT }}>{r.roundName || '—'}</td>
                      <td style={{ padding: '10px 12px', color: TEXT }}>{r.mode || '—'}</td>
                      <td style={{ padding: '10px 12px', color: TEXT }}>{r.type || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          </div>

          {/* RIGHT COLUMN — Applicants */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: TEXT }}>
                Applicants
                <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 600, color: PRIMARY, background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '100px', padding: '2px 10px' }}>
                  {applicants.length}
                </span>
              </h4>
              {applicants.length > 0 && (
                <button onClick={() => navigate('/industry-portal/candidates')}
                  style={{ fontSize: '12px', color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  View All Candidates →
                </button>
              )}
            </div>

            {applicants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: SUB }}>
                <Users size={32} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: '13px' }}>No applications yet for this position.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {applicants.map((a: any, idx: number) => {
                  const st = STAGE_STYLE[a.stage] ?? STAGE_STYLE.APPLIED;
                  const resumeUrl = resolveUrl(a.resumeUrl);
                  const isExpanded = expandedApplicant === a.applicationId;
                  let qaList: { question: string; answer: string }[] = [];
                  try { qaList = a.questionAnswers ? JSON.parse(a.questionAnswers) : []; } catch {}

                  return (
                    <div key={a.applicationId} style={{ borderBottom: idx < applicants.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                      {/* Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', cursor: 'pointer' }}
                        onClick={() => setExpandedApplicant(isExpanded ? null : a.applicationId)}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: PRIMARY, flexShrink: 0 }}>
                          {(a.studentEmail ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{a.studentEmail}</div>
                          <div style={{ fontSize: '11px', color: SUB }}>
                            {a.studentPhone || ''}
                            {a.appliedAt ? ` · Applied ${new Date(a.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                          </div>
                        </div>
                        <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg, flexShrink: 0 }}>
                          {stageLabel(a.stage)}
                        </span>
                        <ChevronDown size={16} color={SUB} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }} />
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div style={{ paddingBottom: '16px', paddingLeft: '48px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {/* Resume */}
                          {resumeUrl ? (
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', border: `1px solid ${BORDER}`, borderRadius: '8px', textDecoration: 'none', color: PRIMARY, fontSize: '13px', fontWeight: 600, background: BG, width: 'fit-content' }}>
                              <FileText size={15} /> {a.resumeFileName || 'View Resume'} ↗
                            </a>
                          ) : (
                            <span style={{ fontSize: '13px', color: '#CBD5E1' }}>No resume attached</span>
                          )}

                          {/* Screening answers */}
                          {qaList.length > 0 && (
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: TEXT, marginBottom: '8px' }}>Screening Answers</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {qaList.map((qa, i) => (
                                  <div key={i} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 14px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: TEXT, marginBottom: '4px' }}>{i + 1}. {qa.question}</div>
                                    <div style={{ fontSize: '13px', color: SUB }}>{qa.answer || <em>No answer</em>}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Stage update */}
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: TEXT, marginBottom: '8px' }}>Update Stage</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {['SHORTLISTED', 'INTERVIEW_ROUND_1', 'INTERVIEW_ROUND_2', 'OFFERED', 'REJECTED'].map(s => {
                                const ss = STAGE_STYLE[s];
                                const isActive = a.stage === s;
                                return (
                                  <button key={s} onClick={() => handleUpdateStage(a.applicationId, s)}
                                    style={{ padding: '5px 14px', borderRadius: '100px', border: `1.5px solid ${isActive ? ss.color : BORDER}`, background: isActive ? ss.bg : '#fff', color: isActive ? ss.color : SUB, fontSize: '12px', fontWeight: isActive ? 600 : 400, cursor: 'pointer' }}>
                                    {stageLabel(s)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
