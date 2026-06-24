import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mic, CheckCircle, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Lightbulb, Loader } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';

const BAND_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  STRONG:     { color: '#15803D', bg: '#F0FDF4', border: '#86EFAC' },
  READY:      { color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD' },
  DEVELOPING: { color: '#92400E', bg: '#FFFBEB', border: '#FCD34D' },
  BEGINNER:   { color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5' },
};

const TOPIC_LABEL: Record<string, string> = {
  INTRODUCTION:     'Introduction',
  TECHNICAL_SKILLS: 'Technical Skills',
  BEHAVIOURAL:      'Behavioural',
  PROBLEM_SOLVING:  'Problem Solving',
  DOMAIN_KNOWLEDGE: 'Domain Knowledge',
  // legacy keys
  WARMUP: 'Introduction', TECHNICAL: 'Technical Skills',
  BEHAVIORAL: 'Behavioural', SITUATIONAL: 'Problem Solving', ROLE_SPECIFIC: 'Domain Knowledge',
};

const TOPIC_COLOR: Record<string, string> = {
  INTRODUCTION: '#8B5CF6', TECHNICAL_SKILLS: '#3F41D1', BEHAVIOURAL: '#0EA5E9',
  PROBLEM_SOLVING: '#F97316', DOMAIN_KNOWLEDGE: '#22C55E',
  WARMUP: '#8B5CF6', TECHNICAL: '#3F41D1', BEHAVIORAL: '#0EA5E9',
  SITUATIONAL: '#F97316', ROLE_SPECIFIC: '#22C55E',
};

interface Question {
  id: number; sequenceNumber: number; topicArea: string;
  questionText: string; studentAnswer: string;
  aiScore: number; aiFeedback: string; isFollowUp: boolean;
}

interface Report {
  sessionId: number; targetRole: string; experienceLevel: string; status: string;
  overallScore: number; readinessBand: string; reportSummary: string;
  strengths: string[]; improvements: string[];
  durationMinutes: number;
  topicScores: { topicArea: string; score: number; questionCount: number }[];
  questions: Question[];
  createdAt: string; violationCount: number;
}

function ScoreRing({ score }: { score: number }) {
  const r = 54; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#3F41D1' : score >= 40 ? '#F97316' : '#EF4444';
  return (
    <div style={{ position: 'relative', width: '140px', height: '140px' }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke={BORDER} strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '28px', fontWeight: 800, color }}>{score}%</span>
        <span style={{ fontSize: '11px', color: SUB, fontWeight: 500 }}>Score</span>
      </div>
    </div>
  );
}

function QuestionRow({ q, targetRole }: { q: Question; targetRole: string }) {
  const [open, setOpen] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<{ idealAnswer: string; keyPoints: string } | null>(null);
  const score = q.aiScore;
  const scoreColor = score >= 7 ? '#22C55E' : score >= 5 ? '#F97316' : '#EF4444';

  const fetchSuggestion = async () => {
    if (suggestion || loadingSuggestion) return;
    setLoadingSuggestion(true);
    try {
      const res = await api.post('/student/interview/question-suggestion', {
        questionText: q.questionText,
        studentAnswer: q.studentAnswer,
        targetRole,
      });
      setSuggestion(res.data?.data ?? null);
    } catch { /* silently fail */ }
    finally { setLoadingSuggestion(false); }
  };

  const handleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchSuggestion();
  };

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
      <button type="button" onClick={handleOpen}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: open ? '#FAFBFF' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EEEEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: PRIMARY, flexShrink: 0 }}>
          {String(q.sequenceNumber).padStart(2, '0')}
        </span>
        <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: TEXT, textAlign: 'left' }}>{q.questionText}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: scoreColor, flexShrink: 0 }}>{score}/10</span>
        {open ? <ChevronUp size={14} color={SUB} /> : <ChevronDown size={14} color={SUB} />}
      </button>
      {open && (
        <div style={{ padding: '16px', borderTop: `1px solid ${BORDER}`, background: '#FAFBFF', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Your answer */}
          <div>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Answer</p>
            <p style={{ margin: 0, fontSize: '13px', color: TEXT, lineHeight: 1.6, background: '#fff', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${BORDER}` }}>
              {q.studentAnswer || <span style={{ color: '#A3A3A3' }}>No answer recorded</span>}
            </p>
          </div>
          {/* AI feedback + score bar */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Feedback</p>
              <div style={{ flex: 1, height: '4px', background: BORDER, borderRadius: '2px' }}>
                <div style={{ height: '4px', borderRadius: '2px', background: scoreColor, width: `${score * 10}%`, transition: 'width 0.8s ease' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: scoreColor }}>{score}/10</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: TEXT, lineHeight: 1.6 }}>{q.aiFeedback}</p>
          </div>
          {/* Ideal answer suggestion */}
          <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Lightbulb size={15} color="#7C3AED" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ideal Answer</span>
            </div>
            {loadingSuggestion ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: SUB, fontSize: '13px' }}>
                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating suggestion…
              </div>
            ) : suggestion ? (
              <>
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: TEXT, lineHeight: 1.6 }}>{suggestion.idealAnswer}</p>
                {suggestion.keyPoints && (
                  <div>
                    <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 600, color: '#7C3AED' }}>KEY POINTS TO COVER</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {suggestion.keyPoints.split('|').map((pt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                          <span style={{ fontSize: '13px', color: TEXT, lineHeight: 1.5 }}>{pt.trim()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: SUB }}>Could not load suggestion.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TopicSection({ t, questions, targetRole }: {
  t: { topicArea: string; score: number; questionCount: number };
  questions: Question[];
  targetRole: string;
}) {
  const [open, setOpen] = useState(false);
  const sc = t.score;
  const barColor = TOPIC_COLOR[t.topicArea] ?? PRIMARY;
  const scoreColor = sc >= 70 ? '#15803D' : sc >= 50 ? '#92400E' : '#B91C1C';
  const topicQs = questions.filter(q => q.topicArea === t.topicArea);

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '16px 20px', background: open ? '#FAFBFF' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: barColor, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: TEXT }}>{TOPIC_LABEL[t.topicArea] ?? t.topicArea}</span>
          <span style={{ fontSize: '12px', color: SUB, marginRight: '12px' }}>{t.questionCount} question{t.questionCount !== 1 ? 's' : ''}</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: scoreColor, minWidth: '46px', textAlign: 'right' }}>{sc}%</span>
          {open ? <ChevronUp size={14} color={SUB} /> : <ChevronDown size={14} color={SUB} />}
        </div>
        <div style={{ marginTop: '10px', height: '6px', background: BORDER, borderRadius: '3px' }}>
          <div style={{ height: '6px', borderRadius: '3px', background: barColor, width: `${sc}%`, transition: 'width 0.8s ease' }} />
        </div>
      </button>
      {open && topicQs.length > 0 && (
        <div style={{ padding: '16px', borderTop: `1px solid ${BORDER}`, background: '#FAFBFF' }}>
          {topicQs.map(q => <QuestionRow key={q.id} q={q} targetRole={targetRole} />)}
        </div>
      )}
    </div>
  );
}

export default function InterviewReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    api.get(`/student/interview/${sessionId}/report`)
      .then(res => setReport(res.data?.data ?? null))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await api.post(`/student/interview/${sessionId}/regenerate-report`);
      setReport(res.data?.data ?? null);
    } catch { /* keep existing */ }
    finally { setRegenerating(false); }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: SUB }}>Loading report…</div>;
  if (!report) return <div style={{ padding: '60px', textAlign: 'center', color: '#E6393E' }}>Report not found.</div>;

  const band = BAND_COLOR[report.readinessBand] ?? BAND_COLOR.DEVELOPING;
  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const vc = report.violationCount ?? 0;

  return (
    <div style={{ padding: '32px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/student/interview')}
          style={{ width: '38px', height: '38px', borderRadius: '50%', border: `1px solid ${BORDER}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={16} color={TEXT} />
        </button>
        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: '20px', fontWeight: 700, color: TEXT }}>Interview Report</h2>
          <p style={{ margin: 0, fontSize: '13px', color: SUB }}>{report.targetRole} · {formatDate(report.createdAt)}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleRegenerate} disabled={regenerating}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', height: '42px', borderRadius: '100px', border: `1px solid ${BORDER}`, background: '#fff', color: regenerating ? '#A3A3A3' : TEXT, fontSize: '13px', fontWeight: 600, cursor: regenerating ? 'not-allowed' : 'pointer' }}>
            <RefreshCw size={14} style={{ animation: regenerating ? 'spin 1s linear infinite' : undefined }} />
            {regenerating ? 'Regenerating…' : 'Regenerate Report'}
          </button>
          <button onClick={() => navigate('/student/interview/session')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px', height: '42px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <Mic size={15} /> Retake Interview
          </button>
        </div>
      </div>

      {/* Row 1: Score ring + Topic Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px', marginBottom: '20px', alignItems: 'start' }}>
        {/* Score ring + band */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <ScoreRing score={report.overallScore} />
          <div style={{ textAlign: 'center' }}>
            <span style={{ padding: '5px 18px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, color: band.color, background: band.bg, border: `1px solid ${band.border}` }}>
              {report.readinessBand}
            </span>
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: SUB }}>Overall Readiness</p>
          </div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: `1px solid ${BORDER}` }}>
            {[
              { label: 'Questions', value: report.questions.length },
              { label: 'Duration', value: `${report.durationMinutes ?? '—'} min` },
              { label: 'Level', value: report.experienceLevel || '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: SUB }}>{label}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: TEXT }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Breakdown — clickable bars */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 700, color: TEXT }}>Topic Breakdown</h4>
          <p style={{ margin: '0 0 16px', fontSize: '12px', color: SUB }}>Click any topic to see per-question breakdown and ideal answers</p>
          {report.topicScores.length === 0
            ? <p style={{ fontSize: '13px', color: SUB }}>No topic data available.</p>
            : report.topicScores.map(t => (
              <TopicSection key={t.topicArea} t={t} questions={report.questions} targetRole={report.targetRole} />
            ))
          }
        </div>
      </div>

      {/* Row 2: Interview Summary */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: TEXT }}>Interview Summary</h4>
        <p style={{ margin: 0, fontSize: '13px', color: TEXT, lineHeight: 1.8 }}>{report.reportSummary}</p>
      </div>

      {/* Row 3: Strengths + Improvements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <CheckCircle size={18} color="#22C55E" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: TEXT }}>Strengths</h4>
          </div>
          {report.strengths.length === 0
            ? <p style={{ margin: 0, fontSize: '13px', color: SUB }}>No data yet.</p>
            : report.strengths.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                <span style={{ fontSize: '13px', color: TEXT, lineHeight: 1.5 }}>{s}</span>
              </div>
            ))
          }
        </div>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <AlertCircle size={18} color="#F97316" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: TEXT }}>Areas to Improve</h4>
          </div>
          {report.improvements.length === 0
            ? <p style={{ margin: 0, fontSize: '13px', color: SUB }}>No data yet.</p>
            : report.improvements.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                <span style={{ fontSize: '13px', color: TEXT, lineHeight: 1.5 }}>{s}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Row 4: Proctoring */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: vc === 0 ? '#F0FDF4' : vc <= 2 ? '#FFFBEB' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              {vc === 0 ? '✅' : vc <= 2 ? '⚠️' : '🚨'}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: TEXT }}>Proctoring Report</h4>
              <p style={{ margin: 0, fontSize: '12px', color: SUB }}>Tab switches, window blur, and fullscreen exits during the interview</p>
            </div>
          </div>
          <span style={{ padding: '6px 20px', borderRadius: '100px', fontSize: '14px', fontWeight: 700,
            color: vc === 0 ? '#15803D' : vc <= 2 ? '#92400E' : '#B91C1C',
            background: vc === 0 ? '#DCFCE7' : vc <= 2 ? '#FEF3C7' : '#FEE2E2',
            border: `1px solid ${vc === 0 ? '#86EFAC' : vc <= 2 ? '#FCD34D' : '#FCA5A5'}` }}>
            {vc} violation{vc !== 1 ? 's' : ''} detected
          </span>
        </div>
        <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '10px', background: vc === 0 ? '#F0FDF4' : vc <= 2 ? '#FFFBEB' : '#FEF2F2' }}>
          <p style={{ margin: 0, fontSize: '13px', color: TEXT, lineHeight: 1.6 }}>
            {vc === 0
              ? 'Excellent integrity. No suspicious activity was detected during this interview.'
              : vc <= 2
              ? `${vc} minor violation(s) detected. Could be accidental tab switches or window movements.`
              : `${vc} violations detected — tab switches, window blur, or fullscreen exits. This raises concerns about interview integrity.`}
          </p>
        </div>
      </div>
    </div>
  );
}
