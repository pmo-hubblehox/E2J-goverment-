import { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, ChevronLeft, Check, Rocket, TrendingUp, Zap, Loader2, Trash2, ArrowLeft, Plus, Briefcase, Clock, Download, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_AREAS } from '../../constants/roleAreas';

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

const STEP_LABELS         = ['Your Goal', 'Your Profile', 'Role'];
const EXPLORE_STEP_LABELS = ['Your Goal', 'Payment', 'Psychometric Test', 'Your Report'];
const GOAL_OPTIONS = [
  { id: 'career',  icon: <Rocket size={28} color={PRIMARY} />,     title: 'Be Job Ready',             desc: 'Build the skills employers are looking for.' },
  { id: 'skills',  icon: <TrendingUp size={28} color={PRIMARY} />, title: 'Accelerate My Career',     desc: 'Grow faster with the right skills and career roadmap.' },
  { id: 'explore', icon: <Search size={28} color={PRIMARY} />,     title: 'Discover Your Strengths',  desc: 'Uncover your strengths and find your ideal career path.' },
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

function RecommendedWorkshops({ loading, workshops, navigate }: { loading: boolean; workshops: any[]; navigate: (path: string) => void }) {
  if (loading || workshops.length === 0) return null;
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: TEXT }}>Recommended Workshops</h4>
          <p style={{ margin: 0, fontSize: '12px', color: SUB }}>Workshops matching your career interests</p>
        </div>
        <button onClick={() => navigate('/student/workshops')}
          style={{ padding: '7px 16px', borderRadius: '100px', border: `1.5px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
          View All
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {workshops.map(w => (
          <div key={w.id} onClick={() => navigate('/student/workshops')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: `1px solid ${BORDER}`, borderRadius: '10px', background: '#FAFBFF', cursor: 'pointer' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: TEXT }}>{w.title}</p>
              <p style={{ margin: 0, fontSize: '11px', color: SUB }}>
                {w.targetRole} · {w.mode === 'ONLINE' ? 'Online' : `${w.city}, ${w.state}`} · {w.sessionDate}
              </p>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: '100px', background: '#EEF2FF', color: PRIMARY, fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
              {w.feeAmount ? `₹${w.feeAmount.toLocaleString()}` : 'Free'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [recommendedWorkshops, setRecommendedWorkshops] = useState<any[]>([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(false);

  // background task toast + aspiration saved toast
  const [bgToast, setBgToast]           = useState<{ msg: string; targetRole: string } | null>(null);
  const [savedToast, setSavedToast]     = useState<string | null>(null);
  const bgPollRef                        = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitialLoad                    = useRef(true);

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
  const [reportTab, setReportTab]       = useState<'psychometric' | 'feedback'>('psychometric');
  const [showInterviewInstructions, setShowInterviewInstructions] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/student/aspirations')
      .then(async r => {
        const data = r.data?.data ?? [];
        const exploreOnes = data.filter((a: any) => a.roleArea === 'Exploring Interests' && a.goal === 'explore' && a.id);
        if (exploreOnes.length > 0) {
          try {
            const pr = await api.get('/student/psychometric/reports');
            const topMatch: string = pr.data?.data?.[0]?.topCareerMatch ?? '';
            if (topMatch) {
              await Promise.all(exploreOnes.map((a: any) =>
                api.patch(`/student/aspiration/${a.id}`, { roleArea: topMatch }).catch(() => {})
              ));
              const refreshed = await api.get('/student/aspirations');
              setAspirations(refreshed.data?.data ?? []);
              isInitialLoad.current = false;
              return;
            }
          } catch { /* best effort */ }
        }
        setAspirations(data);
        if (isInitialLoad.current && data.length === 0) {
          resetWizard();
          setView('wizard');
        }
        isInitialLoad.current = false;
      })
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
    if (asp.roleArea && asp.roleArea !== 'Exploring Interests') {
      setWorkshopsLoading(true);
      api.get('/student/workshops', { params: { role: asp.roleArea } })
        .then(r => setRecommendedWorkshops((r.data?.data ?? []).slice(0, 3)))
        .catch(() => setRecommendedWorkshops([]))
        .finally(() => setWorkshopsLoading(false));
    } else {
      setRecommendedWorkshops([]);
    }
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
          const latest = reports[0] ?? null;
          setDetailPsychReport(latest);
          // Auto-rename legacy "Exploring Interests" aspirations to their actual top career match
          if (asp.roleArea === 'Exploring Interests' && latest?.topCareerMatch && asp.id) {
            api.patch(`/student/aspiration/${asp.id}`, { roleArea: latest.topCareerMatch })
              .then(() => load())
              .catch(() => {});
          }
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
      const report = res.data?.data ?? null;
      setPsychReport(report);
      // Rename the aspiration from the placeholder to the actual top career match
      const topMatch: string = report?.topCareerMatch ?? '';
      if (aspirationId && topMatch) {
        try { await api.patch(`/student/aspiration/${aspirationId}`, { roleArea: topMatch }); } catch { /* non-fatal */ }
      }
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
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: TEXT, textAlign: 'center', margin: '0 0 6px' }}>Let's Build Your Career Path</h2>
            <p style={{ fontSize: '13px', color: SUB, textAlign: 'center', margin: '0 0 28px' }}>Choose your goal, and we'll guide you with a personalized roadmap to help you achieve it.</p>
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
                {/* Name + Email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: PRIMARY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, flexShrink: 0 }}>
                    {(profileData?.firstName ?? profileData?.name ?? user?.name ?? 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: TEXT }}>
                      {[profileData?.firstName, profileData?.lastName].filter(Boolean).join(' ') || profileData?.name || user?.name || '—'}
                    </div>
                    <div style={{ fontSize: '13px', color: SUB, marginTop: '2px' }}>{profileData?.email ?? user?.email ?? '—'}</div>
                  </div>
                </div>

                {/* EDUCATION */}
                {profileData?.educations?.length > 0 && (
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 700, marginBottom: '8px' }}>Education</div>
                    {profileData.educations.map((e: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 12px', background: BG, borderRadius: '8px', marginBottom: i < profileData.educations.length - 1 ? '8px' : 0 }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>
                            {e.degree}{e.majorSpecialization ? ` · ${e.majorSpecialization}` : ''}
                          </div>
                          <div style={{ fontSize: '12px', color: SUB, marginTop: '2px' }}>{e.schoolUniversity}</div>
                        </div>
                        <div style={{ fontSize: '12px', color: SUB, textAlign: 'right' as const, flexShrink: 0, marginLeft: '12px' }}>
                          {e.yearOfPassing && <div>{e.yearOfPassing}</div>}
                          {e.percentageCgpa && <div>{e.percentageCgpa}%</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* WORK EXPERIENCE */}
                {(profileData?.experienceCategory || profileData?.workExperiences?.length > 0) && (
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 700, marginBottom: '8px' }}>Work Experience</div>
                    {profileData?.experienceCategory && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#EEF2FF', borderRadius: '8px', marginBottom: profileData?.workExperiences?.length > 0 ? '8px' : 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY }}>{profileData.experienceCategory}</span>
                        {(profileData.totalExpYears != null || profileData.totalExpMonths != null) && (
                          <span style={{ fontSize: '12px', color: SUB }}>· {profileData.totalExpYears ?? 0} yr {profileData.totalExpMonths ?? 0} mo</span>
                        )}
                      </div>
                    )}
                    {profileData?.workExperiences?.map((w: any, i: number) => (
                      <div key={i} style={{ padding: '10px 12px', background: BG, borderRadius: '8px', marginBottom: i < profileData.workExperiences.length - 1 ? '8px' : 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{w.companyName}</div>
                        <div style={{ fontSize: '12px', color: SUB, marginTop: '2px' }}>
                          {w.employmentType}{w.location ? ` · ${w.location}` : ''} · {w.fromDate} – {w.toDate ?? 'Present'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SKILLS */}
                {profileData?.skills?.length > 0 && (
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 700, marginBottom: '8px' }}>Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {profileData.skills.map((s: string) => (
                        <span key={s} style={{ padding: '4px 12px', borderRadius: '100px', background: '#F0FDF4', color: '#15803D', fontSize: '12px', fontWeight: 500, border: '1px solid #BBF7D0' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* PROFESSIONAL LINKS */}
                {(profileData?.linkedinUrl || profileData?.portfolioUrl || profileData?.websiteUrl) && (
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 700, marginBottom: '8px' }}>Professional Links</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {profileData.linkedinUrl && (
                        <a href={profileData.linkedinUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: '#0A66C2', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                          🔗 LinkedIn
                        </a>
                      )}
                      {profileData.portfolioUrl && (
                        <a href={profileData.portfolioUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: PRIMARY, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                          🔗 Portfolio
                        </a>
                      )}
                      {profileData.websiteUrl && (
                        <a href={profileData.websiteUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: SUB, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                          🔗 Website
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* PERSONAL DETAILS */}
                {(profileData?.mobilePrimary || profileData?.dob || profileData?.gender || profileData?.nationality) && (
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 700, marginBottom: '8px' }}>Personal Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { label: 'Phone', value: profileData?.mobilePrimary },
                        { label: 'Date of Birth', value: profileData?.dob },
                        { label: 'Gender', value: profileData?.gender },
                        { label: 'Nationality', value: profileData?.nationality },
                      ].filter(f => f.value).map(f => (
                        <div key={f.label} style={{ background: BG, borderRadius: '8px', padding: '10px 14px' }}>
                          <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '3px' }}>{f.label}</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: TEXT }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RESUME — at the bottom */}
                {(() => {
                  const resumes: any[] = profileData?.resumes ?? [];
                  if (!resumes.length) return (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#991B1B', marginBottom: '2px' }}>No resume uploaded</div>
                        <div style={{ fontSize: '12px', color: '#B91C1C' }}>Upload a resume on your profile page — it will be used for skill gap analysis.</div>
                      </div>
                      <button onClick={() => navigate('/student/profile')} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #DC2626', background: '#fff', color: '#DC2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Upload</button>
                    </div>
                  );
                  const primary = resumes.find((r: any) => r.isPrimary) ?? resumes[0];
                  return (
                    <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '14px 16px' }}>
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
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: TEXT, margin: '0 0 8px', textAlign: 'center' }}>Unlock Your Personalized Career Report</h2>
                <p style={{ fontSize: '13px', color: SUB, margin: '0 0 24px', textAlign: 'center', lineHeight: 1.6 }}>
                  Complete your payment to take our AI-powered psychometric assessment and receive a personalized career report backed by psychometric science.
                </p>

                <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px', marginBottom: '14px' }}>
                  {/* Assessment header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '16px', marginBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '22px' }}>🧠</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT }}>Psychometric Assessment</div>
                      <div style={{ fontSize: '12px', color: SUB, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={11} /> 30 Questions &nbsp;·&nbsp; 15 Minutes
                      </div>
                    </div>
                  </div>

                  {/* What you'll unlock */}
                  <div style={{ paddingBottom: '16px', marginBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT, marginBottom: '12px' }}>What You'll Unlock</div>
                    {['Your Personality Profile', 'Your Top Career Matches', 'Recommended Career Paths', 'Why These Careers Suit You'].map((item) => (
                      <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check size={12} color="#16A34A" strokeWidth={3} />
                        </span>
                        <span style={{ fontSize: '13px', color: TEXT }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Fee breakdown */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: SUB }}>Assessment Fee</span>
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
                  This is a demo payment. Click "Pay & Start Assessment" to proceed.
                </div>

                <button onClick={handleExplorePay} disabled={paying}
                  style={{ width: '100%', padding: '14px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '15px', fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer', opacity: paying ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
                  {paying ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</> : 'Pay & Start Assessment'}
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
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        {[1,2,3,4,5].map((val, idx) => {
                          const labels = ['Not Like Me', 'Slightly', 'Somewhat', 'Mostly', 'Very Much Like Me'];
                          const selected = answers[q.id] === val;
                          return (
                            <div key={val} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }}
                              onClick={() => setAnswers(prev => ({ ...prev, [q.id]: val }))}>
                              <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: `2px solid ${selected ? PRIMARY : BORDER}`, background: selected ? PRIMARY : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: selected ? '#fff' : '#475569', transform: selected ? 'scale(1.15)' : 'scale(1)', boxShadow: selected ? `0 4px 14px rgba(63,65,209,.3)` : 'none', transition: 'all .15s', flexShrink: 0 }}>
                                {val}
                              </div>
                              <span style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', lineHeight: 1.3, minHeight: '26px' }}>
                                {idx === 0 || idx === 4 ? labels[idx] : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                    <button onClick={() => { if (currentQ === 0) { setExploreStep('payment'); } else { setCurrentQ(q => Math.max(0, q - 1)); } }}
                      style={{ padding: '9px 20px', borderRadius: '8px', border: `1px solid ${BORDER}`, background: '#fff', color: SUB, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                // E+S
                'Business Development Manager': { why: `Your ${CATEGORY_NAMES[top1Cat]} + ${CATEGORY_NAMES[top2Cat]} combination means you are equally energised by driving results and working with people — the foundation of great business development.`, dayInLife: 'You will identify new opportunities, build partnerships, pitch to clients, and work cross-functionally to grow revenue and market presence.', growth: 'BDM Associate → Business Development Manager → Head of Partnerships → VP Growth / CCO.' },
                'HR Tech Specialist':       { why: `Combining ${CATEGORY_NAMES[top1Cat]} ambition with ${CATEGORY_NAMES[top2Cat]} focus on people, you are perfectly suited for a role that bridges technology and human resources.`, dayInLife: 'You will implement and manage HR systems, analyse workforce data, and help organisations use technology to improve hiring, retention, and culture.', growth: 'HR Analyst → HR Tech Specialist → HR Systems Manager → Chief People Officer.' },
                'Career Counsellor':        { why: `Your strong social orientation paired with an enterprising drive means you find fulfillment in guiding others and seeing them succeed.`, dayInLife: 'You will conduct career assessments, counsel students and professionals on pathways, build industry connections, and design career development programs.', growth: 'Career Advisor → Career Counsellor → Senior Counsellor → Head of Career Services.' },
                'EdTech Entrepreneur':      { why: `Your blend of ${CATEGORY_NAMES[top1Cat]} leadership and ${CATEGORY_NAMES[top2Cat]} empathy makes you well-positioned to build education products that genuinely help people learn.`, dayInLife: 'You will identify learning gaps, build or lead a product team, talk to students and teachers, iterate on your platform, and scale impact.', growth: 'Founder / EdTech PM → Product Lead → CEO / Co-Founder of an EdTech company.' },
                'Community Manager':        { why: `Your results show a natural talent for bringing people together and inspiring action — the core skill of a great community manager.`, dayInLife: 'You will grow and engage online communities, create content, run events, gather user feedback, and act as the bridge between users and the company.', growth: 'Community Associate → Community Manager → Head of Community → VP of Marketing / Growth.' },
                // I+E
                'Software Architect':       { why: `A rare high-Investigative + high-Enterprising combination means you think at the systems level while keeping business outcomes in view — exactly what architects do.`, dayInLife: 'You will design high-level system architectures, set technical standards, mentor engineering teams, and align technology decisions with business strategy.', growth: 'Senior Engineer → Software Architect → Principal Architect → CTO / VP Engineering.' },
                'Technical Founder':        { why: `Your investigative depth and enterprising drive create the perfect profile for someone who can both build and lead — the hallmark of a technical founder.`, dayInLife: 'You will validate ideas, build an MVP, hire a team, raise funding, and make decisions that define the direction of a technology company.', growth: 'Engineer → Side Project → Technical Co-Founder → CEO / CTO of a startup.' },
                // I+A
                'Frontend Developer':       { why: `Your investigative problem-solving + artistic sensibility means you care both about how things work and how they look — perfect for frontend development.`, dayInLife: 'You will build responsive UIs, implement designs in code, optimise performance, and collaborate with designers to ship polished user experiences.', growth: 'Junior FE Dev → Frontend Developer → Senior FE → Lead Engineer / Frontend Architect.' },
                'Creative Technologist':    { why: `Your analytical curiosity and creative instinct combine into something rare — you can prototype ideas that others cannot even imagine.`, dayInLife: 'You will experiment at the intersection of design and engineering, build interactive prototypes, and push the limits of what technology can express.', growth: 'Developer / Designer → Creative Technologist → Creative Director → Head of Innovation.' },
                'Game Developer':           { why: `Combining investigative problem-solving with artistic creativity, you are built for game development — a discipline that demands both technical and creative excellence.`, dayInLife: 'You will design and code game mechanics, work with artists and designers, optimise for performance, and craft experiences that engage and delight players.', growth: 'Junior Dev → Game Developer → Senior Developer → Game Director / Studio Head.' },
                'Multimedia Engineer':      { why: `Your blend of technical and creative interests makes you ideal for multimedia engineering, where code meets content.`, dayInLife: 'You will build video pipelines, develop interactive media tools, integrate audio/visual systems, and create immersive digital experiences.', growth: 'Media Engineer → Multimedia Engineer → Senior Multimedia Lead → Head of Digital Experience.' },
                // I+S
                'Research Scientist':       { why: `Your investigative drive + social interests show a desire to discover and share knowledge — the signature of a great research scientist.`, dayInLife: 'You will design experiments, collect and analyse data, publish findings, collaborate with peers, and apply insights to real-world problems.', growth: 'Research Assistant → Research Scientist → Senior Scientist → Principal Researcher / Lab Director.' },
                'Education Technologist':   { why: `Your investigative curiosity and social motivation combine perfectly for a role that uses technology to improve how people learn.`, dayInLife: 'You will research learning science, design digital learning tools, evaluate their impact, and train educators to use technology effectively.', growth: 'Instructional Designer → Education Technologist → EdTech Lead → Director of Learning Innovation.' },
                'Healthcare Data Analyst':  { why: `Your investigative mindset and social purpose mean you are drawn to using data to improve lives — healthcare data is one of the highest-impact places to do that.`, dayInLife: 'You will analyse clinical and operational data, build health dashboards, identify trends, and support healthcare providers in making evidence-based decisions.', growth: 'Data Analyst → Healthcare Data Analyst → Senior Analyst → Health Informatics Director.' },
                // I+C
                'Database Administrator':   { why: `Your investigative depth and conventional precision combine into the ideal profile for a DBA — someone who designs, secures, and optimises the systems that store critical data.`, dayInLife: 'You will design database schemas, manage backups, tune query performance, enforce security policies, and ensure data integrity across systems.', growth: 'Junior DBA → Database Administrator → Senior DBA → Data Architect → Head of Data Engineering.' },
                'Software Tester/QA Engineer': { why: `Your analytical mindset paired with a methodical, conventional approach means you catch what others miss — the superpower of a great QA engineer.`, dayInLife: 'You will write and execute test cases, automate regression suites, report bugs, verify fixes, and advocate for quality throughout the development cycle.', growth: 'QA Tester → QA Engineer → Senior QA → QA Lead → VP of Quality Assurance.' },
                'Systems Analyst':          { why: `Your investigative curiosity and conventional rigour make you excellent at diagnosing complex systems and proposing structured improvements.`, dayInLife: 'You will analyse existing systems, gather requirements, document processes, model solutions, and work with developers to implement improvements.', growth: 'Junior Analyst → Systems Analyst → Senior Analyst → Solution Architect / IT Manager.' },
                'IT Auditor':               { why: `Combining investigative rigour with a conventional eye for compliance, you are suited for auditing IT controls, risks, and processes.`, dayInLife: 'You will assess IT controls, evaluate risks, review security policies, test systems, and produce audit reports for management and regulators.', growth: 'IT Auditor → Senior Auditor → IT Audit Manager → Head of IT Risk / CISO.' },
                'Compliance Analyst':       { why: `Your investigative depth and preference for structured processes translate directly into compliance analysis, where detail and diligence are everything.`, dayInLife: 'You will review regulations, assess organisational policies, identify compliance gaps, and work with teams to implement corrective actions.', growth: 'Compliance Analyst → Senior Analyst → Compliance Manager → Chief Compliance Officer.' },
                // E+R
                'Startup Founder':          { why: `Your enterprising energy and realistic hands-on orientation make you someone who builds things and makes them work — the foundation of a startup founder.`, dayInLife: 'You will identify market problems, prototype solutions, build a team, secure funding, and iterate rapidly to find product-market fit.', growth: 'Intrapreneur → Startup Founder → Series A CEO → Multi-time Founder / Investor.' },
                'Product Owner':            { why: `Combining enterprising leadership with realistic execution means you bridge strategy and delivery — the key tension a Product Owner must manage.`, dayInLife: 'You will own the product backlog, define user stories, prioritise features, work with scrum teams, and ensure the right things get built at the right time.', growth: 'Associate PO → Product Owner → Senior PO → Product Manager → Head of Product.' },
                'Solutions Architect':      { why: `Your enterprising ambition and realistic systems thinking combine into a profile ideal for designing end-to-end solutions for complex business challenges.`, dayInLife: 'You will understand client requirements, design integrated technical solutions, lead presales discussions, and oversee implementation.', growth: 'Engineer → Solutions Architect → Principal Architect → VP of Solutions / CTO.' },
                'Engineering Manager':      { why: `Your drive to lead and your realistic grounding in how systems are built makes you a natural engineering manager — someone who ships great products through great teams.`, dayInLife: 'You will run engineering sprints, mentor developers, make technical trade-offs, partner with product, and ensure your team delivers reliably.', growth: 'Senior Engineer → Tech Lead → Engineering Manager → Director of Engineering → VP Engineering.' },
                // E+A
                'Brand Strategist':         { why: `Enterprising ambition combined with artistic sensibility makes you excellent at shaping how brands are perceived — and driving commercial results from it.`, dayInLife: 'You will define brand positioning, develop visual and verbal identity guidelines, oversee campaigns, and measure brand impact.', growth: 'Brand Analyst → Brand Strategist → Brand Director → Chief Marketing Officer.' },
                'Marketing Technologist':   { why: `Your drive for results + creative instinct makes you ideal for marketing technology — using tools, data, and creativity to drive growth.`, dayInLife: 'You will manage marketing automation platforms, run A/B tests, analyse campaign data, and implement tech that scales marketing efforts.', growth: 'Marketing Analyst → Marketing Technologist → Marketing Operations Lead → VP Marketing.' },
                'UX Strategist':            { why: `Combining leadership drive with a creative, user-centred perspective, you are well positioned to define UX strategy at a product or organisational level.`, dayInLife: 'You will align UX vision with business goals, define design principles, advocate for user research, and influence product roadmaps.', growth: 'UX Designer → Senior UX → UX Strategist → Head of UX → VP Product Design.' },
                'Growth Hacker':            { why: `Your enterprising results-focus and artistic experimentation instinct combine into the growth hacking mindset — rapid iteration to find what drives traction.`, dayInLife: 'You will run rapid experiments across acquisition, activation, and retention channels, analyse results, and double down on what works.', growth: 'Growth Analyst → Growth Hacker → Growth Lead → VP Growth / CMO.' },
                // E+C
                'Operations Manager':       { why: `Your drive for results and conventional preference for process and structure make you an ideal operations manager — someone who makes complex systems run smoothly.`, dayInLife: 'You will manage daily operations, optimise processes, coordinate teams, track KPIs, and solve problems before they escalate.', growth: 'Operations Associate → Operations Manager → Senior Ops Manager → COO.' },
                'IT Manager':               { why: `Combining enterprising leadership with a methodical, organised approach, you are well suited to leading IT teams and managing infrastructure strategy.`, dayInLife: 'You will oversee IT operations, manage vendor relationships, set technology budgets, and ensure systems are reliable and secure.', growth: 'IT Analyst → IT Manager → Senior IT Manager → Director of IT → CIO.' },
                'Finance Technology Analyst': { why: `Your enterprising mindset and analytical precision make you a strong fit for fintech analysis, where business strategy meets financial systems.`, dayInLife: 'You will analyse financial processes, evaluate technology solutions, support digital transformation projects, and model financial scenarios.', growth: 'Analyst → FinTech Analyst → Senior Analyst → Finance Technology Manager → CFO-track leader.' },
                // A+S
                'Instructional Designer':   { why: `Your artistic creativity and social motivation make you a natural instructional designer — someone who creates learning experiences that actually engage people.`, dayInLife: 'You will analyse learning needs, design course content, develop eLearning modules, and evaluate whether learners are achieving outcomes.', growth: 'Content Creator → Instructional Designer → Senior ID → Head of Learning Design.' },
                'Content Strategist':       { why: `Artistic expression + social connection describes exactly what great content strategy achieves — content that resonates, informs, and builds community.`, dayInLife: 'You will develop content plans, write and commission content, analyse performance metrics, and align content with audience and business goals.', growth: 'Content Writer → Content Strategist → Head of Content → VP Content / CMO.' },
                'E-Learning Developer':     { why: `Your creative skills and people orientation make you well suited to building digital learning experiences that are both engaging and effective.`, dayInLife: 'You will use authoring tools (Articulate, Adobe) to build eLearning modules, animate content, and integrate interactive assessments.', growth: 'eLearning Developer → Senior Developer → eLearning Architect → Head of Digital Learning.' },
                'Training Consultant':      { why: `Your artistic ability to craft engaging content combined with a social drive to help others grow makes training consultancy a natural fit.`, dayInLife: 'You will assess training needs, design programs, facilitate workshops, and measure the impact of learning on performance.', growth: 'Trainer → Training Consultant → Senior Consultant → Learning & Development Director.' },
                // A+R
                'Embedded Systems Designer': { why: `Your creative problem-solving + hands-on realistic orientation makes you well suited to embedded systems — where hardware meets software.`, dayInLife: 'You will write firmware, interface with sensors and actuators, optimise for constrained environments, and test on physical hardware.', growth: 'Embedded Developer → Embedded Systems Designer → Senior Engineer → Principal Engineer / CTO.' },
                'Industrial Designer':      { why: `Artistic creativity + realistic, hands-on thinking is the perfect combination for industrial design — creating products that are beautiful and functional.`, dayInLife: 'You will sketch concepts, build prototypes, refine ergonomics, and collaborate with engineers and manufacturers to bring products to life.', growth: 'Junior Designer → Industrial Designer → Senior Designer → Design Director.' },
                'Hardware Engineer':        { why: `Your creative instinct and realistic love of building physical systems makes hardware engineering an excellent fit.`, dayInLife: 'You will design circuits, select components, prototype and test hardware, and work with software teams to integrate firmware.', growth: 'Hardware Engineer → Senior HW Engineer → Principal Engineer → Hardware Architect / VP Engineering.' },
                'Creative Engineer':        { why: `Blending artistic imagination with realistic engineering capability, you are the person who makes technically impossible ideas become reality.`, dayInLife: 'You will prototype interactive installations, build creative hardware/software systems, and collaborate with designers and artists on experimental projects.', growth: 'Developer → Creative Engineer → Lead Creative Technologist → Head of Innovation Lab.' },
                // S+C
                'IT Support Engineer':      { why: `Your social desire to help others and your conventional comfort with structured processes make you a great IT support engineer — the person people rely on.`, dayInLife: 'You will diagnose and resolve technical issues, set up equipment, document solutions, and ensure users can work without interruption.', growth: 'IT Support Technician → Support Engineer → Senior Support → IT Manager.' },
                'Technical Trainer':        { why: `Your ability to work with people and your preference for structured, organised delivery makes technical training a natural fit.`, dayInLife: 'You will develop training materials, deliver workshops and webinars, assess learner progress, and update curricula as technology evolves.', growth: 'Trainer → Technical Trainer → Senior Trainer → Head of Technical Education.' },
                'Customer Success Manager': { why: `Your social warmth and organised, process-driven mindset are exactly what customers need — someone who helps them succeed and stays on top of every detail.`, dayInLife: 'You will onboard new customers, run business reviews, identify upsell opportunities, resolve issues, and advocate for customers internally.', growth: 'CSM Associate → Customer Success Manager → Senior CSM → Head of Customer Success → CCO.' },
                'ERP Consultant':           { why: `Combining social consulting skills with a structured, conventional approach to business processes, you are well positioned for ERP consulting.`, dayInLife: 'You will gather business requirements, configure ERP modules, train end users, and support go-live and post-implementation.', growth: 'ERP Analyst → ERP Consultant → Senior Consultant → Solution Architect / Practice Lead.' },
                'Help Desk Manager':        { why: `Your social approach to helping people combined with your organised management style makes you effective at leading a help desk team.`, dayInLife: 'You will manage a support team, track SLA compliance, handle escalations, improve processes, and report on support metrics.', growth: 'Support Agent → Team Lead → Help Desk Manager → IT Operations Manager.' },
                // R+C
                'IT Systems Administrator': { why: `A realistic + conventional profile means you enjoy maintaining and operating infrastructure with precision — the core of IT systems administration.`, dayInLife: 'You will manage servers, storage, and operating systems, apply patches, monitor performance, and ensure systems are available and secure.', growth: 'Junior SysAdmin → Systems Administrator → Senior SysAdmin → IT Infrastructure Manager.' },
                'Cloud Support Associate':  { why: `Your hands-on systems mindset and structured, methodical approach make you well suited for cloud support, where precision and reliability matter most.`, dayInLife: 'You will help customers troubleshoot cloud services, answer technical queries, document solutions, and escalate complex issues to engineering teams.', growth: 'Cloud Support Associate → Cloud Support Engineer → Solutions Architect → Cloud Consultant.' },
                'Automation Engineer':      { why: `Combining realistic systems thinking with conventional preference for process repeatability, you are built for automation engineering.`, dayInLife: 'You will build automation scripts and frameworks, reduce manual toil, implement CI/CD tools, and maintain infrastructure-as-code.', growth: 'QA/DevOps Engineer → Automation Engineer → Senior Automation Engineer → Principal Engineer.' },
                'Security Analyst':         { why: `Your realistic, hands-on mindset and conventional attention to structured protocols are the two pillars of a great security analyst.`, dayInLife: 'You will monitor systems for threats, analyse security logs, investigate incidents, patch vulnerabilities, and help build a stronger security posture.', growth: 'Security Analyst → Senior Analyst → Security Engineer → CISO / Head of Security.' },
                // S+R
                'Technical Support Engineer': { why: `Bridging ${CATEGORY_NAMES[top1Cat]} communication with ${CATEGORY_NAMES[top2Cat]} technical depth, you are someone who both understands the problem and can fix it.`, dayInLife: 'You will diagnose technical issues for customers, reproduce bugs, work with engineering teams, and guide users through complex technical resolutions.', growth: 'Support Engineer → Senior Support Engineer → Technical Account Manager → Engineering Manager.' },
                'Field Application Engineer': { why: `Your social confidence and hands-on technical ability make you ideal for field application engineering, where you bring technology to life for customers.`, dayInLife: 'You will demonstrate products at customer sites, provide technical guidance during integration, and support sales with technical expertise.', growth: 'Application Engineer → Field Application Engineer → Senior FAE → Technical Sales Director.' },
                'IT Consultant':            { why: `Your social skills enable you to understand client needs clearly, while your technical foundations allow you to propose solutions that actually work.`, dayInLife: 'You will assess client IT environments, recommend solutions, manage technology projects, and ensure implementations meet business objectives.', growth: 'IT Analyst → IT Consultant → Senior Consultant → IT Director / Practice Lead.' },
                'Systems Integrator':       { why: `Combining social collaboration skills with realistic systems thinking, you are equipped to connect disparate technologies into cohesive solutions.`, dayInLife: 'You will design integration architectures, connect APIs and data sources, test end-to-end workflows, and support clients through deployment.', growth: 'Integration Developer → Systems Integrator → Senior Integrator → Solutions Architect.' },
                // A+C
                'Web Designer':             { why: `Your artistic creativity and conventional attention to detail make you a great web designer — someone who builds experiences that are both beautiful and precise.`, dayInLife: 'You will create visual mockups, design page layouts, select typography and colour systems, and work with developers to implement pixel-perfect interfaces.', growth: 'Junior Designer → Web Designer → Senior Designer → Creative Director.' },
                'Digital Media Producer':   { why: `Your creative talent and organised, process-oriented mindset make you an excellent digital media producer — managing creativity at scale.`, dayInLife: 'You will plan and produce digital content across video, audio, and graphics; manage timelines; coordinate teams; and ensure quality standards.', growth: 'Media Producer → Digital Media Producer → Senior Producer → Head of Content Production.' },
                'Front-End Developer':      { why: `Your artistic design sensibility + conventional preference for structured, repeatable code is the combination that produces great front-end developers.`, dayInLife: 'You will translate designs into responsive web interfaces, write clean HTML/CSS/JS, ensure cross-browser compatibility, and optimise performance.', growth: 'Junior FE Dev → Front-End Developer → Senior FE → Lead Engineer / Frontend Architect.' },
                'Graphic Technologist':     { why: `Blending artistic ability with a conventional, systematic mindset, you can both create and systematise visual outputs — a valuable combination in any creative team.`, dayInLife: 'You will build and maintain design systems, create graphics and templates, manage brand asset libraries, and automate repetitive design tasks.', growth: 'Graphic Designer → Graphic Technologist → Design Systems Lead → Creative Director.' },
                'Content Management Specialist': { why: `Your creativity and structured, organised approach make content management natural — you know how to produce great content and keep it organised at scale.`, dayInLife: 'You will manage a CMS, publish and update digital content, optimise for SEO, maintain content calendars, and ensure consistency across channels.', growth: 'Content Coordinator → Content Management Specialist → Content Manager → Head of Digital.' },
              };

              const top1Detail = CATEGORY_DETAIL[top1Cat];
              const top2Detail = CATEGORY_DETAIL[top2Cat];
              const top1Color  = CATEGORY_COLORS[top1Cat] ?? CATEGORY_COLORS['I'];
              const top2Color  = CATEGORY_COLORS[top2Cat] ?? CATEGORY_COLORS['R'];

              const hasCounsellorFeedback = !!(psychReport.feedbackKeyObservations || psychReport.feedbackActionItems || psychReport.feedbackResourcesRecommended);

              return (
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 8px' }}>

                  {/* Tab switcher — only shown when counsellor feedback exists */}
                  {hasCounsellorFeedback && (
                    <div style={{ display: 'flex', gap: '4px', borderBottom: `2px solid ${BORDER}`, marginBottom: '24px' }}>
                      {([
                        { key: 'psychometric', label: '🧠 Psychometric Report' },
                        { key: 'feedback',     label: '💬 Counsellor Feedback' },
                      ] as const).map(t => (
                        <button key={t.key} onClick={() => setReportTab(t.key)}
                          style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', borderBottom: `2px solid ${reportTab === t.key ? PRIMARY : 'transparent'}`, marginBottom: '-2px', background: reportTab === t.key ? '#EEF2FF' : 'transparent', color: reportTab === t.key ? PRIMARY : SUB, borderRadius: '8px 8px 0 0' }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Counsellor Feedback Tab */}
                  {hasCounsellorFeedback && reportTab === 'feedback' && (() => {
                    // Parse action items and resources from JSON
                    let parsedActions: { text: string; checked: boolean }[] = [];
                    let parsedResources: { title: string; url: string }[] = [];
                    try { parsedActions = (JSON.parse(psychReport.feedbackActionItems || '[]') as { text: string }[]).map(a => ({ ...a, checked: false })); } catch { parsedActions = []; }
                    try { parsedResources = JSON.parse(psychReport.feedbackResourcesRecommended || '[]'); } catch { parsedResources = []; }
                    return (
                    <div>
                      {/* Identity banner */}
                      <div style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #7C3AED 100%)`, borderRadius: '16px', padding: '22px 24px', marginBottom: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>👩‍💼</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: 700 }}>{psychReport.counsellorName ?? 'Your Counsellor'}</div>
                          <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '3px' }}>
                            Career Counsellor{psychReport.commentedAt ? ` · Session on ${new Date(psychReport.commentedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Key Observations */}
                      {psychReport.feedbackKeyObservations && (
                        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px 20px', marginBottom: '14px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: SUB, textTransform: 'uppercase' as const, letterSpacing: '.5px', marginBottom: '10px' }}>🔍 Key Observations</div>
                          <p style={{ fontSize: '13px', color: TEXT, lineHeight: 1.8, margin: 0 }}>{psychReport.feedbackKeyObservations}</p>
                        </div>
                      )}

                      {/* Action Items + Resources side by side */}
                      {(parsedActions.length > 0 || parsedResources.length > 0) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                          {parsedActions.length > 0 && (
                            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px 20px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: SUB, textTransform: 'uppercase' as const, letterSpacing: '.5px', marginBottom: '12px' }}>✅ Action Items — <span style={{ color: PRIMARY }}>tickable checklist</span></div>
                              {parsedActions.map((item, i) => (
                                <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
                                  <input type="checkbox" defaultChecked={false} style={{ marginTop: '2px', accentColor: PRIMARY, width: '16px', height: '16px', flexShrink: 0 }} />
                                  <span style={{ fontSize: '13px', color: TEXT, lineHeight: 1.6 }}>{item.text}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {parsedResources.length > 0 && (
                            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px 20px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: SUB, textTransform: 'uppercase' as const, letterSpacing: '.5px', marginBottom: '12px' }}>📚 Resources — <span style={{ color: PRIMARY }}>tappable links</span></div>
                              {parsedResources.map((res, i) => (
                                <a key={i} href={res.url} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${BORDER}`, marginBottom: '8px', textDecoration: 'none', background: '#FAFBFF' }}>
                                  <span style={{ fontSize: '16px', flexShrink: 0 }}>🔗</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.title}</div>
                                    <div style={{ fontSize: '11px', color: SUB, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.url}</div>
                                  </div>
                                  <span style={{ fontSize: '12px', color: SUB }}>↗</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                    );
                  })()}

                  {/* Psychometric Report — shown when no tabs or psychometric tab active */}
                  {(!hasCounsellorFeedback || reportTab === 'psychometric') && (
                  <div>
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
                      <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, marginBottom: '4px' }}>Interest Scores</div>
                      <div style={{ fontSize: '11.5px', color: SUB, marginBottom: '18px' }}>Your score across the 6 RIASEC interest categories</div>
                      {sortedCats.map(([cat, score], idx) => {
                        const col = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['C'];
                        const s = score as number;
                        const p2 = Math.round((s / 25) * 100);
                        const lvl = s >= 20 ? 'Very Strong' : s >= 16 ? 'Strong' : s >= 12 ? 'Moderate' : 'Developing';
                        return (
                          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <div style={{ width: '108px', fontSize: '12px', fontWeight: 600, color: TEXT, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {CATEGORY_NAMES[cat]}{idx < 2 && <span style={{ fontSize: '10px' }}>⭐</span>}
                            </div>
                            <div style={{ flex: 1, background: '#F1F5F9', borderRadius: '100px', height: '8px' }}>
                              <div style={{ width: `${p2}%`, height: '8px', borderRadius: '100px', background: col.bar, transition: 'width .6s' }} />
                            </div>
                            <div style={{ width: '40px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: col.bar, flexShrink: 0 }}>{s}/25</div>
                            <div style={{ width: '72px', textAlign: 'right', fontSize: '10px', fontWeight: 600, color: idx < 2 ? col.bar : '#94A3B8', flexShrink: 0 }}>{lvl}</div>
                          </div>
                        );
                      })}
                      <div style={{ fontSize: '11px', color: SUB, marginTop: '6px', paddingTop: '14px', borderTop: `1px solid ${BORDER}` }}>⭐ marks your top interest categories.</div>
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
                    <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '14px' }}>Why these careers were recommended for you</div>
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
                                  <div style={{ fontSize: '10px', fontWeight: 700, color: PRIMARY, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>Why it matches you</div>
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
                    <p style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.7, margin: 0 }}>
                      You answered 30 questions across 6 RIASEC interest categories (5 questions per category, max score 25 each).
                      Your top two categories — <strong>{CATEGORY_NAMES[top1Cat]}</strong> ({top1Score}/25) and <strong>{CATEGORY_NAMES[top2Cat]}</strong> ({top2Score}/25) — were combined to identify the most fitting career cluster.
                      {pct >= 80 ? ' Your overall score indicates strong, well-defined interests which means the recommendations above are highly reliable.' :
                        pct >= 60 ? ' Your overall score indicates good self-awareness. The recommendations are reliable, though a counsellor can help you refine further.' :
                          ' Your score suggests your interests are still forming — which is completely normal. A counsellor can help you explore which areas resonate most deeply.'}
                    </p>
                  </div>


                  {/* Explore Courses CTA */}
                  <div style={{ background: '#EEF2FF', border: `1px solid #C7D2FE`, borderRadius: '16px', padding: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '4px' }}>Explore Courses</div>
                      <div style={{ fontSize: '13px', color: SUB }}>Browse courses matching your top match{paths[0] ? <> — <strong style={{ color: TEXT }}>{paths[0]}</strong></> : ''}.</div>
                    </div>
                    <button onClick={() => { resetExplore(); resetWizard(); setView('list'); sessionStorage.setItem('psychCourseRole', paths[0] ?? ''); navigate('/student/courses'); }}
                      style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', background: '#7C3AED', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={14} /> Browse Courses
                    </button>
                  </div>

                  {/* CTA */}
                  <div style={{ background: '#EEF2FF', border: `1px solid #C7D2FE`, borderRadius: '16px', padding: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: TEXT, marginBottom: '4px' }}>Talk to a Counsellor</div>
                      <div style={{ fontSize: '13px', color: SUB }}>Discuss your results and get personalised guidance on your next steps.</div>
                    </div>
                    <button onClick={() => { resetExplore(); resetWizard(); setView('list'); navigate('/student/counselling'); }}
                      style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', background: '#7C3AED', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Book a Session <ChevronRight size={14} />
                    </button>
                  </div>
                  </div>
                  )}
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
        ) : null}

        {view === 'detail' && selected && (
          <RecommendedWorkshops loading={workshopsLoading} workshops={recommendedWorkshops} navigate={navigate} />
        )}

        {selected?.goal !== 'explore' && (
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
              <button onClick={() => setShowInterviewInstructions(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Start Interview <ChevronRight size={14} />
              </button>
            </div>
          </>
        )}

      {/* Interview Instructions Modal */}
      {showInterviewInstructions && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #7C3AED 100%)`, padding: '28px 32px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '8px' }}>
                  <Briefcase size={22} color="#fff" />
                </div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff' }}>Before You Begin</h2>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Make sure you are ready for your AI interview session</p>
            </div>
            <div style={{ padding: '24px 32px' }}>
              {[
                { icon: '🔇', title: 'Take the interview in a quiet place', desc: 'Sit in a silent room with no background noise. Close doors and windows, and ask others around you not to disturb.' },
                { icon: '📷', title: 'Camera & microphone must be on', desc: 'Allow browser permissions for camera and mic. Both must be active throughout the session.' },
                { icon: '💡', title: 'Good lighting', desc: 'Make sure your face is clearly visible. Natural front-facing light works best.' },
                { icon: '🎧', title: 'Use earphones if possible', desc: 'Earphones reduce echo and help you hear questions clearly.' },
                { icon: '🌐', title: 'Stable internet connection', desc: 'Use Wi-Fi or a strong data connection. Do not switch networks mid-session.' },
                { icon: '⏱️', title: 'Set aside uninterrupted time', desc: 'The interview takes 10–15 minutes. Do not switch tabs or close the window.' },
                { icon: '👔', title: 'Dress professionally', desc: 'Treat this like a real interview — dress appropriately and sit upright.' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: '14px', marginBottom: '16px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px', minWidth: '28px', marginTop: '1px' }}>{item.icon}</span>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: TEXT }}>{item.title}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: SUB, lineHeight: '1.5' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 32px 28px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowInterviewInstructions(false)}
                style={{ padding: '10px 24px', borderRadius: '100px', border: `1.5px solid ${BORDER}`, background: '#fff', fontSize: '13px', fontWeight: 500, color: SUB, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => { setShowInterviewInstructions(false); navigate('/student/interview/session'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 28px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                I'm Ready — Start <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
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
