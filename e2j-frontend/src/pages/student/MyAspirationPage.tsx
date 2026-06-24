import { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, ChevronLeft, Check, Rocket, TrendingUp, Zap, Loader2, Trash2, ArrowLeft, Plus, Briefcase, Clock, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const PRIMARY = '#3F41D1';
const BORDER  = '#E2E8F0';
const TEXT    = '#212121';
const SUB     = '#666666';
const BG      = '#F8F9FA';

type View = 'list' | 'wizard' | 'detail';
type FlowStep = 'goal' | 'profile' | 'roles';
// Explore-specific sub-steps
type ExploreStep = 'payment' | 'test' | 'report' | 'consult';

const CATEGORY_NAMES: Record<string, string> = {
  R: 'Realistic', I: 'Investigative', A: 'Artistic',
  S: 'Social',    E: 'Enterprising',  C: 'Conventional',
};
const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  R: { bg: '#EFF6FF', text: '#1D4ED8', bar: '#3B82F6' },
  I: { bg: '#EEF2FF', text: '#3730A3', bar: '#3F41D1' },
  A: { bg: '#FDF4FF', text: '#7E22CE', bar: '#A855F7' },
  S: { bg: '#F0FDF4', text: '#15803D', bar: '#22C55E' },
  E: { bg: '#FFF7ED', text: '#C2410C', bar: '#F97316' },
  C: { bg: '#F8FAFC', text: '#475569', bar: '#94A3B8' },
};

interface Aspiration { id: number; goal: string; roleArea: string; skills: string[]; createdAt: string; }
interface SkillGapReport { id: number; targetRole: string; curriculum: string; generatedAt: string; }

const ROLE_AREAS = [
  'Frontend Developer', 'Backend Developer', 'Fullstack Developer', 'Data Analyst',
  'AI/ML Engineer', 'Software Tester/QA Engineer', 'Cybersecurity Analyst', 'Cloud Engineer',
  'UI/UX Designer', 'Mobile App Developer', 'Game Developer', 'Blockchain Developer',
  'Embedded Systems Engineer', 'Database Administrator', 'Business Analyst',
  'Technical Support Engineer', 'Automation Engineer', 'IT Systems Administrator',
  'Cloud Support Associate', 'Software Engineer', 'Data Scientist', 'DevOps Engineer',
];

const STEP_LABELS         = ['Your Goal', 'Your Profile', 'Role'];
const EXPLORE_STEP_LABELS = ['Your Goal', 'Payment', 'Psychometric Test', 'Your Report'];
const GOAL_OPTIONS = [
  { id: 'career',  icon: <Rocket size={28} color={PRIMARY} />,     title: 'Plan My Career Path',          desc: 'Get a personalised roadmap to your dream role.' },
  { id: 'skills',  icon: <TrendingUp size={28} color={PRIMARY} />, title: 'Level Up My Skills',            desc: 'Identify and fill skill gaps for your domain.' },
  { id: 'explore', icon: <Search size={28} color={PRIMARY} />,     title: 'Explore & Discover Interests',  desc: 'Find which career paths suit you best.' },
];

function StepIndicator({ current, labels }: { current: number; labels?: string[] }) {
  const steps = labels ?? STEP_LABELS;
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
      {steps.map((label, i) => {
        const n = i + 1; const active = n === current; const done = n < current;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, background: done || active ? PRIMARY : BORDER, color: done || active ? '#fff' : '#94A3B8' }}>
                {done ? <Check size={14} strokeWidth={3} /> : n}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 500, color: active || done ? PRIMARY : '#94A3B8', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: '2px', background: done ? PRIMARY : BORDER, marginBottom: '18px', marginLeft: '4px', marginRight: '4px' }} />}
          </div>
        );
      })}
    </div>
  );
}


const GOAL_LABEL: Record<string, string> = { career: 'Career Path', skills: 'Skill Growth', explore: 'Exploration' };

export default function MyAspirationPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [view, setView]         = useState<View>('list');
  const [loading, setLoading]   = useState(true);
  const [aspirations, setAspirations] = useState<Aspiration[]>([]);
  const [selected, setSelected] = useState<Aspiration | null>(null);

  // detail view state
  const [deleting, setDeleting]         = useState(false);
  const [skillGapReports, setSkillGapReports] = useState<SkillGapReport[]>([]);
  const [reportsLoading, setReportsLoading]   = useState(false);
  const [detailPsychReport, setDetailPsychReport] = useState<any>(null);
  const [detailPsychLoading, setDetailPsychLoading] = useState(false);
  const [analysisRunning, setAnalysisRunning] = useState(false);

  // background task toast + aspiration saved toast
  const [bgToast, setBgToast]           = useState<{ msg: string; targetRole: string } | null>(null);
  const [savedToast, setSavedToast]     = useState<string | null>(null);
  const bgPollRef                        = useRef<ReturnType<typeof setInterval> | null>(null);

  // wizard state
  const [flowStep, setFlowStep]         = useState<FlowStep>('goal');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [roleSearch, setRoleSearch]     = useState('');
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [flowSaving, setFlowSaving]     = useState(false);
  const [profileData, setProfileData]   = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Explore flow state ────────────────────────────────────────────────────
  const [exploreStep, setExploreStep]   = useState<ExploreStep>('payment');
  const [paying, setPaying]             = useState(false);
  const [questions, setQuestions]       = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [currentQ, setCurrentQ]         = useState(0);
  const [answers, setAnswers]           = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft]         = useState(15 * 60); // 15 min in seconds
  const timerRef                        = useRef<ReturnType<typeof setInterval> | null>(null);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [psychReport, setPsychReport]   = useState<any>(null);
  const [savedAspirationId, setSavedAspirationId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/student/aspirations')
      .then(r => setAspirations(r.data?.data ?? []))
      .catch(() => setAspirations([]))
      .finally(() => setLoading(false));
  };

  // Pick up any in-progress skill gap analysis running in the background
  useEffect(() => {
    const TASK_KEY = 'skillgap_running_task';
    const stored = localStorage.getItem(TASK_KEY);
    if (!stored) return;
    let task: { taskId: string; targetRole: string };
    try { task = JSON.parse(stored); } catch { localStorage.removeItem(TASK_KEY); return; }

    bgPollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/student/skill-gap/status/${task.taskId}`);
        const { status, progress: prog } = res.data.data;
        if (['completed', 'COMPLETED', 'finished'].includes(status)) {
          clearInterval(bgPollRef.current!); bgPollRef.current = null;
          localStorage.removeItem(TASK_KEY);
          // Save the result
          try {
            const rRes = await api.get(`/student/skill-gap/result/${task.taskId}`);
            const raw = typeof rRes.data.data === 'string' ? rRes.data.data : JSON.stringify(rRes.data.data);
            let parsed: any = {};
            try { parsed = JSON.parse(raw); } catch {}
            await api.post('/student/skill-gap/save', {
              targetRole: task.targetRole,
              curriculum: parsed.curriculum ?? '',
              resultJson: raw,
            });
          } catch {}
          setBgToast({ msg: `Skill gap analysis for "${task.targetRole}" is complete!`, targetRole: task.targetRole });
          setAnalysisRunning(false);
          load(); // refresh the aspiration list so the new report shows
        } else if (['failed', 'FAILED', 'stopped', 'canceled'].includes(status)) {
          clearInterval(bgPollRef.current!); bgPollRef.current = null;
          localStorage.removeItem(TASK_KEY);
          setBgToast({ msg: `Skill gap analysis for "${task.targetRole}" failed. Please try again.`, targetRole: '' });
        }
        // Show subtle progress hint
        if (prog != null) console.debug(`[bg] skill-gap ${task.targetRole}: ${prog}%`);
      } catch {}
    }, 5000);

    return () => { if (bgPollRef.current) clearInterval(bgPollRef.current); };
  }, []);
  useEffect(() => { load(); }, []);

  const openDetail = (asp: Aspiration) => {
    setSelected(asp); setSkillGapReports([]); setDetailPsychReport(null); setView('detail');
    // Check if a skill gap analysis is still running for this aspiration
    try {
      const stored = localStorage.getItem('skillgap_running_task');
      if (stored) {
        const task = JSON.parse(stored);
        setAnalysisRunning(task.targetRole === asp.roleArea);
      } else { setAnalysisRunning(false); }
    } catch { setAnalysisRunning(false); }
    if (asp.goal === 'explore') {
      setDetailPsychLoading(true);
      api.get('/student/psychometric/reports')
        .then(r => {
          const reports: any[] = r.data?.data ?? [];
          // Pick the latest report (first in list — already sorted desc)
          setDetailPsychReport(reports[0] ?? null);
        })
        .catch(() => setDetailPsychReport(null))
        .finally(() => setDetailPsychLoading(false));
    } else {
      setReportsLoading(true);
      api.get('/student/skill-gap/reports')
        .then(r => {
          const all: SkillGapReport[] = r.data?.data ?? [];
          setSkillGapReports(all.filter(rp => rp.targetRole === asp.roleArea));
        })
        .catch(() => setSkillGapReports([]))
        .finally(() => setReportsLoading(false));
    }
  };

  const deleteAspiration = async (asp: Aspiration) => {
    setDeleting(true);
    try {
      await api.delete(`/student/aspirations/${asp.id}`);
      load(); setView('list'); setSelected(null);
    } catch { }
    finally { setDeleting(false); }
  };

  // wizard helpers
  const resetWizard = () => {
    setFlowStep('goal'); setSelectedGoal(''); setSelectedRole('');
    setRoleSearch(''); setShowAllRoles(false); setProfileData(null);
  };

  const goToProfile = () => {
    setFlowStep('profile');
    if (!profileData) {
      setProfileLoading(true);
      api.get('/student/profile/full')
        .then(r => setProfileData(r.data?.data ?? r.data ?? null))
        .catch(() => setProfileData({}))
        .finally(() => setProfileLoading(false));
    }
  };

  const saveAspiration = async () => {
    setFlowSaving(true);
    try {
      await api.post('/student/aspiration', { goal: selectedGoal, roleArea: selectedRole, skills: [] });
      finishWizard();
      setSavedToast(`Aspiration "${selectedRole}" saved successfully!`);
      setTimeout(() => setSavedToast(null), 4000);
    } catch { }
    finally { setFlowSaving(false); }
  };

  const saveAndAnalyse = async () => {
    setFlowSaving(true);
    try {
      await api.post('/student/aspiration', { goal: selectedGoal, roleArea: selectedRole, skills: [] });
      load();
      navigate('/student/skill-gap/report', { state: { targetRole: selectedRole } });
    } catch { }
    finally { setFlowSaving(false); }
  };

  const finishWizard = () => {
    resetWizard(); load(); setView('list');
  };

  const resetExplore = () => {
    setExploreStep('payment'); setQuestions([]); setCurrentQ(0);
    setAnswers({}); setTimeLeft(15 * 60); setPsychReport(null);
    setSavedAspirationId(null); setPaying(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleExplorePay = async () => {
    setPaying(true);
    setQuestionsLoading(true);
    try {
      const res = await api.get('/student/psychometric/questions');
      const qs = res.data?.data ?? [];
      setQuestions(qs);
      setExploreStep('test');
      // Start timer only after questions are ready
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(15 * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current!); timerRef.current = null; return 0; }
          return t - 1;
        });
      }, 1000);
    } catch {
      setQuestions([]);
      setExploreStep('test');
    } finally {
      setQuestionsLoading(false);
      setPaying(false);
    }
  };

  const handleSubmitTest = async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setSubmittingTest(true);
    try {
      // Save aspiration first
      let aspirationId: number | null = null;
      try {
        const aspRes = await api.post('/student/aspiration', { goal: 'explore', roleArea: 'Exploring Interests', skills: [] });
        aspirationId = aspRes.data?.data?.id ?? null;
        setSavedAspirationId(aspirationId);
      } catch { /* non-fatal */ }

      const payload: Record<string, number> = {};
      questions.forEach(q => { if (answers[q.id] != null) payload[q.id] = answers[q.id]; });
      const res = await api.post('/student/psychometric/submit', { answers: payload, aspirationId });
      setPsychReport(res.data?.data ?? null);
      setExploreStep('report');
      load();
    } catch { /* stay on test */ }
    finally { setSubmittingTest(false); }
  };

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const visibleRoles = (showAllRoles ? ROLE_AREAS : ROLE_AREAS.slice(0, 12))
    .filter(r => r.toLowerCase().includes(roleSearch.toLowerCase()));
  const stepNum: Record<FlowStep, number> = { goal: 1, profile: 2, roles: 3 };

  /* ─── LOADING ─── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '10px', color: SUB }}>
      <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ─── WIZARD ─── */
  if (view === 'wizard') return (
    <div style={{ padding: '24px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <button onClick={() => { resetWizard(); setView('list'); }}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: SUB, fontSize: '13px', cursor: 'pointer', marginBottom: '20px', padding: 0 }}>
        <ArrowLeft size={14} /> Back to My Aspirations
      </button>

      {/* Step indicator always centred in 680px band */}
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {(flowStep as string) === 'explore'
          ? <StepIndicator current={{ payment: 2, test: 3, report: 4, consult: 4 }[exploreStep] ?? 2} labels={EXPLORE_STEP_LABELS} />
          : <StepIndicator current={stepNum[flowStep]} />
        }
      </div>

      {/* Content — full width for report, constrained for everything else */}
      <div style={(flowStep as string) === 'explore' && exploreStep === 'report' ? {} : { maxWidth: '680px', margin: '0 auto' }}>

        {/* Step 1 — Goal */}
        {flowStep === 'goal' && (
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: TEXT, textAlign: 'center', margin: '0 0 6px' }}>What's Your Goal?</h2>
            <p style={{ fontSize: '13px', color: SUB, textAlign: 'center', margin: '0 0 28px' }}>Select the option that best describes what you want to achieve.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {GOAL_OPTIONS.map(g => (
                <button key={g.id} onClick={() => setSelectedGoal(g.id)}
                  style={{ width: '196px', minHeight: '176px', padding: '24px 16px', borderRadius: '16px', border: `2px solid ${selectedGoal === g.id ? PRIMARY : BORDER}`, background: selectedGoal === g.id ? '#EEEEFF' : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
                  {g.icon}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: TEXT }}>{g.title}</span>
                  <span style={{ fontSize: '12px', color: SUB, lineHeight: 1.4 }}>{g.desc}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '32px' }}>
              <button onClick={() => { resetWizard(); setView('list'); }} style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', color: SUB, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button disabled={!selectedGoal} onClick={() => selectedGoal === 'explore' ? setFlowStep('explore' as any) : goToProfile()}
                style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: selectedGoal ? PRIMARY : BORDER, color: selectedGoal ? '#fff' : '#94A3B8', fontSize: '13px', fontWeight: 600, cursor: selectedGoal ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Profile Review */}
        {flowStep === 'profile' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Your Profile</h2>
            <p style={{ fontSize: '13px', color: SUB, margin: '0 0 20px' }}>We'll use this profile to personalise your aspiration. Confirm or update it before continuing.</p>

            {profileLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '40px 0', color: SUB, fontSize: '13px' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading profile…
              </div>
            ) : (
              <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
                {/* Avatar + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, flexShrink: 0 }}>
                    {(profileData?.name ?? user?.name ?? 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: TEXT }}>{profileData?.name ?? user?.name ?? '—'}</div>
                    <div style={{ fontSize: '13px', color: SUB, marginTop: '2px' }}>{profileData?.email ?? user?.email ?? '—'}</div>
                  </div>
                </div>

                {/* Resume — shown first as it's what skill gap uses */}
                {(() => {
                  const resumes: any[] = profileData?.resumes ?? [];
                  if (!resumes.length) return (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#991B1B', marginBottom: '2px' }}>No resume uploaded</div>
                        <div style={{ fontSize: '12px', color: '#B91C1C' }}>Upload a resume on your profile page — it will be used for skill gap analysis.</div>
                      </div>
                      <button onClick={() => navigate('/student/profile')} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #DC2626', background: '#fff', color: '#DC2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Upload</button>
                    </div>
                  );
                  const primary = resumes.find((r: any) => r.isPrimary) ?? resumes[0];
                  return (
                    <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', color: '#15803D', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '8px' }}>Resume for Skill Gap Analysis</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>PDF</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#14532D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{primary.fileName}</div>
                          <div style={{ fontSize: '12px', color: '#15803D', marginTop: '2px' }}>
                            {primary.isPrimary ? 'Primary resume · ' : ''}{primary.uploadedAt ? new Date(primary.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </div>
                        </div>
                        {resumes.length > 1 && (
                          <span style={{ fontSize: '11px', color: '#15803D', background: '#DCFCE7', borderRadius: '100px', padding: '3px 10px', flexShrink: 0 }}>+{resumes.length - 1} more</span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Personal Info */}
                {(() => {
                  const fields = [
                    { label: 'Phone', value: profileData?.mobilePrimary },
                    { label: 'Date of Birth', value: profileData?.dob },
                    { label: 'Gender', value: profileData?.gender },
                    { label: 'Nationality', value: profileData?.nationality },
                    { label: 'City', value: profileData?.presentAddress?.city },
                    { label: 'State', value: profileData?.presentAddress?.state },
                    { label: 'Experience', value: profileData?.experienceCategory },
                    { label: 'Exp. Years', value: profileData?.totalExpYears != null ? `${profileData.totalExpYears}y ${profileData.totalExpMonths ?? 0}m` : null },
                    { label: 'LinkedIn', value: profileData?.linkedinUrl },
                    { label: 'Portfolio', value: profileData?.portfolioUrl },
                  ].filter(f => f.value);
                  if (!fields.length) return null;
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      {fields.map(f => (
                        <div key={f.label} style={{ background: BG, borderRadius: '8px', padding: '10px 14px' }}>
                          <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '3px' }}>{f.label}</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Education */}
                {profileData?.educations?.length > 0 && (
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '8px' }}>Education</div>
                    {profileData.educations.map((e: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', padding: '10px 12px', background: BG, borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{e.degree}</div>
                          <div style={{ fontSize: '12px', color: SUB }}>{e.schoolUniversity} {e.majorSpecialization ? `· ${e.majorSpecialization}` : ''}</div>
                        </div>
                        <div style={{ fontSize: '12px', color: SUB, textAlign: 'right' as const, flexShrink: 0 }}>
                          {e.yearOfPassing && <div>{e.yearOfPassing}</div>}
                          {e.percentageCgpa && <div>{e.percentageCgpa}%</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Work Experience */}
                {profileData?.workExperiences?.length > 0 && (
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '8px' }}>Work Experience</div>
                    {profileData.workExperiences.map((w: any, i: number) => (
                      <div key={i} style={{ padding: '10px 12px', background: BG, borderRadius: '8px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{w.companyName}</div>
                        <div style={{ fontSize: '12px', color: SUB }}>{w.employmentType} {w.location ? `· ${w.location}` : ''} · {w.fromDate} – {w.toDate ?? 'Present'}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Certifications */}
                {profileData?.certifications?.length > 0 && (
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '8px' }}>Certifications</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {profileData.certifications.map((c: any, i: number) => (
                        <span key={i} style={{ padding: '4px 12px', borderRadius: '100px', background: '#EEF2FF', color: PRIMARY, fontSize: '12px', fontWeight: 500, border: `1px solid #C7D2FE` }}>{c.certificationName}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {profileData?.skills?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '8px' }}>Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {profileData.skills.map((s: string) => (
                        <span key={s} style={{ padding: '4px 12px', borderRadius: '100px', background: '#F0FDF4', color: '#15803D', fontSize: '12px', fontWeight: 500, border: '1px solid #BBF7D0' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <button onClick={() => navigate('/student/profile')}
                style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${PRIMARY}`, background: '#EEEEFF', color: PRIMARY, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Edit Profile
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { resetWizard(); setView('list'); }} style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', color: SUB, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setFlowStep('goal')} style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', color: SUB, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><ChevronLeft size={14} /> Back</button>
                <button onClick={() => setFlowStep('roles')} style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Use this Profile <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Role (single select) */}
        {flowStep === 'roles' && (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 6px' }}>Select Your Target Role</h2>
            <p style={{ fontSize: '13px', color: SUB, margin: '0 0 14px' }}>Choose ONE role for this aspiration. You can add more aspirations later.</p>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input value={roleSearch} onChange={e => setRoleSearch(e.target.value)} placeholder="Search roles…"
                style={{ width: '100%', paddingLeft: '36px', paddingRight: '12px', paddingTop: '9px', paddingBottom: '9px', border: `1px solid ${BORDER}`, borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {visibleRoles.map(r => (
                <button key={r} onClick={() => setSelectedRole(selectedRole === r ? '' : r)}
                  style={{ padding: '7px 14px', borderRadius: '20px', border: `1.5px solid ${selectedRole === r ? PRIMARY : '#CBD5E1'}`, background: selectedRole === r ? PRIMARY : '#fff', color: selectedRole === r ? '#fff' : '#475569', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {selectedRole === r && <Check size={11} strokeWidth={3} />}
                  {r}
                </button>
              ))}
            </div>
            {!showAllRoles && ROLE_AREAS.filter(r => r.toLowerCase().includes(roleSearch.toLowerCase())).length > 12 && (
              <button onClick={() => setShowAllRoles(true)} style={{ fontSize: '12px', color: PRIMARY, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>+ View More</button>
            )}
            {selectedRole && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#EEEEFF', borderRadius: '8px', fontSize: '13px', color: PRIMARY, fontWeight: 600 }}>
                Selected: {selectedRole}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '24px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { resetWizard(); setView('list'); }} style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', color: SUB, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setFlowStep('profile')} style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', color: SUB, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><ChevronLeft size={14} /> Back</button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button disabled={!selectedRole || flowSaving} onClick={saveAspiration}
                  style={{ padding: '9px 24px', borderRadius: '8px', border: `1px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '13px', fontWeight: 600, cursor: selectedRole ? 'pointer' : 'not-allowed', opacity: !selectedRole ? 0.5 : 1 }}>
                  {flowSaving ? 'Saving…' : 'Save Aspiration'}
                </button>
                <button disabled={!selectedRole || flowSaving} onClick={saveAndAnalyse}
                  style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: selectedRole ? '#7C3AED' : BORDER, color: selectedRole ? '#fff' : '#94A3B8', fontSize: '13px', fontWeight: 600, cursor: selectedRole ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} /> {flowSaving ? 'Please wait…' : 'Analyse Skill Gap'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Explore Flow ─────────────────────────────────────────────────── */}
        {(flowStep as string) === 'explore' && (
          <>
            {/* PAYMENT */}
            {exploreStep === 'payment' && (
              <div style={{ maxWidth: '460px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>Order Summary</h2>
                <p style={{ fontSize: '13px', color: SUB, margin: '0 0 24px' }}>Review your order before proceeding.</p>

                <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '16px', marginBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '22px' }}>🧠</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>Psychometric Interest Test</div>
                      <div style={{ fontSize: '12px', color: SUB, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={11} /> 30 Questions &nbsp;·&nbsp; 15 Minutes
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: SUB }}>Test Fee</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>₹999.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: SUB }}>GST (18%)</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>₹179.82</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', borderTop: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: TEXT }}>Total</span>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: PRIMARY }}>₹1,178.82</span>
                  </div>
                </div>

                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '12px', color: '#92400E' }}>
                  This is a demo payment. Click "Pay Now" to proceed.
                </div>

                <button onClick={handleExplorePay} disabled={paying}
                  style={{ width: '100%', padding: '14px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '15px', fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer', opacity: paying ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
                  {paying ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</> : 'Pay Now'}
                </button>
                <button onClick={() => { resetExplore(); setFlowStep('goal'); }}
                  style={{ width: '100%', padding: '11px', borderRadius: '100px', border: `1.5px solid ${BORDER}`, background: '#fff', color: SUB, fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            )}

            {/* TEST */}
            {exploreStep === 'test' && (() => {
              const q = questions[currentQ];
              const totalQ = questions.length;
              const progress = totalQ > 0 ? Math.round(((currentQ) / totalQ) * 100) : 0;
              const answered = Object.keys(answers).length;
              const isLast = currentQ === totalQ - 1;
              return (
                <div>
                  {/* Timer + progress */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>
                      Question {currentQ + 1} <span style={{ color: SUB, fontWeight: 400 }}>of {totalQ}</span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: timeLeft < 120 ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${timeLeft < 120 ? '#FECACA' : '#FDE68A'}`, borderRadius: '100px', padding: '5px 14px' }}>
                      <Clock size={13} color={timeLeft < 120 ? '#DC2626' : '#92400E'} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: timeLeft < 120 ? '#DC2626' : '#92400E' }}>{fmtTime(timeLeft)}</span>
                    </div>
                  </div>
                  <div style={{ background: BORDER, borderRadius: '100px', height: '6px', marginBottom: '24px' }}>
                    <div style={{ width: `${progress}%`, height: '6px', borderRadius: '100px', background: `linear-gradient(90deg, ${PRIMARY}, #7C3AED)`, transition: 'width .3s' }} />
                  </div>

                  {questionsLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: SUB, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading questions…
                    </div>
                  ) : !questionsLoading && questions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: TEXT, marginBottom: '8px' }}>Questions not available</div>
                      <div style={{ fontSize: '13px', color: SUB, marginBottom: '24px' }}>No psychometric questions have been loaded yet. Please try again later or contact support.</div>
                      <button onClick={resetExplore} style={{ padding: '10px 28px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Go Back</button>
                    </div>
                  ) : !q ? null : (
                    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '28px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: TEXT, lineHeight: 1.6, marginBottom: '32px' }}>
                        {q.questionText}
                      </div>
                      {/* 1-5 scale */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0' }}>
                        {[1,2,3,4,5].map((val, idx) => {
                          const labels = ['Not Like Me', 'Slightly', 'Somewhat', 'Mostly', 'Very Much Like Me'];
                          const selected = answers[q.id] === val;
                          return (
                            <div key={val} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }}
                              onClick={() => setAnswers(prev => ({ ...prev, [q.id]: val }))}>
                              <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: `2px solid ${selected ? PRIMARY : BORDER}`, background: selected ? PRIMARY : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: selected ? '#fff' : '#475569', transform: selected ? 'scale(1.15)' : 'scale(1)', boxShadow: selected ? `0 4px 14px rgba(63,65,209,.3)` : 'none', transition: 'all .15s' }}>
                                {val}
                              </div>
                              {idx === 0 && <span style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', maxWidth: '56px', lineHeight: 1.3 }}>{labels[idx]}</span>}
                              {idx === 4 && <span style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', maxWidth: '56px', lineHeight: 1.3 }}>{labels[idx]}</span>}
                              {idx > 0 && idx < 4 && <span style={{ fontSize: '10px', color: 'transparent' }}>.</span>}
                              {idx < 4 && <div style={{ position: 'absolute', display: 'none' }} />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                    <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}
                      style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', color: SUB, fontSize: '13px', cursor: currentQ === 0 ? 'not-allowed' : 'pointer', opacity: currentQ === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <span style={{ fontSize: '12px', color: SUB }}>{answered} of {totalQ} answered</span>
                    {!isLast ? (
                      <button onClick={() => setCurrentQ(q => q + 1)} disabled={!answers[q?.id]}
                        style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: answers[q?.id] ? PRIMARY : BORDER, color: answers[q?.id] ? '#fff' : '#94A3B8', fontSize: '13px', fontWeight: 600, cursor: answers[q?.id] ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Next <ChevronRight size={14} />
                      </button>
                    ) : (
                      <button onClick={handleSubmitTest} disabled={submittingTest || answered < totalQ}
                        style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: answered >= totalQ ? '#7C3AED' : BORDER, color: answered >= totalQ ? '#fff' : '#94A3B8', fontSize: '13px', fontWeight: 600, cursor: answered >= totalQ ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {submittingTest ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <><Zap size={14} /> Submit Test</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* REPORT */}
            {exploreStep === 'report' && psychReport && (() => {
              const scores: Record<string, number> = psychReport.scores ?? {};
              const maxScore = Math.max(...Object.values(scores), 1);
              const paths: string[] = psychReport.recommendedPaths ?? [];

              // Sorted categories highest → lowest
              const sortedCats = Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number));
              const top1Cat = sortedCats[0]?.[0] ?? 'I';
              const top2Cat = sortedCats[1]?.[0] ?? 'R';
              const top1Score = sortedCats[0]?.[1] as number ?? 0;
              const top2Score = sortedCats[1]?.[1] as number ?? 0;
              const totalPossible = Object.keys(scores).length * 25;
              const pct = Math.round(((psychReport.totalScore ?? 0) / totalPossible) * 100);

              const CATEGORY_DETAIL: Record<string, { emoji: string; trait: string; strength: string; ifYouChoose: string }> = {
                R: { emoji: '🔧', trait: 'Hands-On Builder', strength: 'You prefer working with tools, systems, and real-world objects. You are most energised when you can see a tangible outcome from your work.', ifYouChoose: 'You will thrive in roles where you build, configure, or operate systems — hardware engineering, DevOps, infrastructure, or technical operations.' },
                I: { emoji: '🔬', trait: 'Analytical Thinker', strength: 'You are driven by curiosity and love breaking down complex problems. You enjoy research, data, and finding the "why" behind things.', ifYouChoose: 'Choosing an analytical path means you will spend time solving hard problems with data — data science, research, systems architecture, or AI/ML engineering.' },
                A: { emoji: '🎨', trait: 'Creative Innovator', strength: 'You gravitate toward expression, design, and originality. You bring imagination to whatever you work on and resist rigid constraints.', ifYouChoose: 'A creative path opens doors in UX/product design, creative technology, content, and any role where you shape how things look, feel, or communicate.' },
                S: { emoji: '🤝', trait: 'People-Focused Collaborator', strength: 'You are motivated by human connection. You find satisfaction in helping, teaching, or working alongside others toward shared goals.', ifYouChoose: 'You will excel in roles that require empathy and communication — consulting, customer success, education technology, HR, or community-led roles.' },
                E: { emoji: '🚀', trait: 'Driven Leader', strength: 'You are energised by influence, ambition, and results. You enjoy leading teams, making decisions, and taking on challenges that others avoid.', ifYouChoose: 'An enterprising path leads to product management, business leadership, entrepreneurship, or any role where you drive strategy and motivate others.' },
                C: { emoji: '📋', trait: 'Structured Organiser', strength: 'You value precision, process, and reliability. You are at your best when working within clear systems and producing well-organised, accurate work.', ifYouChoose: 'You will be valuable in quality assurance, operations, compliance, project management, or any role where consistency and attention to detail matter most.' },
              };

              const CAREER_DETAIL: Record<string, { why: string; dayInLife: string; growth: string }> = {
                'Backend Developer':        { why: `Your high ${CATEGORY_NAMES[top1Cat]} score (${top1Score}/25) shows you enjoy solving technical problems systematically. Backend development requires exactly this — building reliable, scalable systems that others depend on.`, dayInLife: 'You will design APIs, write server-side logic, manage databases, and ensure that applications run efficiently under load.', growth: 'Backend Developer → Senior Engineer → Tech Lead → Engineering Manager / Architect.' },
                'Software Engineer':        { why: `A strong ${CATEGORY_NAMES[top1Cat]} + ${CATEGORY_NAMES[top2Cat]} combination tells us you are comfortable with both logic and structured execution — the core of software engineering.`, dayInLife: 'You will write, review, and ship code across the stack, participate in architecture discussions, and solve problems that directly impact users.', growth: 'Software Engineer → Senior SWE → Staff Engineer → Principal / VP Engineering.' },
                'DevOps Engineer':          { why: `Your results suggest you enjoy working with systems and infrastructure (${CATEGORY_NAMES[top1Cat]}) as well as structured, methodical processes (${CATEGORY_NAMES[top2Cat]}).`, dayInLife: 'You will manage CI/CD pipelines, cloud infrastructure, deployments, and monitor production systems to ensure reliability.', growth: 'DevOps Engineer → Senior DevOps → Platform Engineer → Cloud Architect.' },
                'Data Analyst':             { why: `Your strong investigative score (${scores['I'] ?? '-'}/25) shows you love finding patterns and making sense of information — that is exactly what data analysts do every day.`, dayInLife: 'You will clean and analyse datasets, build dashboards, produce reports, and help teams make data-informed decisions.', growth: 'Data Analyst → Senior Analyst → Data Scientist → Analytics Manager.' },
                'Cloud Engineer':           { why: `Combining ${CATEGORY_NAMES[top1Cat]} (problem-solving) with ${CATEGORY_NAMES[top2Cat]} (structure), you are well-suited for cloud engineering where you architect and optimise cloud infrastructure.`, dayInLife: 'You will provision cloud resources, design infrastructure-as-code, manage security policies, and optimise cost and performance.', growth: 'Cloud Engineer → Cloud Architect → Solutions Architect → CTO / Cloud Practice Lead.' },
                'Data Scientist':           { why: `Your investigative score reflects a desire to go beyond the surface and understand the "why". Data science turns that curiosity into predictions and insights.`, dayInLife: 'You will build machine learning models, run experiments, interpret results, and present findings that shape product or business strategy.', growth: 'Data Scientist → Senior Data Scientist → ML Engineer → Head of Data / AI Research Scientist.' },
                'AI/ML Engineer':           { why: `A top-tier investigative result combined with a strong enterprising or realistic score means you are built for AI/ML — a field that demands both deep thinking and practical execution.`, dayInLife: 'You will design and train models, optimise algorithms, deploy ML pipelines, and integrate AI capabilities into real products.', growth: 'ML Engineer → Senior ML Engineer → AI Research Lead → Director of AI.' },
                'Product Manager':          { why: `Your blend of ${CATEGORY_NAMES[top1Cat]} and ${CATEGORY_NAMES[top2Cat]} shows you can both think strategically and work with people — the two superpowers of a great Product Manager.`, dayInLife: 'You will define product vision, prioritise features, work with designers and engineers, and measure outcomes against user and business goals.', growth: 'Associate PM → PM → Senior PM → Director of Product → CPO.' },
                'UI/UX Designer':           { why: `Your artistic score signals a strong creative instinct. Combined with your other top interest, you are drawn to work where you shape user experiences.`, dayInLife: 'You will conduct user research, create wireframes and prototypes, run usability tests, and collaborate with engineers to ship polished interfaces.', growth: 'Junior Designer → UX Designer → Senior UX → Design Lead → Head of Design.' },
                'Creative Director':        { why: `A rare high-Artistic + high-Enterprising combination means you do not just create — you lead creative vision. That is the signature of a Creative Director.`, dayInLife: 'You will set the creative direction for products or campaigns, lead a team of designers, and ensure every output aligns with the brand vision.', growth: 'Designer → Senior Designer → Art Director → Creative Director → Chief Creative Officer.' },
                'Business Analyst':         { why: `Your analytical and conventional strengths mean you naturally translate messy business problems into structured requirements — the core value of a Business Analyst.`, dayInLife: 'You will gather requirements, map processes, analyse data, and work with both technical and non-technical stakeholders to deliver solutions.', growth: 'BA → Senior BA → Product Owner → Solution Architect / Business Transformation Lead.' },
                'Technical Sales Engineer': { why: `Your results show you enjoy both technical challenges and interacting with people — a powerful combination that makes great technical sales engineers.`, dayInLife: 'You will demonstrate products, answer technical questions from clients, propose solutions, and help close enterprise deals.', growth: 'Sales Engineer → Senior SE → Solutions Architect → VP of Sales Engineering.' },
                'UX Researcher':            { why: `Your investigative + social combination is rare and valuable. You want to understand people deeply and use that understanding to improve products.`, dayInLife: 'You will plan and run user interviews, analyse qualitative data, synthesise insights, and present findings to product and design teams.', growth: 'UX Researcher → Senior Researcher → Research Manager → Head of UX Research.' },
                'Project Manager':          { why: `Your enterprising and conventional scores together indicate you are comfortable leading and organising — the exact balance a Project Manager needs.`, dayInLife: 'You will plan projects, manage timelines, coordinate teams, mitigate risks, and ensure deliverables meet scope, time, and budget.', growth: 'PM → Senior PM → Programme Manager → PMO Director.' },
                'Network Engineer':         { why: `A realistic + conventional profile means you enjoy working with physical/logical systems and following structured processes — the DNA of network engineering.`, dayInLife: 'You will design, configure, and maintain network infrastructure, troubleshoot connectivity issues, and ensure security and uptime.', growth: 'Network Engineer → Senior NE → Network Architect → IT Infrastructure Manager.' },
              };

              const top1Detail = CATEGORY_DETAIL[top1Cat];
              const top2Detail = CATEGORY_DETAIL[top2Cat];
              const top1Color  = CATEGORY_COLORS[top1Cat] ?? CATEGORY_COLORS['I'];
              const top2Color  = CATEGORY_COLORS[top2Cat] ?? CATEGORY_COLORS['R'];

              return (
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 8px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: 700, color: TEXT, margin: '0 0 4px' }}>Career Interest Report</h2>
                      <p style={{ fontSize: '13px', color: SUB }}>Score: {psychReport.totalScore} / {totalPossible} &nbsp;·&nbsp; {pct >= 80 ? '🔥 Excellent clarity' : pct >= 60 ? '✨ Good clarity' : '📊 Building clarity'}</p>
                    </div>
                    <button onClick={() => window.print()}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: `1px solid ${BORDER}`, borderRadius: '100px', background: '#fff', color: SUB, fontSize: '12px', cursor: 'pointer' }}>
                      <Download size={13} /> Download
                    </button>
                  </div>

                  {/* Scores + Paths grid (unchanged) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '18px' }}>Interest Scores</div>
                      {Object.entries(scores).map(([cat, score]) => {
                        const col = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['C'];
                        const p2 = Math.round((score / maxScore) * 100);
                        return (
                          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ width: '100px', fontSize: '12px', fontWeight: 600, color: TEXT, flexShrink: 0 }}>{CATEGORY_NAMES[cat]}</div>
                            <div style={{ flex: 1, background: '#F1F5F9', borderRadius: '100px', height: '8px' }}>
                              <div style={{ width: `${p2}%`, height: '8px', borderRadius: '100px', background: col.bar, transition: 'width .6s' }} />
                            </div>
                            <div style={{ width: '24px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: col.bar, flexShrink: 0 }}>{score}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '20px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '12px' }}>Strongest Areas</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {psychReport.topInterests?.split(',').map((t: string) => {
                            const cat = Object.entries(CATEGORY_NAMES).find(([,v]) => v === t.trim())?.[0] ?? 'I';
                            const col = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['I'];
                            return <span key={t} style={{ padding: '5px 14px', borderRadius: '100px', background: col.bg, color: col.text, fontSize: '12px', fontWeight: 600, border: `1.5px solid ${col.bar}33` }}>{t.trim()}</span>;
                          })}
                        </div>
                      </div>
                      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '20px', flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '12px' }}>Recommended Paths</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {paths.map((p, i) => (
                            <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: BG, borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{p}</span>
                              {i === 0 && <span style={{ fontSize: '10px', color: PRIMARY, fontWeight: 700, background: '#EEF2FF', padding: '2px 8px', borderRadius: '100px' }}>Top Match</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── DETAILED INSIGHTS ── */}

                  {/* What your top 2 traits say about you */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '14px' }}>What your results say about you</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      {[{ cat: top1Cat, detail: top1Detail, color: top1Color, score: top1Score, rank: 1 },
                        { cat: top2Cat, detail: top2Detail, color: top2Color, score: top2Score, rank: 2 }].map(({ cat, detail, color, score: s, rank }) => detail ? (
                        <div key={cat} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{detail.emoji}</div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>#{rank} — {detail.trait}</div>
                              <div style={{ fontSize: '11px', color: color.bar, fontWeight: 600 }}>{CATEGORY_NAMES[cat]} · {s}/25</div>
                            </div>
                          </div>
                          <p style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.7, margin: '0 0 10px' }}>{detail.strength}</p>
                          <div style={{ background: color.bg, borderRadius: '8px', padding: '10px 12px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: color.text, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>If you pursue this path</div>
                            <p style={{ fontSize: '12px', color: color.text, margin: 0, lineHeight: 1.6, opacity: 0.9 }}>{detail.ifYouChoose}</p>
                          </div>
                        </div>
                      ) : null)}
                    </div>
                  </div>

                  {/* Why each career path */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '6px' }}>Why these careers were recommended for you</div>
                    <div style={{ fontSize: '12.5px', color: SUB, marginBottom: '14px' }}>Based on your top interest areas — <strong style={{ color: TEXT }}>{CATEGORY_NAMES[top1Cat]}</strong> and <strong style={{ color: TEXT }}>{CATEGORY_NAMES[top2Cat]}</strong> — here's why each path is a strong fit.</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {paths.map((path, i) => {
                        const det = CAREER_DETAIL[path];
                        const col = i === 0 ? top1Color : CATEGORY_COLORS['C'];
                        return (
                          <div key={path} style={{ background: '#fff', border: `1px solid ${i === 0 ? top1Color.bar + '55' : BORDER}`, borderRadius: '14px', padding: '20px', position: 'relative' as const }}>
                            {i === 0 && (
                              <div style={{ position: 'absolute' as const, top: '14px', right: '14px', background: '#EEF2FF', color: PRIMARY, fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px' }}>⭐ Top Match</div>
                            )}
                            <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT, marginBottom: '12px', paddingRight: i === 0 ? '80px' : '0' }}>{path}</div>
                            {det ? (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: 700, color: col.bar, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>Why it matches you</div>
                                  <p style={{ fontSize: '12px', color: '#334155', lineHeight: 1.65, margin: 0 }}>{det.why}</p>
                                </div>
                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>A day in the life</div>
                                  <p style={{ fontSize: '12px', color: '#334155', lineHeight: 1.65, margin: 0 }}>{det.dayInLife}</p>
                                </div>
                                <div>
                                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>Growth path</div>
                                  <p style={{ fontSize: '12px', color: '#334155', lineHeight: 1.65, margin: 0 }}>{det.growth}</p>
                                </div>
                              </div>
                            ) : (
                              <p style={{ fontSize: '12.5px', color: SUB, margin: 0 }}>This path aligns with your strongest interest areas: {CATEGORY_NAMES[top1Cat]} and {CATEGORY_NAMES[top2Cat]}. A counsellor can help you explore specific opportunities in this field.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Score breakdown narrative */}
                  <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '12px' }}>How we calculated your results</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
                      {sortedCats.map(([cat, s], idx) => {
                        const col = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['C'];
                        const lvl = (s as number) >= 20 ? 'Very Strong' : (s as number) >= 16 ? 'Strong' : (s as number) >= 12 ? 'Moderate' : 'Developing';
                        return (
                          <div key={cat} style={{ background: idx < 2 ? col.bg : BG, borderRadius: '10px', padding: '12px', border: `1px solid ${idx < 2 ? col.bar + '33' : BORDER}` }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: idx < 2 ? col.text : TEXT }}>{CATEGORY_NAMES[cat]}</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: idx < 2 ? col.bar : '#94A3B8', margin: '4px 0 2px' }}>{s}<span style={{ fontSize: '11px', fontWeight: 500, color: SUB }}>/25</span></div>
                            <div style={{ fontSize: '10px', fontWeight: 600, color: idx < 2 ? col.bar : '#94A3B8' }}>{lvl}</div>
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.7, margin: 0 }}>
                      You answered 30 questions across 6 RIASEC interest categories (5 questions per category, max score 25 each).
                      Your top two categories — <strong>{CATEGORY_NAMES[top1Cat]}</strong> ({top1Score}/25) and <strong>{CATEGORY_NAMES[top2Cat]}</strong> ({top2Score}/25) — were combined to identify the most fitting career cluster.
                      {pct >= 80 ? ' Your overall score indicates strong, well-defined interests which means the recommendations above are highly reliable.' :
                        pct >= 60 ? ' Your overall score indicates good self-awareness. The recommendations are reliable, though a counsellor can help you refine further.' :
                          ' Your score suggests your interests are still forming — which is completely normal. A counsellor can help you explore which areas resonate most deeply.'}
                    </p>
                  </div>

                  {/* CTA */}
                  <div style={{ background: '#EEF2FF', border: `1px solid #C7D2FE`, borderRadius: '16px', padding: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '4px' }}>Talk to a Counsellor</div>
                      <div style={{ fontSize: '13px', color: SUB }}>Discuss your results and get personalised guidance on your next steps.</div>
                    </div>
                    <button onClick={() => setExploreStep('consult')}
                      style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', background: '#7C3AED', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Book a Session <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* CONSULT */}
            {exploreStep === 'consult' && (
              <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', padding: '32px 0 28px' }}>
                  <div style={{ width: '68px', height: '68px', borderRadius: '20px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '34px' }}>🎯</div>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: TEXT, marginBottom: '10px' }}>Report Generated</h2>
                  <p style={{ fontSize: '13px', color: SUB, lineHeight: 1.7 }}>Your report is ready. Book a counselling session to explore your results with an expert.</p>
                </div>

                {psychReport && (
                  <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '14px' }}>Your Report</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: SUB }}>Strongest Interest</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{psychReport.topInterests?.split(',')[0]?.trim()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: SUB }}>Top Career Match</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY }}>{psychReport.topCareerMatch}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: SUB }}>Score</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{psychReport.totalScore} / {Object.keys(psychReport.scores ?? {}).length * 25}</span>
                    </div>
                  </div>
                )}

                <button onClick={() => { resetExplore(); resetWizard(); setView('list'); navigate('/student/counselling'); }}
                  style={{ width: '100%', padding: '14px', borderRadius: '100px', border: 'none', background: '#7C3AED', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginBottom: '10px' }}>
                  Book Counselling Session
                </button>
                <button onClick={() => { resetExplore(); resetWizard(); setView('list'); }}
                  style={{ width: '100%', padding: '11px', borderRadius: '100px', border: `1.5px solid ${BORDER}`, background: '#fff', color: SUB, fontSize: '14px', cursor: 'pointer' }}>
                  Go to My Aspirations
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );

  /* ─── DETAIL VIEW ─── */
  if (view === 'detail' && selected) return (
    <div style={{ padding: '28px 32px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <button onClick={() => { setView('list'); setSelected(null); }}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: SUB, fontSize: '13px', cursor: 'pointer', marginBottom: '20px', padding: 0 }}>
        <ArrowLeft size={14} /> Back to My Aspirations
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: TEXT }}>{selected.roleArea}</h2>
          {selected.goal && <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: '100px', background: '#EEEEFF', color: PRIMARY, fontSize: '12px', fontWeight: 600 }}>{GOAL_LABEL[selected.goal] ?? selected.goal}</span>}
        </div>
        <button onClick={() => deleteAspiration(selected)} disabled={deleting}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '100px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}>
          <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete Aspiration'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Role + Skills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EEEEFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={18} color={PRIMARY} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: TEXT }}>Target Role</h4>
                <p style={{ margin: 0, fontSize: '12px', color: SUB }}>Your selected career goal</p>
              </div>
            </div>
            <span style={{ padding: '7px 16px', borderRadius: '100px', background: '#EEEEFF', color: PRIMARY, fontSize: '14px', fontWeight: 700, border: '1px solid #C7C9F7' }}>{selected.roleArea}</span>
          </div>

          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="#22C55E" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: TEXT }}>Skills</h4>
                <p style={{ margin: 0, fontSize: '12px', color: SUB }}>{selected.skills?.length ?? 0} skills saved</p>
              </div>
            </div>
            {selected.skills?.length > 0
              ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selected.skills.map(s => <span key={s} style={{ padding: '5px 12px', borderRadius: '100px', background: '#F0FDF4', color: '#15803D', fontSize: '12px', fontWeight: 500, border: '1px solid #BBF7D0' }}>{s}</span>)}
                </div>
              : <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>No skills attached to this aspiration.</p>
            }
          </div>
        </div>

        {selected.goal === 'explore' ? (
          /* ── Psychometric Report for Explore goal ── */
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: TEXT }}>Psychometric Report</h4>
                <p style={{ margin: 0, fontSize: '12px', color: SUB }}>Your RIASEC interest assessment result</p>
              </div>
              {detailPsychReport && (
                <button onClick={() => { resetExplore(); setFlowStep('explore' as any); setExploreStep('report'); setPsychReport(detailPsychReport); setView('wizard'); }}
                  style={{ padding: '7px 16px', borderRadius: '100px', border: `1.5px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  View Full Report
                </button>
              )}
            </div>

            {detailPsychLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', color: SUB, fontSize: '13px' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading report…
              </div>
            ) : !detailPsychReport ? (
              <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: SUB }}>No psychometric report yet. Take the assessment to discover your career interests.</p>
                <button onClick={() => { resetExplore(); setFlowStep('explore' as any); setView('wizard'); }}
                  style={{ padding: '9px 22px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Take Assessment →
                </button>
              </div>
            ) : (
              <div>
                {/* Score summary row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: SUB, fontWeight: 500, marginBottom: '4px' }}>Total Score</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: PRIMARY }}>{detailPsychReport.totalScore}<span style={{ fontSize: '11px', fontWeight: 500, color: SUB }}> / {Object.keys(detailPsychReport.scores ?? {}).length * 25}</span></div>
                  </div>
                  <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: SUB, fontWeight: 500, marginBottom: '4px' }}>Top Interests</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT }}>{detailPsychReport.topInterests}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', color: SUB, fontWeight: 500, marginBottom: '4px' }}>Best Career Match</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#7C3AED' }}>{detailPsychReport.topCareerMatch}</div>
                  </div>
                </div>

                {/* Mini RIASEC bars */}
                {detailPsychReport.scores && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {Object.entries(detailPsychReport.scores as Record<string, number>).map(([cat, score]) => {
                      const col = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['C'];
                      const maxS = Math.max(...Object.values(detailPsychReport.scores as Record<string, number>), 1);
                      return (
                        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '90px', fontSize: '12px', fontWeight: 600, color: TEXT, flexShrink: 0 }}>{CATEGORY_NAMES[cat]}</div>
                          <div style={{ flex: 1, background: '#F1F5F9', borderRadius: '100px', height: '7px' }}>
                            <div style={{ width: `${Math.round((score / maxS) * 100)}%`, height: '7px', borderRadius: '100px', background: col.bar }} />
                          </div>
                          <div style={{ width: '22px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: col.bar }}>{score}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Recommended paths */}
                {detailPsychReport.recommendedPaths?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: SUB, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '8px' }}>Recommended Paths</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                      {(detailPsychReport.recommendedPaths as string[]).map((p, i) => (
                        <span key={p} style={{ padding: '4px 12px', borderRadius: '100px', background: i === 0 ? '#EEF2FF' : '#F8FAFC', color: i === 0 ? PRIMARY : TEXT, fontSize: '12px', fontWeight: i === 0 ? 700 : 500, border: `1px solid ${i === 0 ? '#C7D2FE' : BORDER}` }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '14px', fontSize: '11px', color: '#94A3B8' }}>
                  Taken on {detailPsychReport.createdAt ? new Date(detailPsychReport.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Analysis running banner */}
            {analysisRunning && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Loader2 size={18} color="#92400E" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>Skill gap analysis is running…</div>
                  <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>This usually takes 1–3 minutes. The report will appear here automatically when done.</div>
                </div>
                <button onClick={() => navigate('/student/skill-gap/report', { state: { targetRole: selected.roleArea } })}
                  style={{ padding: '7px 16px', borderRadius: '100px', border: 'none', background: '#F59E0B', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  View Progress
                </button>
              </div>
            )}

            {/* Skill Gap Reports */}
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '22px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: TEXT }}>Skill Gap Reports</h4>
                <p style={{ margin: 0, fontSize: '12px', color: SUB }}>AI-generated reports for <strong>{selected.roleArea}</strong></p>
              </div>

              {reportsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', color: SUB, fontSize: '13px' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading reports…
                </div>
              ) : skillGapReports.length === 0 ? (
                <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '10px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: SUB }}>No skill gap reports generated yet for this role.</p>
                  <button onClick={() => navigate('/student/skill-gap/report', { state: { targetRole: selected.roleArea } })}
                    style={{ padding: '8px 20px', borderRadius: '100px', border: 'none', background: '#7C3AED', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Analyze Now →
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {skillGapReports.map(rp => (
                    <div key={rp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: `1px solid ${BORDER}`, borderRadius: '10px', background: '#FAFBFF' }}>
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: TEXT }}>{rp.targetRole}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: SUB }}>
                          {new Date(rp.generatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {rp.curriculum ? ` · ${rp.curriculum}` : ''}
                        </p>
                      </div>
                      <button onClick={() => navigate('/student/skill-gap/report', { state: { targetRole: rp.targetRole, reportId: rp.id, viewSaved: true } })}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 16px', borderRadius: '100px', border: `1.5px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        View Report
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => navigate('/student/skill-gap/report', { state: { targetRole: selected.roleArea } })}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '100px', border: 'none', background: '#7C3AED', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                <Zap size={14} /> Analyse Skill Gap
              </button>
              <button onClick={() => navigate('/student/interview/session')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Start Interview <ChevronRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  /* ─── EMPTY STATE ─── */
  if (aspirations.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', padding: '24px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: '80px', marginBottom: '24px' }}>🎓</div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: TEXT, maxWidth: '480px', lineHeight: 1.4, margin: '0 0 12px' }}>
        Discover Your Strengths, Identify Your Skill Gaps, And Get Ready For Your Dream Career.
      </h2>
      <p style={{ fontSize: '13px', color: SUB, maxWidth: '380px', marginBottom: '28px' }}>
        Set your career aspirations and we'll create a personalised roadmap just for you.
      </p>
      <button onClick={() => { resetWizard(); setView('wizard'); }}
        style={{ background: PRIMARY, color: '#fff', border: 'none', borderRadius: '24px', padding: '12px 32px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        Let's Get Started <ChevronRight size={16} />
      </button>
    </div>
  );

  /* ─── LIST VIEW ─── */
  return (
    <div style={{ padding: '28px 32px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Aspiration saved toast */}
      {savedToast && (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999, background: '#16A34A', color: '#fff', borderRadius: '12px', padding: '16px 20px', maxWidth: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>🎯</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Aspiration Saved!</p>
            <p style={{ margin: '3px 0 0', fontSize: '12px', opacity: 0.9 }}>{savedToast}</p>
          </div>
          <button onClick={() => setSavedToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7 }}>✕</button>
        </div>
      )}

      {/* Background task completion toast */}
      {bgToast && (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999, background: bgToast.targetRole ? '#1E293B' : '#EF4444', color: '#fff', borderRadius: '12px', padding: '16px 20px', maxWidth: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{bgToast.targetRole ? '✅' : '❌'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{bgToast.targetRole ? 'Analysis Complete!' : 'Analysis Failed'}</p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.85 }}>{bgToast.msg}</p>
            </div>
            <button onClick={() => setBgToast(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, flexShrink: 0 }}>✕</button>
          </div>
          {bgToast.targetRole && (
            <button
              onClick={() => { setBgToast(null); navigate('/student/skill-gap/report', { state: { targetRole: bgToast.targetRole } }); }}
              style={{ background: PRIMARY, border: 'none', color: '#fff', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' }}>
              View Report →
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: TEXT }}>My Aspirations</h2>
          <p style={{ margin: 0, fontSize: '13px', color: SUB }}>{aspirations.length} aspiration{aspirations.length !== 1 ? 's' : ''} saved</p>
        </div>
        <button onClick={() => { resetWizard(); setView('wizard'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 22px', height: '42px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(63,65,209,0.28)' }}>
          <Plus size={16} /> Add Aspiration
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {aspirations.map(asp => (
          <div key={asp.id} onClick={() => openDetail(asp)}
            style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '22px', cursor: 'pointer', transition: 'box-shadow .2s, border-color .2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(63,65,209,0.12)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#C7C9F7'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = BORDER; }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EEEEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Briefcase size={20} color={PRIMARY} />
              </div>
              {asp.goal && (
                <span style={{ padding: '3px 10px', borderRadius: '100px', background: '#F1F5F9', color: SUB, fontSize: '11px', fontWeight: 600 }}>
                  {GOAL_LABEL[asp.goal] ?? asp.goal}
                </span>
              )}
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: TEXT }}>{asp.roleArea}</h3>

            {asp.skills?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
                {asp.skills.slice(0, 3).map(s => (
                  <span key={s} style={{ padding: '3px 10px', borderRadius: '100px', background: '#F0FDF4', color: '#15803D', fontSize: '11px', border: '1px solid #BBF7D0' }}>{s}</span>
                ))}
                {asp.skills.length > 3 && <span style={{ fontSize: '11px', color: SUB, padding: '3px 6px' }}>+{asp.skills.length - 3}</span>}
              </div>
            )}

            <div style={{ paddingTop: '12px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                {asp.createdAt ? new Date(asp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: PRIMARY, fontWeight: 600 }}>
                View Details <ChevronRight size={12} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
