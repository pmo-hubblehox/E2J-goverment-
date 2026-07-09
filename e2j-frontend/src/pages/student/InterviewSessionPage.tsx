import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Maximize2, CheckCircle, Loader2, Eye, EyeOff, X, Mic, BrainCircuit } from 'lucide-react';
import api from '../../services/api';

const PRIMARY   = '#3F41D1';
const BORDER    = '#E2E8F0';
const TEXT      = '#212121';
const SUB       = '#666666';
const BG        = '#F4F5FF';

const PREFERRED_VOICES: Record<string, string[]> = {
  English: ['Microsoft Heera', 'Google UK English Female', 'Google US English', 'Microsoft Zira'],
  Hindi:   ['Google हिन्दी', 'Microsoft Swara', 'hi-IN'],
};

const MAX_ANSWER_SEC        = 180;

const LANGUAGES = [
  { label: 'English', code: 'en-IN', flag: '🇬🇧' },
  { label: 'Hindi',   code: 'hi-IN', flag: '🇮🇳' },
];

const TOPIC_META: Record<string, { color: string; bg: string; label: string }> = {
  INTRODUCTION:     { color: '#7C3AED', bg: '#EDE9FE', label: 'Introduction' },
  TECHNICAL_SKILLS: { color: PRIMARY,   bg: '#EEEEFF', label: 'Technical Skills' },
  BEHAVIOURAL:      { color: '#0F766E', bg: '#CCFBF1', label: 'Behavioural' },
  PROBLEM_SOLVING:  { color: '#B45309', bg: '#FEF3C7', label: 'Problem Solving' },
  DOMAIN_KNOWLEDGE: { color: '#BE185D', bg: '#FCE7F3', label: 'Domain Knowledge' },
  // legacy
  WARMUP:        { color: '#7C3AED', bg: '#EDE9FE', label: 'Introduction' },
  TECHNICAL:     { color: PRIMARY,   bg: '#EEEEFF', label: 'Technical Skills' },
  BEHAVIORAL:    { color: '#0F766E', bg: '#CCFBF1', label: 'Behavioural' },
  SITUATIONAL:   { color: '#B45309', bg: '#FEF3C7', label: 'Problem Solving' },
  ROLE_SPECIFIC: { color: '#BE185D', bg: '#FCE7F3', label: 'Domain Knowledge' },
};

type Phase = 'setup' | 'starting' | 'ai_speaking' | 'listening' | 'processing' | 'done';

interface SessionState {
  sessionId: number; questionId: number; questionText: string;
  topicArea: string; questionNumber: number; targetRole: string;
}
interface AspirationOption { roles: string[]; skills: string[]; experienceLevel: string; }

function Waveform({ active, color }: { active: boolean; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '32px' }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} style={{
          width: '4px', borderRadius: '2px', background: color,
          height: active ? undefined : '4px',
          animation: active ? `wave-${i % 3} ${0.9 + i * 0.07}s ${i * 0.08}s infinite ease-in-out` : undefined,
        }} />
      ))}
    </div>
  );
}

export default function InterviewSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('resume');

  const [setupStep, setSetupStep]       = useState(1);
  const [aspirations, setAspirations]   = useState<AspirationOption | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);

  const [phase, setPhase]               = useState<Phase>(resumeId ? 'starting' : 'setup');
  const [session, setSession]           = useState<SessionState | null>(null);
  const [elapsedSec, setElapsedSec]     = useState(0);
  const [answerTimerSec, setAnswerTimerSec] = useState(0);
  const [violations, setViolations]     = useState(0);
  const [showViolationBanner, setShowViolationBanner] = useState(false);
  const [violationMsg, setViolationMsg] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const recognitionRef   = useRef<any>(null);
  const ttsUtteranceRef  = useRef<SpeechSynthesisUtterance | null>(null);
  const transcriptRef    = useRef('');
  const answerTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const globalTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaStreamRef   = useRef<MediaStream | null>(null);
  const cameraStreamRef  = useRef<MediaStream | null>(null);
  const videoRef         = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState('');
  const phaseRef         = useRef<Phase>('setup');
  const sessionRef       = useRef<SessionState | null>(null);
  const violationsRef    = useRef(0);
  const autoSubmitRef    = useRef<(() => void) | null>(null);
  const selectedLangRef  = useRef(selectedLang);

  phaseRef.current      = phase;
  sessionRef.current    = session;
  violationsRef.current = violations;
  selectedLangRef.current = selectedLang;

  useEffect(() => {
    api.get('/student/interview/aspirations').then(res => {
      const data: AspirationOption = res.data?.data;
      setAspirations(data ?? { roles: [], skills: [], experienceLevel: 'Fresher' });
      if (data?.roles?.length) setSelectedRole(data.roles[0]);
    }).catch(() => {
      setAspirations({ roles: [], skills: [], experienceLevel: 'Fresher' });
    });
  }, []);

  useEffect(() => {
    globalTimerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => { if (globalTimerRef.current) clearInterval(globalTimerRef.current); };
  }, []);

  useEffect(() => {
    const onVis = () => { if (document.hidden && phaseRef.current === 'listening') triggerViolation('Tab switch detected.'); };
    const onBlur = () => { if (phaseRef.current === 'listening') triggerViolation('Window focus lost — flagged.'); };
    const onFs = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && phaseRef.current === 'listening') triggerViolation('Fullscreen exited — flagged.');
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, []);

  useEffect(() => { return () => {
    stopAudio(); stopListening();
    if (globalTimerRef.current) clearInterval(globalTimerRef.current);
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
  }; }, []);

  // Open camera when interview starts, close when done/exited
  useEffect(() => {
    if (phase === 'setup') return;
    if (phase === 'done') {
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
      return;
    }
    if (cameraStreamRef.current) return; // already open
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera requires HTTPS');
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => setCameraError('Camera unavailable'));
  }, [phase]);

  const triggerViolation = (msg: string) => {
    setViolations(v => v + 1); setViolationMsg(msg);
    setShowViolationBanner(true);
    setTimeout(() => setShowViolationBanner(false), 5000);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const requestFullscreen = () => document.documentElement.requestFullscreen?.().catch(() => {});

  const pickVoice = (lang: string): SpeechSynthesisVoice | null => {
    const all = window.speechSynthesis.getVoices();
    const preferred = PREFERRED_VOICES[lang] ?? PREFERRED_VOICES['English'];
    for (const name of preferred) { const v = all.find(v => v.name.includes(name) || v.lang === name); if (v) return v; }
    const code = lang === 'Hindi' ? 'hi' : 'en';
    return all.find(v => v.lang.startsWith(code)) ?? (all[0] ?? null);
  };

  const stopAudio = () => { window.speechSynthesis.cancel(); ttsUtteranceRef.current = null; };

  const speakQuestion = useCallback((text: string, onDone: () => void) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88; utterance.pitch = 1;
    utterance.lang = selectedLangRef.current.code;
    const voice = pickVoice(selectedLangRef.current.label);
    if (voice) utterance.voice = voice;
    utterance.onend = () => { ttsUtteranceRef.current = null; onDone(); };
    utterance.onerror = () => { ttsUtteranceRef.current = null; onDone(); };
    ttsUtteranceRef.current = utterance;
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => { const v = pickVoice(selectedLangRef.current.label); if (v) utterance.voice = v; window.speechSynthesis.speak(utterance); };
    } else { window.speechSynthesis.speak(utterance); }
  }, []);

  const stopListening = () => {
    recognitionRef.current?.stop(); recognitionRef.current = null;
    if (answerTimerRef.current) { clearInterval(answerTimerRef.current); answerTimerRef.current = null; }
    mediaStreamRef.current?.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null;
  };

  const doSubmit = useCallback(async () => {
    if (phaseRef.current !== 'listening') return;
    stopListening(); setPhase('processing');
    const transcript = transcriptRef.current.trim() || '(No answer given)';
    const cur = sessionRef.current; if (!cur) return;
    try {
      const res = await api.post(`/student/interview/${cur.sessionId}/answer`, { questionId: cur.questionId, transcript, violationCount: violationsRef.current });
      const data = res.data.data;
      if (data.isComplete) {
        setPhase('done');
        await speakQuestion('Well done! You have completed the interview. Your detailed report is being prepared.', () => {});
        setTimeout(() => navigate(`/student/interview/${cur.sessionId}/report`), 4500);
        return;
      }
      const next: SessionState = { sessionId: cur.sessionId, questionId: data.questionId, questionText: data.questionText, topicArea: data.topicArea, questionNumber: data.questionNumber, targetRole: cur.targetRole };
      setSession(next); setLiveTranscript(''); setPhase('ai_speaking');
      speakQuestion(data.questionText, () => startListening());
    } catch { setPhase('listening'); startListening(); }
  }, [speakQuestion, navigate]);

  useEffect(() => { autoSubmitRef.current = doSubmit; }, [doSubmit]);

  const startListening = useCallback(async () => {
    transcriptRef.current = '';
    setLiveTranscript(''); setAnswerTimerSec(0);
    if (!navigator.mediaDevices?.getUserMedia) {
      triggerViolation('Microphone requires HTTPS. Please access via HTTPS or localhost.');
      return;
    }
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaStreamRef.current = stream; }
    catch { triggerViolation('Microphone access denied.'); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { triggerViolation('Speech recognition not supported. Use Chrome.'); return; }
    const recognition = new SR();
    recognition.continuous = true; recognition.interimResults = true;
    recognition.lang = selectedLangRef.current.code;
    recognition.onresult = (e: any) => {
      let final = ''; let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      if (final) transcriptRef.current += final;
      setLiveTranscript(transcriptRef.current + interim);
    };
    recognition.onerror = () => {};
    recognition.start(); recognitionRef.current = recognition;
    answerTimerRef.current = setInterval(() => {
      setAnswerTimerSec(s => {
        if (s + 1 >= MAX_ANSWER_SEC) { clearInterval(answerTimerRef.current!); autoSubmitRef.current?.(); }
        return s + 1;
      });
    }, 1000);
    setPhase('listening');
  }, []);

  useEffect(() => {
    if (!resumeId) return;
    const resume = async () => {
      requestFullscreen(); setPhase('starting');
      try {
        const res = await api.get(`/student/interview/${resumeId}/resume`);
        const data = res.data.data;
        const lang = LANGUAGES.find(l => l.label === data.language) ?? LANGUAGES[0];
        setSelectedLang(lang); selectedLangRef.current = lang;
        const s: SessionState = { sessionId: data.sessionId, questionId: data.questionId, questionText: data.questionText, topicArea: data.topicArea, questionNumber: data.questionNumber, targetRole: data.targetRole };
        setSession(s); setPhase('ai_speaking');
        speakQuestion(data.questionText, () => startListening());
      } catch { navigate('/student/interview'); }
    };
    resume();
  }, [resumeId]);

  const beginInterview = async () => {
    requestFullscreen(); setPhase('starting');
    try {
      const res = await api.post('/student/interview/start', { selectedRole, language: selectedLang.label });
      const data = res.data.data;
      const s: SessionState = { sessionId: data.sessionId, questionId: data.questionId, questionText: data.questionText, topicArea: data.topicArea, questionNumber: data.questionNumber, targetRole: data.targetRole };
      setSession(s); setPhase('ai_speaking');
      speakQuestion(data.questionText, () => startListening());
    } catch { setPhase('setup'); setSetupStep(1); }
  };

  const topic = TOPIC_META[session?.topicArea ?? 'TECHNICAL_SKILLS'] ?? TOPIC_META.TECHNICAL_SKILLS;
  const answerPct = Math.min(100, (answerTimerSec / MAX_ANSWER_SEC) * 100);
  const timeLeft = MAX_ANSWER_SEC - answerTimerSec;

  /* ────────────────────────────────────────────
     SETUP SCREEN
  ──────────────────────────────────────────── */
  if (phase === 'setup' && !resumeId) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* Brand bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: PRIMARY }}>AI Mock Interview</span>
        </div>

        {/* Step pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          {['Interview Setup', 'Rules & Start'].map((label, i) => {
            const n = i + 1; const active = setupStep === n; const done = setupStep > n;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 16px', borderRadius: '100px', background: done ? '#DCFCE7' : active ? PRIMARY : '#fff', border: `1px solid ${done ? '#86EFAC' : active ? PRIMARY : BORDER}`, fontSize: '12px', fontWeight: 600, color: done ? '#15803D' : active ? '#fff' : SUB }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: done ? '#22C55E' : active ? 'rgba(255,255,255,0.25)' : BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: done ? '#fff' : active ? '#fff' : SUB, flexShrink: 0 }}>
                    {done ? '✓' : n}
                  </span>
                  {label}
                </div>
                {i === 0 && <div style={{ width: '28px', height: '1px', background: BORDER }} />}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '36px 32px', width: '100%', maxWidth: '540px', boxShadow: '0 4px 24px rgba(63,65,209,0.08)' }}>

          {/* ── Step 1 ── */}
          {setupStep === 1 && (
            <>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: TEXT }}>Interview Setup</h2>
              <p style={{ margin: '0 0 28px', color: SUB, fontSize: '14px' }}>Choose the role and language for your interview.</p>

              {/* Role selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: TEXT, display: 'block', marginBottom: '10px' }}>
                  Select Role <span style={{ fontWeight: 400, color: SUB }}>(from your saved aspirations)</span>
                </label>
                {!aspirations ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: SUB, fontSize: '13px', padding: '14px' }}>
                    <Loader2 size={16} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} /> Loading aspirations…
                  </div>
                ) : aspirations.roles.length === 0 ? (
                  <div style={{ padding: '16px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={16} color="#EF4444" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>No aspirations saved</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#7F1D1D', lineHeight: 1.6 }}>
                      You haven't added any target roles yet. The AI will conduct a generic interview without context about your goals.
                    </p>
                    <button onClick={() => navigate('/student/aspirations')}
                      style={{ alignSelf: 'flex-start', marginTop: '4px', padding: '7px 16px', borderRadius: '100px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                      Add Aspirations First →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {aspirations.roles.map(role => (
                      <button key={role} type="button" onClick={() => setSelectedRole(role)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderRadius: '12px', border: `${selectedRole === role ? '2px' : '1px'} solid ${selectedRole === role ? PRIMARY : BORDER}`, background: selectedRole === role ? '#EEEEFF' : '#FAFAFA', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${selectedRole === role ? PRIMARY : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {selectedRole === role && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PRIMARY }} />}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: selectedRole === role ? 600 : 400, color: TEXT }}>{role}</span>
                      </button>
                    ))}
                  </div>
                )}
                {aspirations && aspirations.roles.length > 0 && (
                  <p style={{ margin: '10px 0 0', fontSize: '12px', color: SUB }}>
                    Level: {aspirations.experienceLevel} · Skills: {aspirations.skills.slice(0, 4).join(', ')}{aspirations.skills.length > 4 ? ` +${aspirations.skills.length - 4} more` : ''}
                  </p>
                )}
              </div>

              {/* Language */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: TEXT, display: 'block', marginBottom: '10px' }}>Interview Language</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {LANGUAGES.map(lang => (
                    <button key={lang.code} type="button" onClick={() => setSelectedLang(lang)}
                      style={{ padding: '14px 16px', borderRadius: '12px', border: `${selectedLang.code === lang.code ? '2px' : '1px'} solid ${selectedLang.code === lang.code ? PRIMARY : BORDER}`, background: selectedLang.code === lang.code ? '#EEEEFF' : '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '22px' }}>{lang.flag}</span>
                      <span style={{ fontSize: '14px', fontWeight: selectedLang.code === lang.code ? 700 : 400, color: TEXT }}>{lang.label}</span>
                      {selectedLang.code === lang.code && <span style={{ marginLeft: 'auto', fontSize: '11px', color: PRIMARY, fontWeight: 700 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setSetupStep(2)} disabled={!selectedRole || aspirations?.roles.length === 0}
                style={{ width: '100%', padding: '14px', borderRadius: '100px', border: 'none', background: (selectedRole && aspirations?.roles.length !== 0) ? PRIMARY : BORDER, color: (selectedRole && aspirations?.roles.length !== 0) ? '#fff' : SUB, fontSize: '15px', fontWeight: 700, cursor: (selectedRole && aspirations?.roles.length !== 0) ? 'pointer' : 'not-allowed', boxShadow: (selectedRole && aspirations?.roles.length !== 0) ? '0 4px 16px rgba(63,65,209,0.3)' : 'none' }}>
                Next: Rules & Start →
              </button>

              <button onClick={() => navigate('/student/interview')}
                style={{ marginTop: '12px', width: '100%', padding: '10px', border: 'none', background: 'transparent', color: SUB, fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
            </>
          )}

          {/* ── Step 2 ── */}
          {setupStep === 2 && (
            <>
              <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: TEXT }}>Ready to Begin?</h2>

              {/* Selected config pills */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <span style={{ padding: '5px 14px', borderRadius: '100px', background: '#EEEEFF', color: PRIMARY, fontSize: '12px', fontWeight: 600, border: `1px solid #C7C9F7` }}>🎯 {selectedRole}</span>
                <span style={{ padding: '5px 14px', borderRadius: '100px', background: '#F1F5F9', color: TEXT, fontSize: '12px', border: `1px solid ${BORDER}` }}>{selectedLang.flag} {selectedLang.label}</span>
              </div>

              {/* Rules card */}
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#B91C1C' }}>⚠️ Interview Rules — Please Read</p>
                <ul style={{ margin: 0, padding: '0 0 0 18px', color: '#7F1D1D', fontSize: '13px', lineHeight: 2 }}>
                  <li>Be in a quiet place before taking the interview</li>
                  <li>Do not switch tabs or open other windows</li>
                  <li>Do not exit fullscreen during the interview</li>
                  <li>Speak clearly — your answers are recorded and evaluated</li>
                  <li>Each question has a 3-minute time limit</li>
                  <li>Click "Next Question" when you're ready to submit your answer</li>
                  <li>All violations are logged in your final report</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setSetupStep(1)}
                  style={{ flex: 1, padding: '14px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  ← Back
                </button>
                <button onClick={beginInterview}
                  style={{ flex: 2, padding: '14px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(63,65,209,0.3)' }}>
                  <Mic size={18} /> Start Interview
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────
     LIVE INTERVIEW SCREEN
  ──────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes bounce      { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes pulse-ring  { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(1.3);opacity:0} }
        @keyframes slideDown   { from{transform:translateY(-100%)} to{transform:translateY(0)} }
        @keyframes wave-0      { 0%,100%{height:6px} 50%{height:26px} }
        @keyframes wave-1      { 0%,100%{height:10px} 50%{height:34px} }
        @keyframes wave-2      { 0%,100%{height:4px} 50%{height:20px} }
      `}</style>

      {/* Violation banner */}
      {showViolationBanner && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#DC2626', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 9999, animation: 'slideDown .3s ease' }}>
          <AlertTriangle size={16} color="#fff" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{violationMsg}</span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>Violation #{violations} recorded</span>
        </div>
      )}

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrainCircuit size={18} color="#fff" />
          </div>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: TEXT }}>AI Mock Interview</span>
            {session && <span style={{ fontSize: '12px', color: SUB, marginLeft: '8px' }}>— {session.targetRole}</span>}
          </div>
          {session && (
            <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: topic.color, background: topic.bg }}>
              {topic.label}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {violations > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '100px', background: '#FEF2F2', border: '1px solid #FCA5A5', fontSize: '12px', fontWeight: 600, color: '#B91C1C' }}>
              <AlertTriangle size={12} /> {violations} violation{violations > 1 ? 's' : ''}
            </span>
          )}
          <span style={{ padding: '5px 14px', borderRadius: '100px', background: '#F1F5F9', border: `1px solid ${BORDER}`, fontSize: '12px', fontWeight: 700, color: TEXT, fontVariantNumeric: 'tabular-nums' }}>
            ⏱ {formatTime(elapsedSec)}
          </span>
          {!isFullscreen && (
            <button onClick={requestFullscreen}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <Maximize2 size={13} /> Fullscreen
            </button>
          )}
          <button onClick={() => { stopAudio(); setShowExitConfirm(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 16px', borderRadius: '100px', border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            <X size={13} /> End Interview
          </button>
        </div>
      </div>

      {/* Exit confirmation */}
      {showExitConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '20px', padding: '32px 28px', maxWidth: '380px', width: '90%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <X size={28} color="#EF4444" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: TEXT }}>End Interview?</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: SUB, lineHeight: 1.6 }}>
              {session?.questionNumber && session.questionNumber > 1
                ? 'A report will be generated based on the questions you\'ve answered so far.'
                : 'Your progress will be saved but no report will be generated. You can resume this interview later.'}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowExitConfirm(false); if (session?.questionText) speakQuestion(session.questionText, () => {}); }}
                style={{ flex: 1, padding: '12px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: TEXT, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Continue
              </button>
              <button onClick={async () => {
                  stopAudio(); stopListening();
                  const hasAnswered = !!(session?.questionNumber && session.questionNumber > 1);
                  if (session) { try { await api.post(`/student/interview/${session.sessionId}/abandon`); } catch { /* best-effort */ } }
                  if (hasAnswered && session) {
                    navigate(`/student/interview/${session.sessionId}/report`);
                  } else {
                    navigate('/student/interview');
                  }
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '100px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera preview — fixed bottom-right */}
      {phase !== 'setup' && phase !== 'done' && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 8000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '180px', height: '135px', borderRadius: '14px', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', background: '#1E293B', position: 'relative' }}>
            {cameraError ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#94A3B8', fontSize: '11px', textAlign: 'center', padding: '8px' }}>
                <span style={{ fontSize: '24px' }}>📷</span>
                {cameraError}
              </div>
            ) : (
              <video ref={el => {
                (videoRef as any).current = el;
                if (el && cameraStreamRef.current && !el.srcObject) {
                  el.srcObject = cameraStreamRef.current;
                  el.play().catch(() => {});
                }
              }} muted autoPlay playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            )}
            {/* Live indicator */}
            {!cameraError && (
              <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.55)', borderRadius: '100px', padding: '3px 8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', animation: 'pulse-ring 1.5s infinite' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>LIVE</span>
              </div>
            )}
          </div>
          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>You</span>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: '28px' }}>

        {/* Starting */}
        {phase === 'starting' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader2 size={48} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: SUB, fontSize: '15px', margin: 0 }}>Preparing your personalised interview…</p>
          </div>
        )}

        {/* AI Speaking */}
        {phase === 'ai_speaking' && session && (
          <div style={{ textAlign: 'center', maxWidth: '640px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            {/* Interviewer avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY}, #7C3AED)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', boxShadow: `0 8px 32px rgba(63,65,209,0.35)` }}>🤖</div>
              <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: `2px solid ${PRIMARY}`, animation: 'pulse-ring 1.5s infinite' }} />
            </div>

            {/* Question card */}
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px 28px', width: '100%', boxShadow: '0 2px 16px rgba(63,65,209,0.07)' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', letterSpacing: '1.5px', color: PRIMARY, textTransform: 'uppercase', fontWeight: 700 }}>Question {session.questionNumber}</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: TEXT, lineHeight: 1.55 }}>{session.questionText}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: SUB, fontSize: '13px' }}>
              <Waveform active color={PRIMARY} /><span>Interviewer is speaking…</span><Waveform active color={PRIMARY} />
            </div>
          </div>
        )}

        {/* Listening */}
        {phase === 'listening' && session && (
          <div style={{ textAlign: 'center', maxWidth: '660px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            {/* Mic avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #16A34A, #22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(34,197,94,0.3)', fontSize: '40px' }}>🎙️</div>
              <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: '2px solid #22C55E', animation: 'pulse-ring 1s infinite' }} />
            </div>

            <div>
              <p style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#15803D' }}>Your turn to speak</p>
              <p style={{ margin: 0, fontSize: '14px', color: SUB }}>Speak your answer, then click "Next Question" when you're ready to move on</p>
            </div>

            <Waveform active color="#22C55E" />

            <button type="button" onClick={() => doSubmit()}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(63,65,209,0.3)' }}>
              Next Question →
            </button>

            {/* Question reminder */}
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '14px 18px', width: '100%', textAlign: 'left' }}>
              <p style={{ margin: '0 0 4px', fontSize: '10px', color: PRIMARY, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Current question</p>
              <p style={{ margin: 0, fontSize: '14px', color: TEXT, lineHeight: 1.55 }}>{session.questionText}</p>
            </div>

            {/* Live transcript */}
            <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', width: '100%' }}>
              <button type="button" onClick={() => setShowTranscript(t => !t)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, fontSize: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {showTranscript ? <Eye size={13} /> : <EyeOff size={13} />}
                  {showTranscript ? 'Hide live transcript' : 'Show live transcript'}
                </span>
                <span style={{ fontSize: '11px', color: '#A3A3A3' }}>your speech appears here</span>
              </button>
              {showTranscript && (
                <div style={{ padding: '12px 16px 16px', minHeight: '68px', fontSize: '14px', color: liveTranscript ? TEXT : '#A3A3A3', lineHeight: 1.6, textAlign: 'left', borderTop: `1px solid ${BORDER}`, background: '#FAFBFF' }}>
                  {liveTranscript || 'Listening…'}
                </div>
              )}
            </div>

            {/* Timer bar */}
            <div style={{ width: '100%', maxWidth: '420px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: SUB }}>Time remaining</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: answerPct > 75 ? '#EF4444' : TEXT }}>{formatTime(timeLeft)}</span>
              </div>
              <div style={{ height: '5px', background: BORDER, borderRadius: '3px' }}>
                <div style={{ height: '5px', borderRadius: '3px', background: answerPct > 75 ? '#EF4444' : '#22C55E', width: `${100 - answerPct}%`, transition: 'width 1s linear, background .3s' }} />
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '11px', color: '#A3A3A3', fontStyle: 'italic' }}>Switching tabs or exiting fullscreen will be flagged.</p>
          </div>
        )}

        {/* Processing */}
        {phase === 'processing' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY}, #7C3AED)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🤖</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[0,1,2].map(n => <div key={n} style={{ width: '10px', height: '10px', borderRadius: '50%', background: PRIMARY, animation: `bounce 1.2s ${n * .2}s infinite` }} />)}
            </div>
            <p style={{ margin: 0, color: SUB, fontSize: '14px' }}>Evaluating your answer…</p>
          </div>
        )}

        {/* Done */}
        {phase === 'done' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={44} color="#22C55E" />
            </div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: TEXT }}>Interview Complete!</h2>
            <p style={{ margin: 0, color: SUB, fontSize: '15px' }}>Generating your detailed report… redirecting shortly.</p>
            <Loader2 size={24} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}
      </div>
    </div>
  );
}
