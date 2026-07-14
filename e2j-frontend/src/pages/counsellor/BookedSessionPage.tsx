import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Plus, Calendar, List, X, Star, ExternalLink, ChevronLeft, ChevronRight, Pencil, FileText, Loader2, Briefcase, GraduationCap, Award, MapPin, Clock } from 'lucide-react';
import PsychometricReportView from '../../components/PsychometricReportView';


type SessionStatus = 'AVAILABLE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

interface AvailSession {
  id: number;
  dateFrom: string;
  dateTo: string;
  days: string[];
  timeSlots: string[];
  feeAmount: number;
  feeType: string;
  status: SessionStatus;
  recurWeeks: number;
}

interface StudentBooking {
  id: number;
  studentName: string;
  studentEmail: string;
  sessionDate: string;
  sessionTime: string;
  feeAmount: number;
  status: string;
  meetLink: string;
  createdAt: string;
  psychometricReport?: {
    id: number;
    topInterests: string;
    topCareerMatch: string;
    totalScore: number;
    scores: Record<string, number>;
    recommendedPaths: string[];
    createdAt: string;
    feedbackKeyObservations?: string;
    feedbackActionItems?: string;
    feedbackResourcesRecommended?: string;
    feedbackRatings?: Record<string, number>;
    feedbackOutcomes?: Record<string, string>;
    counsellorComment?: string;
  };
  questionnaire?: Record<string, string>;
}

// ── Student Profile Tab content (used inside ReportModal) ───────────────────
function StudentProfileTab({ booking }: { booking: StudentBooking }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/counsellor/bookings/${booking.id}/student-profile`)
      .then(r => setProfile(r.data?.data ?? null))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [booking.id]);

  const PRIMARY = '#3F41D1', BORDER = '#E2E8F0', TEXT = '#1E293B', SUB = '#64748B';
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || booking.studentName;
  const city = profile?.presentAddress?.city;
  const state = profile?.presentAddress?.state;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '40px', color: SUB, fontSize: '13px' }}>
      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading profile…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!profile) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>Could not load this student's profile.</div>
  );

  return (
    <div>
      {/* Hero card */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ height: '100px', background: 'linear-gradient(135deg,#667eea,#764ba2)' }} />
        <div style={{ padding: '0 24px 24px', position: 'relative' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: '#fff', position: 'absolute', top: '-36px' }}>
            {profile.photoUrl ? <img src={profile.photoUrl} alt={name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : name.charAt(0).toUpperCase()}
          </div>
          <div style={{ paddingTop: '44px' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: TEXT }}>{name}</h2>
            <p style={{ margin: '0 0 6px', fontSize: '13px', color: SUB }}>{profile.email ?? booking.studentEmail}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {(city || state) && (
                <span style={{ fontSize: '12px', color: SUB, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={12} /> {[city, state].filter(Boolean).join(', ')}
                </span>
              )}
              {profile.experienceCategory && (
                <span style={{ fontSize: '12px', color: SUB, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Briefcase size={12} /> {profile.experienceCategory}
                  {(profile.totalExpYears != null || profile.totalExpMonths != null) ? ` · ${profile.totalExpYears ?? 0} yr ${profile.totalExpMonths ?? 0} mo` : ''}
                </span>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: '#0A66C2', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
                  <ExternalLink size={12} /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px 20px', marginBottom: '12px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 700, color: TEXT }}>Skills</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {profile.skills.map((s: string) => (
              <span key={s} style={{ fontSize: '12px', background: '#EEF2FF', color: PRIMARY, padding: '4px 12px', borderRadius: '20px', fontWeight: 500 }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {(profile.experienceCategory || profile.workExperiences?.length > 0) && (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px 20px', marginBottom: '12px' }}>
          <h4 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Briefcase size={14} color={PRIMARY} /> Work Experience
          </h4>
          {profile.experienceCategory && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#EEF2FF', borderRadius: '8px', marginBottom: profile.workExperiences?.length > 0 ? '12px' : 0 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY }}>{profile.experienceCategory}</span>
              {(profile.totalExpYears != null || profile.totalExpMonths != null) && (
                <span style={{ fontSize: '12px', color: SUB }}>· {profile.totalExpYears ?? 0} yr {profile.totalExpMonths ?? 0} mo</span>
              )}
            </div>
          )}
          {profile.workExperiences?.map((w: any, i: number) => (
            <div key={i} style={{ paddingBottom: i < profile.workExperiences.length - 1 ? '14px' : 0, marginBottom: i < profile.workExperiences.length - 1 ? '14px' : 0, borderBottom: i < profile.workExperiences.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: TEXT }}>{w.companyName}</p>
              <p style={{ margin: '0 0 2px', fontSize: '12px', color: SUB }}>{w.employmentType}{w.location ? ` · ${w.location}` : ''}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={10} /> {w.fromDate} – {w.toDate ?? 'Present'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {profile.educations?.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px 20px', marginBottom: '12px' }}>
          <h4 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GraduationCap size={14} color={PRIMARY} /> Education
          </h4>
          {profile.educations.map((e: any, i: number) => (
            <div key={i} style={{ paddingBottom: i < profile.educations.length - 1 ? '14px' : 0, marginBottom: i < profile.educations.length - 1 ? '14px' : 0, borderBottom: i < profile.educations.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: TEXT }}>{e.degree}{e.majorSpecialization ? ` — ${e.majorSpecialization}` : ''}</p>
              <p style={{ margin: '0 0 2px', fontSize: '12px', color: SUB }}>{e.schoolUniversity}</p>
              {e.yearOfPassing && <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{e.yearOfPassing}{e.percentageCgpa ? ` · ${e.percentageCgpa}%` : ''}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {profile.certifications?.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px 20px', marginBottom: '12px' }}>
          <h4 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={14} color={PRIMARY} /> Certifications
          </h4>
          {profile.certifications.map((c: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: i < profile.certifications.length - 1 ? '12px' : 0, marginBottom: i < profile.certifications.length - 1 ? '12px' : 0, borderBottom: i < profile.certifications.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: TEXT }}>{c.certificationName}</p>
                <p style={{ margin: 0, fontSize: '12px', color: SUB }}>{c.awardingInstitute}</p>
              </div>
              {c.validTill && <span style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap' }}>Valid till {c.validTill}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Combined Report Modal (3 tabs) ───────────────────────────────────────────
function ReportModal({ booking, onClose, onSaved }: { booking: StudentBooking; onClose: () => void; onSaved: () => void }) {
  const TEXT = '#1E293B', SUB = '#64748B', BORDER = '#E2E8F0', PRIMARY = '#4F46E5';
  const [activeTab, setActiveTab] = useState<'profile' | 'questionnaire' | 'psychometric' | 'feedback'>('profile');

  const alreadySaved = !!(booking.psychometricReport?.feedbackKeyObservations || booking.psychometricReport?.feedbackActionItems || booking.psychometricReport?.counsellorComment);

  // Pre-fill from saved report if exists, otherwise empty
  const pr = booking.psychometricReport;
  const savedRatings   = pr?.feedbackRatings  ?? null;
  const savedOutcomes  = pr?.feedbackOutcomes ?? null;
  const savedActions   = (() => { try { return pr?.feedbackActionItems  ? JSON.parse(pr.feedbackActionItems)  : []; } catch { return []; } })();
  const savedResources = (() => { try { return pr?.feedbackResourcesRecommended ? JSON.parse(pr.feedbackResourcesRecommended) : []; } catch { return []; } })();

  // Feedback form state
  const [ratings, setRatings]     = useState(savedRatings  ?? { sessionQuality: 0, engagement: 0, goalClarity: 0, receptiveness: 0 });
  const [outcomes, setOutcomes]   = useState(savedOutcomes ?? { understoodProfile: '', actionPlan: '', resources: '', nextSteps: '' });
  const [keyObs, setKeyObs]       = useState(pr?.feedbackKeyObservations ?? '');
  const [actionItems, setActionItems] = useState<{ text: string }[]>(savedActions);
  const [newActionItem, setNewActionItem] = useState('');
  const [resourcesList, setResourcesList] = useState<{ title: string; url: string }[]>(savedResources);
  const [newResTitle, setNewResTitle] = useState('');
  const [newResUrl, setNewResUrl]   = useState('');
  const [comment, setComment]     = useState(pr?.counsellorComment ?? '');
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');

  const LIKERT_OPTS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
  const STAR_LABELS = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

  const handleSave = async () => {
    setSaving(true); setSaveError('');
    try {
      await api.post(`/counsellor/bookings/${booking.id}/report-comment`, {
        comment, keyObservations: keyObs,
        actionItems: JSON.stringify(actionItems),
        resourcesRecommended: JSON.stringify(resourcesList),
        ratings, outcomes,
        studentEmail: booking.studentEmail, studentName: booking.studentName,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setSaveError(e?.response?.data?.message ?? 'Failed to save report.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '960px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ padding: '22px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: TEXT }}>Report</div>
            <div style={{ fontSize: '12px', color: SUB, marginTop: '3px' }}>{booking.studentName} · {booking.studentEmail}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUB }}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '16px 28px 0', borderBottom: `2px solid ${BORDER}`, flexShrink: 0 }}>
          {([
            { key: 'profile',       label: '👤 Profile', show: true },
            { key: 'questionnaire', label: '📋 Questionnaire', show: !!(booking.questionnaire && Object.values(booking.questionnaire).some(v => v)) },
            { key: 'psychometric',  label: '🧠 Psychometric Report', show: !!booking.psychometricReport },
            { key: 'feedback',      label: '💬 Counsellor Feedback', show: true },
          ] as const).filter(t => t.show).map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding: '10px 18px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', borderBottom: `2px solid ${activeTab === t.key ? PRIMARY : 'transparent'}`, marginBottom: '-2px', background: activeTab === t.key ? '#F8F9FF' : 'transparent', color: activeTab === t.key ? PRIMARY : SUB, borderRadius: '8px 8px 0 0' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 28px' }}>

          {/* TAB — Profile */}
          {activeTab === 'profile' && <StudentProfileTab booking={booking} />}

          {/* TAB 1 — Questionnaire */}
          {activeTab === 'questionnaire' && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px', padding: '20px 22px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E', marginBottom: '16px' }}>📋 Pre-Session Questionnaire</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {Object.entries(booking.questionnaire ?? {}).filter(([, v]) => v).map(([q, a], i, arr) => (
                  <div key={q} style={{ paddingBottom: i < arr.length - 1 ? '14px' : 0, marginBottom: i < arr.length - 1 ? '14px' : 0, borderBottom: i < arr.length - 1 ? '1px solid #FEF3C7' : 'none' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#B45309', marginBottom: '4px' }}>{q}</div>
                    <div style={{ fontSize: '13px', color: '#1E293B', lineHeight: 1.7 }}>{a}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2 — Psychometric */}
          {activeTab === 'psychometric' && booking.psychometricReport && (
            <PsychometricReportView
              report={{ ...booking.psychometricReport, counsellorComment: undefined }}
            />
          )}

          {/* TAB 3 — Counsellor Feedback */}
          {activeTab === 'feedback' && (
            <div>
              {(<div style={{ pointerEvents: alreadySaved ? 'none' : 'auto', opacity: alreadySaved ? 0.85 : 1 }}>

              {/* Block 1: Star Ratings */}
              <div style={{ background: '#FAFBFF', border: `1px solid #E8ECF8`, borderRadius: '14px', padding: '20px 22px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>⭐</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>Session Quality Ratings</div>
                    <div style={{ fontSize: '11px', color: SUB }}>Rate the student on each dimension (1 = Poor, 5 = Excellent)</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {([
                    { key: 'sessionQuality',  label: 'Overall Session Quality' },
                    { key: 'engagement',      label: 'Student Engagement & Participation' },
                    { key: 'goalClarity',     label: "Clarity of Student's Career Goals" },
                    { key: 'receptiveness',   label: 'Receptiveness to Guidance' },
                  ] as const).map(({ key, label }) => (
                    <div key={key} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '12px', color: SUB, fontWeight: 500, marginBottom: '10px' }}>{label}</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1,2,3,4,5].map(n => (
                          <span key={n} onClick={() => setRatings(r => ({ ...r, [key]: n }))}
                            style={{ fontSize: '22px', cursor: 'pointer', color: n <= ratings[key] ? '#FCD34D' : '#E2E8F0' }}>★</span>
                        ))}
                      </div>
                      <div style={{ fontSize: '11px', color: SUB, marginTop: '5px' }}>
                        {ratings[key] > 0 ? `${ratings[key]} / 5 — ${STAR_LABELS[ratings[key]]}` : 'Not rated'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Block 2: Outcomes */}
              <div style={{ background: '#FAFBFF', border: `1px solid #E8ECF8`, borderRadius: '14px', padding: '20px 22px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>✅</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>Session Outcomes</div>
                    <div style={{ fontSize: '11px', color: SUB }}>How well did this session achieve each goal?</div>
                  </div>
                </div>
                {([
                  { key: 'understoodProfile', q: 'Student understood their psychometric profile and what it means for their career' },
                  { key: 'actionPlan',        q: 'A clear, actionable career plan was established by end of session' },
                  { key: 'resources',         q: 'Student was referred to additional learning resources or support' },
                  { key: 'nextSteps',         q: 'Student left with clear next steps and knew what to do after the session' },
                ] as const).map(({ key, q }) => (
                  <div key={key} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500, marginBottom: '10px' }}>{q}</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                      {LIKERT_OPTS.map(opt => (
                        <button key={opt} onClick={() => setOutcomes(o => ({ ...o, [key]: opt }))}
                          style={{ padding: '5px 12px', borderRadius: '8px', border: `1.5px solid ${outcomes[key] === opt ? PRIMARY : BORDER}`, background: outcomes[key] === opt ? '#EEF2FF' : '#fff', color: outcomes[key] === opt ? PRIMARY : SUB, fontSize: '12px', fontWeight: outcomes[key] === opt ? 700 : 500, cursor: 'pointer' }}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Block 3: Written Notes */}
              <div style={{ background: '#FAFBFF', border: `1px solid #E8ECF8`, borderRadius: '14px', padding: '20px 22px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📝</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>Written Notes</div>
                    <div style={{ fontSize: '11px', color: SUB }}>Visible to student on their report page</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Key Observations & Takeaways <span style={{ color: '#DC2626' }}>*</span></div>
                    <textarea value={keyObs} onChange={e => setKeyObs(e.target.value)} placeholder="What did you observe about the student? Key insights..."
                      style={{ width: '100%', border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '11px 14px', fontSize: '13px', color: TEXT, resize: 'vertical', outline: 'none', fontFamily: 'inherit', minHeight: '80px' }} />
                  </div>
                  {/* Action Items — checklist */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Action Items — <span style={{ color: PRIMARY, fontWeight: 500 }}>tickable checklist</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                      {actionItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 10px' }}>
                          <span style={{ fontSize: '15px' }}>☐</span>
                          <span style={{ flex: 1, fontSize: '13px', color: TEXT }}>{item.text}</span>
                          <button onClick={() => setActionItems(a => a.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '16px', lineHeight: 1 }}>×</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input value={newActionItem} onChange={e => setNewActionItem(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && newActionItem.trim()) { setActionItems(a => [...a, { text: newActionItem.trim() }]); setNewActionItem(''); } }}
                        placeholder="Type an action item and press Enter..."
                        style={{ flex: 1, border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                      <button onClick={() => { if (newActionItem.trim()) { setActionItems(a => [...a, { text: newActionItem.trim() }]); setNewActionItem(''); } }}
                        style={{ padding: '8px 14px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
                    </div>
                  </div>

                  {/* Resources — hyperlinks */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Resources — <span style={{ color: PRIMARY, fontWeight: 500 }}>tappable links</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                      {resourcesList.map((res, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '8px 10px' }}>
                          <ExternalLink size={13} color={PRIMARY} style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.title}</div>
                            <div style={{ fontSize: '11px', color: SUB, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.url}</div>
                          </div>
                          <button onClick={() => setResourcesList(r => r.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: '16px', lineHeight: 1 }}>×</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input value={newResTitle} onChange={e => setNewResTitle(e.target.value)} placeholder="Link title (e.g. Coursera ML Specialisation)"
                        style={{ border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input value={newResUrl} onChange={e => setNewResUrl(e.target.value)} placeholder="https://..."
                          style={{ flex: 1, border: `1.5px solid ${BORDER}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} />
                        <button onClick={() => { if (newResTitle.trim() && newResUrl.trim()) { setResourcesList(r => [...r, { title: newResTitle.trim(), url: newResUrl.trim() }]); setNewResTitle(''); setNewResUrl(''); } }}
                          style={{ padding: '8px 14px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {saveError && (
                <div style={{ marginBottom: '10px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '13px' }}>{saveError}</div>
              )}
              {!alreadySaved && (
                <button onClick={handleSave} disabled={saving || !keyObs}
                  style={{ width: '100%', padding: '14px', background: saving ? '#A5B4FC' : PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving...' : '💾  Save Feedback'}
                </button>
              )}
            </div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_COLOR: Record<SessionStatus, { bg: string; text: string }> = {
  AVAILABLE:  { bg: '#DCFCE7', text: '#15803D' },
  UPCOMING:   { bg: '#EEF2FF', text: '#4F46E5' },
  COMPLETED:  { bg: '#F1F5F9', text: '#475569' },
  CANCELLED:  { bg: '#FEF2F2', text: '#DC2626' },
};

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21];
const DAY_CHIPS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Parse start hour from slot string like "20:00-21:30" or "09:00"
function slotStartHour(t: string): number {
  const start = t.split('-')[0].trim();
  return parseInt(start.split(':')[0], 10);
}

function fmtHour(h: number) {
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return '12:00 PM';
  return `${h - 12}:00 PM`;
}

// ── Add Availability Modal ────────────────────────────────────────────────────
interface Slot { from: string; to: string }

function AddAvailabilityModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [recurWeeks, setRecurWeeks] = useState('1');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [slotFrom, setSlotFrom] = useState('');
  const [slotTo, setSlotTo] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [fee, setFee] = useState('');
  const [feeType, setFeeType] = useState('Per Session');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const toggleDay = (d: string) => setSelectedDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  const addSlot = () => { if (slotFrom && slotTo) { setSlots(p => [...p, { from: slotFrom, to: slotTo }]); setSlotFrom(''); setSlotTo(''); } };
  const removeSlot = (i: number) => setSlots(p => p.filter((_, idx) => idx !== i));

  const inSt: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#1E293B', outline: 'none', background: '#fff' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>Add Availability</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inSt} />
            <label style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>Date From *</label>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inSt} />
            <label style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>Date To *</label>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <input type="number" min="1" value={recurWeeks} onChange={e => setRecurWeeks(e.target.value)} style={inSt} />
          <label style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>Recurring Weeks *</label>
        </div>

        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 8px' }}>Select Days *</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {DAY_CHIPS.map(d => (
            <button key={d} onClick={() => toggleDay(d)}
              style={{ padding: '5px 14px', borderRadius: '20px', border: `1.5px solid ${selectedDays.includes(d) ? '#4F46E5' : '#E2E8F0'}`, background: selectedDays.includes(d) ? '#EEF2FF' : '#fff', color: selectedDays.includes(d) ? '#4F46E5' : '#64748B', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>
              {d}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 8px' }}>Time Slots</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
          <input type="time" value={slotFrom} onChange={e => setSlotFrom(e.target.value)} style={{ ...inSt, flex: 1 }} />
          <span style={{ color: '#94A3B8', fontSize: '13px' }}>–</span>
          <input type="time" value={slotTo} onChange={e => setSlotTo(e.target.value)} style={{ ...inSt, flex: 1 }} />
          <button onClick={addSlot} style={{ padding: '10px 14px', background: '#4338CA', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>
            + Add
          </button>
        </div>
        {slots.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {slots.map((s, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#EEF2FF', color: '#4F46E5', borderRadius: '16px', padding: '4px 10px', fontSize: '12px', fontWeight: 500 }}>
                {s.from}–{s.to}
                <button onClick={() => removeSlot(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#4F46E5', display: 'flex', alignItems: 'center' }}><X size={11} /></button>
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input type="number" value={fee} onChange={e => setFee(e.target.value)} style={inSt} placeholder="500" />
            <label style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>Fees Amount (₹) *</label>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <select value={feeType} onChange={e => setFeeType(e.target.value)} style={{ ...inSt, appearance: 'none' as const }}>
              <option>Per Session</option>
              <option>Per Hour</option>
            </select>
            <label style={{ position: 'absolute', top: '-9px', left: '10px', background: '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>Fees Type *</label>
          </div>
        </div>

        {modalError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#DC2626' }}>
            {modalError}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={async () => {
            if (!dateFrom || !dateTo) { setModalError('Please select date range.'); return; }
            if (selectedDays.length === 0) { setModalError('Please select at least one day.'); return; }
            if (slots.length === 0) { setModalError('Please add at least one time slot.'); return; }
            setModalError('');
            setSaving(true);
            try {
              await api.post('/counsellor/sessions/availability', {
                dateFrom, dateTo,
                recurWeeks: Number(recurWeeks) || 1,
                days: selectedDays,
                timeSlots: slots.map(s => `${s.from}-${s.to}`),
                feeAmount: fee ? Number(fee) : null,
                feeType,
                status: 'AVAILABLE',
              });
              onSaved();
              onClose();
            } catch (e: any) {
              setModalError(e?.response?.data?.message ?? 'Failed to save. Please try again.');
            } finally { setSaving(false); }
          }} disabled={saving}
            style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: '#4338CA', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Availability Modal ───────────────────────────────────────────────────
function EditAvailabilityModal({
  session, bookings, onClose, onSaved,
}: {
  session: AvailSession;
  bookings: StudentBooking[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<'AVAILABLE' | 'CANCELLED'>(
    session.status === 'CANCELLED' ? 'CANCELLED' : 'AVAILABLE'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Check if any active booking falls within this session's schedule
  const bookedSlots = bookings.filter(b => {
    if (b.status === 'CANCELLED') return false;
    const bDate = new Date(b.sessionDate);
    const fromDate = new Date(session.dateFrom);
    const toDate = new Date(session.dateTo);
    if (bDate < fromDate || bDate > toDate) return false;
    const dayShort = bDate.toLocaleDateString('en-US', { weekday: 'short' });
    if (!session.days.map(d => d.toLowerCase()).includes(dayShort.toLowerCase())) return false;
    return session.timeSlots.includes(b.sessionTime);
  });

  const hasBookings = bookedSlots.length > 0;

  const inSt: React.CSSProperties = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #CBD5E1', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#1E293B', outline: 'none', background: '#fff' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '460px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>Edit Availability</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={18} /></button>
        </div>

        {/* Session summary */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', marginBottom: '20px', fontSize: '13px', color: '#1E293B' }}>
          <div style={{ marginBottom: '6px' }}><strong>Date:</strong> {session.dateFrom} → {session.dateTo}</div>
          <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
            <strong>Days:</strong>
            {session.days.map(d => (
              <span key={d} style={{ background: '#EEF2FF', color: '#4F46E5', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{d}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
            <strong>Slots:</strong>
            {session.timeSlots.map(t => (
              <span key={t} style={{ background: '#F1F5F9', color: '#475569', borderRadius: '10px', padding: '2px 8px', fontSize: '11px' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Booked slots warning */}
        {hasBookings && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: '#92400E' }}>
            <strong>⚠ Cannot mark as Unavailable</strong> — {bookedSlots.length} booking(s) already confirmed for this availability:
            <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
              {bookedSlots.map(b => (
                <li key={b.id}>{b.studentName} — {b.sessionDate} {b.sessionTime}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <select value={status} onChange={e => setStatus(e.target.value as 'AVAILABLE' | 'CANCELLED')}
            disabled={hasBookings && status === 'AVAILABLE'}
            style={{ ...inSt, appearance: 'none' as const, cursor: hasBookings ? 'not-allowed' : 'default', background: hasBookings ? '#F8FAFC' : '#fff' }}>
            <option value="AVAILABLE">Available</option>
            <option value="CANCELLED" disabled={hasBookings}>Unavailable</option>
          </select>
          <label style={{ position: 'absolute', top: '-9px', left: '10px', background: hasBookings ? '#F8FAFC' : '#fff', padding: '0 4px', fontSize: '11px', color: '#64748B' }}>Status</label>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#DC2626' }}>{error}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '10px 24px', border: '1px solid #CBD5E1', borderRadius: '24px', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={async () => {
            if (status === 'CANCELLED' && hasBookings) {
              setError('Cannot mark unavailable — active bookings exist for this slot.');
              return;
            }
            setSaving(true); setError('');
            try {
              await api.put(`/counsellor/sessions/${session.id}/status`, { status });
              onSaved(); onClose();
            } catch (e: any) {
              setError(e?.response?.data?.message ?? 'Failed to update. Please try again.');
            } finally { setSaving(false); }
          }} disabled={saving}
            style={{ padding: '10px 28px', border: 'none', borderRadius: '24px', background: '#4338CA', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BookedSessionPage() {
  const [view, setView] = useState<'calendar' | 'list' | 'bookings'>('bookings');
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<AvailSession | null>(null);
  const [viewingReport, setViewingReport] = useState<StudentBooking | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [sessions, setSessions] = useState<AvailSession[]>([]);
  const [bookings, setBookings] = useState<StudentBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const loadSessions = useCallback(() => {
    api.get('/counsellor/sessions')
      .then(r => {
        const raw = r.data?.data?.content ?? r.data?.data ?? [];
        setSessions(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setSessions([]));
  }, []);

  const loadBookings = useCallback(() => {
    setLoadingBookings(true);
    api.get('/counsellor/bookings')
      .then(r => setBookings(r.data?.data ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false));
  }, []);

  const reload = useCallback(() => { loadSessions(); loadBookings(); }, [loadSessions, loadBookings]);
  useEffect(() => { reload(); }, [reload]);

  const handleMarkComplete = async (id: number) => {
    setCompletingId(id);
    try { await api.put(`/counsellor/bookings/${id}/complete`); loadBookings(); }
    catch { /* ignore */ } finally { setCompletingId(null); }
  };

  // ── Calendar event expansion ─────────────────────────────────────────────
  const calendarEvents = (() => {
    const events: { date: string; time: string; label: string; booked: boolean; studentName?: string }[] = [];

    for (const s of sessions) {
      if (s.status === 'CANCELLED') continue;
      if (!s.dateFrom || !s.dateTo || !s.days?.length || !s.timeSlots?.length) continue;
      const from = new Date(s.dateFrom);
      const to   = new Date(s.dateTo);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
        if (!s.days.map(x => x.toLowerCase()).includes(dayShort.toLowerCase())) continue;
        const dateStr = d.toISOString().split('T')[0];
        for (const t of s.timeSlots) {
          const booking = bookings.find(b =>
            b.sessionDate === dateStr && b.sessionTime === t && b.status !== 'CANCELLED'
          );
          events.push({
            date: dateStr,
            time: t,
            label: booking ? booking.studentName : 'Available',
            booked: !!booking,
            studentName: booking?.studentName,
          });
        }
      }
    }
    return events;
  })();

  // ── Week navigation ──────────────────────────────────────────────────────
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7); // Monday-first
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const weekLabel = `${startOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${endOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
          {([
            { key: 'bookings', icon: <Star size={14} />, label: 'Student Bookings', badge: bookings.filter(b => b.status !== 'CANCELLED').length },
            { key: 'calendar', icon: <Calendar size={14} />, label: 'Calendar', badge: 0 },
            { key: 'list',     icon: <List size={14} />, label: 'Availability', badge: 0 },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setView(tab.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, background: view === tab.key ? '#fff' : 'transparent', color: view === tab.key ? '#1E293B' : '#64748B', boxShadow: view === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', whiteSpace: 'nowrap' }}>
              {tab.icon} {tab.label}
              {tab.badge > 0 && <span style={{ background: '#4F46E5', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '11px', marginLeft: '2px' }}>{tab.badge}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#4338CA', border: 'none', borderRadius: '24px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Add Availability
        </button>
      </div>

      {/* ── Student Bookings tab ── */}
      {view === 'bookings' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {loadingBookings ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>Loading bookings…</div>
          ) : bookings.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No student bookings yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Student', 'Email', 'Date', 'Time', 'Fee', 'Meet Link', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748B', fontWeight: 500, fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1E293B' }}>{b.studentName}</td>
                    <td style={{ padding: '12px 14px', color: '#64748B' }}>{b.studentEmail}</td>
                    <td style={{ padding: '12px 14px', color: '#64748B' }}>{b.sessionDate}</td>
                    <td style={{ padding: '12px 14px', color: '#64748B' }}>{b.sessionTime}</td>
                    <td style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600 }}>{b.feeAmount ? `₹${b.feeAmount.toLocaleString()}` : 'Free'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {b.meetLink
                        ? <a href={b.meetLink} target="_blank" rel="noopener noreferrer" style={{ color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '12px' }}>Join <ExternalLink size={11} /></a>
                        : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: b.status === 'CONFIRMED' ? '#DCFCE7' : b.status === 'COMPLETED' ? '#EEF2FF' : '#FEF2F2', color: b.status === 'CONFIRMED' ? '#16A34A' : b.status === 'COMPLETED' ? '#4F46E5' : '#DC2626' }}>{b.status}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {b.status === 'CONFIRMED' && (() => {
                          const hasReport = !!(b.psychometricReport?.counsellorComment || b.psychometricReport?.feedbackKeyObservations
                            || b.psychometricReport?.feedbackActionItems || b.psychometricReport?.feedbackResourcesRecommended);
                          return (
                            <button onClick={() => handleMarkComplete(b.id)} disabled={completingId === b.id || !hasReport}
                              title={!hasReport ? 'Submit the session report first' : undefined}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: hasReport ? '#DCFCE7' : '#F1F5F9', border: 'none', borderRadius: '6px', color: hasReport ? '#16A34A' : '#94A3B8', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: (completingId === b.id || !hasReport) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: completingId === b.id ? 0.6 : 1 }}>
                              {completingId === b.id ? 'Marking…' : 'Mark Complete'}
                            </button>
                          );
                        })()}
                        {b.status !== 'CANCELLED' && (
                          <button onClick={() => setViewingReport(b)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#EEF2FF', border: 'none', borderRadius: '6px', color: '#3F41D1', padding: '5px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <FileText size={11} /> Report
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Calendar tab ── */}
      {view === 'calendar' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
            <button onClick={() => setWeekOffset(w => w - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><ChevronLeft size={18} /></button>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{weekLabel}</span>
            <button onClick={() => setWeekOffset(w => w + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><ChevronRight size={18} /></button>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'auto' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 2, background: '#F8FAFC' }}>
              <div style={{ padding: '12px' }} />
              {WEEK_DAYS.map((d, i) => {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div key={d} style={{ padding: '10px 8px', textAlign: 'center', borderLeft: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{d}</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: isToday ? '#4F46E5' : '#1E293B', width: '28px', height: '28px', borderRadius: '50%', background: isToday ? '#EEF2FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px auto 0' }}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hour rows */}
            {HOURS.map(hour => (
              <div key={hour} style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', borderBottom: '1px solid #F1F5F9', minHeight: '56px' }}>
                <div style={{ padding: '8px 10px', fontSize: '11px', color: '#94A3B8', textAlign: 'right', paddingTop: '10px', whiteSpace: 'nowrap' }}>
                  {fmtHour(hour)}
                </div>
                {WEEK_DAYS.map((_, dayIdx) => {
                  const cellDate = new Date(startOfWeek);
                  cellDate.setDate(startOfWeek.getDate() + dayIdx);
                  const dateStr = cellDate.toISOString().split('T')[0];
                  const cellEvents = calendarEvents.filter(e => e.date === dateStr && slotStartHour(e.time) === hour);
                  return (
                    <div key={dayIdx} style={{ borderLeft: '1px solid #F1F5F9', padding: '4px', minHeight: '56px' }}>
                      {cellEvents.map((e, i) => (
                        <div key={i} title={e.booked ? `Booked by ${e.studentName}` : 'Available slot'}
                          style={{ background: e.booked ? '#EEF2FF' : '#DCFCE7', borderLeft: `3px solid ${e.booked ? '#4F46E5' : '#16A34A'}`, borderRadius: '4px', padding: '4px 6px', fontSize: '11px', marginBottom: '2px', cursor: 'default' }}>
                          <div style={{ fontWeight: 700, color: e.booked ? '#3730A3' : '#166534', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.booked ? e.studentName : 'Available'}
                          </div>
                          <div style={{ fontSize: '10px', color: e.booked ? '#4F46E5' : '#16A34A', marginTop: '1px' }}>
                            {e.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '12px', color: '#64748B' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#DCFCE7', borderLeft: '3px solid #16A34A', display: 'inline-block' }} /> Available slot
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#EEF2FF', borderLeft: '3px solid #4F46E5', display: 'inline-block' }} /> Booked by student
            </span>
          </div>
        </>
      )}

      {/* ── Availability list tab ── */}
      {view === 'list' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {sessions.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No availability added yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Date Range', 'Days', 'Time Slots', 'Fee', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748B', fontWeight: 500, fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => {
                  const activeBookings = bookings.filter(b => {
                    if (b.status === 'CANCELLED') return false;
                    const bDate = new Date(b.sessionDate);
                    const from = new Date(s.dateFrom);
                    const to = new Date(s.dateTo);
                    if (bDate < from || bDate > to) return false;
                    const day = bDate.toLocaleDateString('en-US', { weekday: 'short' });
                    return s.days.map(d => d.toLowerCase()).includes(day.toLowerCase()) && s.timeSlots.includes(b.sessionTime);
                  });
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.dateFrom} → {s.dateTo}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(s.days ?? []).map(d => (
                            <span key={d} style={{ background: '#EEF2FF', color: '#4F46E5', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{d}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(s.timeSlots ?? []).map(t => (
                            <span key={t} style={{ background: '#F1F5F9', color: '#475569', borderRadius: '10px', padding: '2px 8px', fontSize: '11px' }}>{t}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {s.feeAmount ? `₹${s.feeAmount.toLocaleString()} ${s.feeType ?? ''}` : 'Free'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: STATUS_COLOR[s.status]?.bg ?? '#F1F5F9', color: STATUS_COLOR[s.status]?.text ?? '#475569', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                          {s.status === 'CANCELLED' ? 'UNAVAILABLE' : s.status}
                        </span>
                        {activeBookings.length > 0 && (
                          <span style={{ marginLeft: '6px', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 600 }}>
                            {activeBookings.length} booked
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button onClick={() => setEditingSession(s)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#EEF2FF', border: 'none', borderRadius: '6px', color: '#4F46E5', padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <Pencil size={12} /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && <AddAvailabilityModal onClose={() => setShowModal(false)} onSaved={reload} />}
      {viewingReport && <ReportModal booking={viewingReport} onClose={() => setViewingReport(null)} onSaved={loadBookings} />}
      {editingSession && (
        <EditAvailabilityModal
          session={editingSession}
          bookings={bookings}
          onClose={() => setEditingSession(null)}
          onSaved={() => { setEditingSession(null); reload(); }}
        />
      )}
    </div>
  );
}
