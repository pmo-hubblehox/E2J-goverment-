import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Clock, Trophy, ChevronRight, Play } from 'lucide-react';
import api from '../../services/api';

const PRIMARY = '#3F41D1';
const BORDER = '#E2E8F0';
const TEXT = '#212121';
const SUB = '#666666';

const BAND_STYLE: Record<string, { color: string; bg: string }> = {
  STRONG:     { color: '#15803D', bg: '#DCFCE7' },
  READY:      { color: '#1D4ED8', bg: '#DBEAFE' },
  DEVELOPING: { color: '#92400E', bg: '#FEF3C7' },
  BEGINNER:   { color: '#B91C1C', bg: '#FEE2E2' },
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  COMPLETED:   { color: '#15803D', bg: '#DCFCE7' },
  IN_PROGRESS: { color: '#1D4ED8', bg: '#DBEAFE' },
  ABANDONED:   { color: '#B91C1C', bg: '#FEE2E2' },
};

interface Session {
  id: number; targetRole: string; status: string;
  overallScore: number | null; readinessBand: string | null;
  durationMinutes: number | null; questionCount: number; createdAt: string;
}

export default function InterviewHistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/interview/sessions')
      .then(res => setSessions(res.data?.data ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: TEXT }}>AI Mock Interviews</h2>
          <p style={{ margin: 0, fontSize: '14px', color: SUB }}>Practice real interviews based on your aspiration and track your improvement.</p>
        </div>
        <button onClick={() => navigate('/student/interview/session')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 28px', height: '48px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(63,65,209,0.35)' }}>
          <Mic size={18} /> Start New Interview
        </button>
      </div>

      {/* Stats row */}
      {sessions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Sessions', value: sessions.length, icon: Mic, color: PRIMARY },
            { label: 'Completed', value: sessions.filter(s => s.status === 'COMPLETED').length, icon: Trophy, color: '#15803D' },
            { label: 'Best Score', value: Math.max(...sessions.filter(s => s.overallScore != null).map(s => s.overallScore!), 0) + '%', icon: Trophy, color: '#E91E8C' },
            { label: 'Avg Duration', value: sessions.filter(s => s.durationMinutes).length > 0 ? Math.round(sessions.filter(s => s.durationMinutes).reduce((a, s) => a + s.durationMinutes!, 0) / sessions.filter(s => s.durationMinutes).length) + ' min' : '—', icon: Clock, color: '#F97316' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: TEXT }}>{value}</div>
                <div style={{ fontSize: '12px', color: SUB }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sessions table / empty */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: SUB }}>Loading sessions…</div>
      ) : sessions.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EEEEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Mic size={36} color={PRIMARY} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: TEXT }}>No interviews yet</h3>
          <p style={{ margin: '0 0 24px', fontSize: '14px', color: SUB, maxWidth: '360px', lineHeight: 1.6, marginLeft: 'auto', marginRight: 'auto' }}>
            Start your first AI mock interview to see how ready you are for your dream role.
          </p>
          <button onClick={() => navigate('/student/interview/session')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0 32px', height: '48px', borderRadius: '100px', border: 'none', background: PRIMARY, color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
            <Play size={16} /> Start My First Interview
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, background: '#FAFAFA' }}>
                {['Date', 'Target Role', 'Questions', 'Duration', 'Score', 'Band', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: SUB }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const band = s.readinessBand ? (BAND_STYLE[s.readinessBand] ?? BAND_STYLE.BEGINNER) : null;
                const st = STATUS_STYLE[s.status] ?? STATUS_STYLE.COMPLETED;
                return (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${BORDER}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFF')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                    <td style={{ padding: '14px 16px', color: TEXT }}>{formatDate(s.createdAt)}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: TEXT }}>{s.targetRole}</td>
                    <td style={{ padding: '14px 16px', color: TEXT }}>{s.questionCount}</td>
                    <td style={{ padding: '14px 16px', color: TEXT }}>{s.durationMinutes ? `${s.durationMinutes} min` : '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {s.overallScore != null
                        ? <span style={{ fontWeight: 700, fontSize: '16px', color: s.overallScore >= 60 ? '#15803D' : s.overallScore >= 40 ? '#92400E' : '#B91C1C' }}>{s.overallScore}%</span>
                        : <span style={{ color: SUB }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {band && s.readinessBand
                        ? <span style={{ padding: '3px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: band.color, background: band.bg }}>{s.readinessBand}</span>
                        : <span style={{ color: SUB }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: st.color, background: st.bg }}>{s.status}</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {s.status === 'COMPLETED' ? (
                        <button onClick={() => navigate(`/student/interview/${s.id}/report`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '100px', border: `1px solid ${PRIMARY}`, background: '#fff', color: PRIMARY, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          View Report <ChevronRight size={12} />
                        </button>
                      ) : s.status === 'IN_PROGRESS' ? (
                        <button onClick={() => navigate(`/student/interview/session?resume=${s.id}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: '100px', border: 'none', background: '#1D4ED8', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          <Play size={11} /> Resume
                        </button>
                      ) : (
                        <span style={{ color: SUB, fontSize: '12px' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
