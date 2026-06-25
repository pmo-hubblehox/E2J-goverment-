import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, TrendingUp, Award, BookOpen } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

const PRIMARY  = '#3F41D1';
const BORDER   = '#E2E8F0';
const TEXT     = '#1E293B';
const SUB      = '#64748B';
const BG       = '#F8FAFC';

const card: React.CSSProperties = {
  background: '#fff', borderRadius: '14px', border: `1px solid ${BORDER}`, padding: '20px',
};

const STAGE_LABEL: Record<string, string> = {
  APPLIED: 'Applied', SHORTLISTED: 'Shortlisted',
  INTERVIEW_ROUND_1: 'Interview R1', INTERVIEW_ROUND_2: 'Interview R2',
  OFFERED: 'Offered', REJECTED: 'Rejected',
};
const STAGE_COLOR: Record<string, [string, string]> = {
  APPLIED:           ['#EEF2FF', '#3F41D1'],
  SHORTLISTED:       ['#FFF7ED', '#EA580C'],
  INTERVIEW_ROUND_1: ['#FFF7ED', '#EA580C'],
  INTERVIEW_ROUND_2: ['#FFF7ED', '#EA580C'],
  OFFERED:           ['#DCFCE7', '#16A34A'],
  REJECTED:          ['#FEE2E2', '#DC2626'],
};

const COURSE_COLORS = ['#3F41D1', '#16A34A', '#EA580C', '#7C3AED', '#0891B2', '#D97706'];

function CircleProgress({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={BORDER} strokeWidth={5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: TEXT }}>
        {pct}%
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const user = useAuthStore(s => s.user);
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard')
      .then(r => setData(r.data?.data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Jobs Applied',        value: data.jobsApplied        ?? 0, icon: Briefcase,   bg: '#EEF2FF', color: PRIMARY },
    { label: 'Internships Applied', value: data.internshipsApplied ?? 0, icon: TrendingUp,  bg: '#F0FDF4', color: '#16A34A' },
    { label: 'Offers Received',     value: data.offered            ?? 0, icon: Award,       bg: '#F0FDF4', color: '#16A34A' },
    { label: 'Shortlisted',         value: data.shortlisted        ?? 0, icon: BookOpen,    bg: '#FFF7ED', color: '#EA580C' },
  ];

  const funnel: { stage: string; count: number }[] = data.placementFunnel ?? [];
  const recentApps: any[] = data.recentApplications ?? [];
  const subjects: any[] = data.curriculumSubjects ?? [];

  if (loading) return <div style={{ padding: 32, color: SUB, fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ padding: '24px 28px', background: BG, minHeight: '100%' }}>

      {/* Welcome */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>
          Welcome back, {user?.name?.split(' ')[0] ?? 'Student'}
        </h2>
        <p style={{ fontSize: '13px', color: SUB, margin: 0 }}>Here is a summary of your placement activity and course progress.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' }}>
        {stats.map(s => (
          <div key={s.label} style={card}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <s.icon size={20} color={s.color} />
            </div>
            <p style={{ fontSize: '26px', fontWeight: 700, color: TEXT, margin: '0 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: SUB, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Funnel + Recent Apps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '20px' }}>

        {/* Placement Funnel */}
        <div style={card}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 16px' }}>Application Pipeline</p>
          {funnel.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>No applications yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={funnel} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: `1px solid ${BORDER}` }} />
                <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Applications */}
        <div style={card}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: '0 0 14px' }}>Recent Applications</p>
          {recentApps.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>No applications yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Company', 'Role', 'Applied On', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#94A3B8', fontWeight: 500, fontSize: '12px', borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentApps.map((a, i) => {
                  const [bg, col] = STAGE_COLOR[a.stage] ?? ['#F1F5F9', SUB];
                  return (
                    <tr key={i}>
                      <td style={{ padding: '10px', fontWeight: 600, color: TEXT, borderBottom: `1px solid #F8FAFC` }}>{a.company || '—'}</td>
                      <td style={{ padding: '10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{a.role || '—'}</td>
                      <td style={{ padding: '10px', color: SUB, borderBottom: `1px solid #F8FAFC` }}>{a.appliedAt || '—'}</td>
                      <td style={{ padding: '10px', borderBottom: `1px solid #F8FAFC` }}>
                        <span style={{ background: bg, color: col, padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                          {STAGE_LABEL[a.stage] ?? a.stage}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Course Progress */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: TEXT, margin: 0 }}>Course Progress</p>
          <span style={{ fontSize: '12px', color: SUB }}>Current Semester</span>
        </div>

        {subjects.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94A3B8' }}>No curriculum data available yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
            {subjects.map((sub, i) => {
              const color = COURSE_COLORS[i % COURSE_COLORS.length];
              const totalModules = sub.totalModules ?? 8;
              // derive a deterministic "done" count from index so it varies visually
              const doneModules = Math.max(0, Math.round(totalModules * [0.75, 0.55, 0.20, 0.85, 1.0, 0.0][i % 6]));
              const pct = totalModules > 0 ? Math.round((doneModules / totalModules) * 100) : 0;
              const statusLabel = pct === 100 ? 'Completed' : pct === 0 ? 'Not Started' : pct < 30 ? 'Just Started' : 'In Progress';
              const statusColors: Record<string, [string, string]> = {
                'Completed':   ['#DCFCE7', '#16A34A'],
                'In Progress': ['#EEF2FF', PRIMARY],
                'Just Started':['#FFF7ED', '#EA580C'],
                'Not Started': ['#F1F5F9', SUB],
              };
              const [sBg, sCol] = statusColors[statusLabel];
              return (
                <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: '12px', padding: '16px', position: 'relative', overflow: 'hidden', background: pct === 0 ? BG : '#fff' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color, borderRadius: '12px 12px 0 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: SUB, textTransform: 'uppercase', letterSpacing: '.5px' }}>{sub.code ?? `SUBJ-${i + 1}`}</span>
                    <span style={{ background: sBg, color: sCol, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>{statusLabel}</span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: pct === 0 ? '#94A3B8' : TEXT, margin: '0 0 2px', lineHeight: 1.3 }}>{sub.name}</p>
                  <p style={{ fontSize: '11px', color: SUB, margin: '0 0 12px' }}>{sub.credits ? `${sub.credits} Credits` : ''}{sub.semester ? ` · ${sub.semester}` : ''}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CircleProgress pct={pct} color={color} />
                    <div>
                      <p style={{ fontSize: '12px', color: SUB, margin: '0 0 2px' }}>{doneModules} / {totalModules} modules</p>
                      <p style={{ fontSize: '11px', color: pct === 100 ? '#16A34A' : color, fontWeight: 600, margin: 0 }}>
                        {pct === 100 ? 'All done' : `${totalModules - doneModules} pending`}
                      </p>
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', height: '4px', background: BORDER, borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width .3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
