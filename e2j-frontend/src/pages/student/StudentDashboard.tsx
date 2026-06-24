import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Briefcase, TrendingUp, BookOpen, Filter, ChevronDown, Users } from 'lucide-react';
import api from '../../services/api';

type DashTab = 'jobs' | 'students' | 'skillgap' | 'sme';

const card: React.CSSProperties = {
  background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '20px',
};

const DONUT_COLORS = ['#22C55E', '#4F46E5'];
const FUNNEL_COLORS = ['#4F46E5', '#6B7280', '#F59E0B', '#22C55E'];

export default function StudentDashboard() {
  const [tab, setTab] = useState<DashTab>('jobs');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [funnel, setFunnel] = useState<{ stage: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard')
      .then(r => {
        const d = r.data?.data ?? {};
        setStats(d);
        setFunnel(d.placementFunnel ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const jobStats = [
    { label: 'Jobs Applied',         value: stats.jobsApplied        ?? 0, icon: Briefcase,   bg: '#EEF2FF', color: '#4F46E5' },
    { label: 'Internships Applied',  value: stats.internshipsApplied ?? 0, icon: TrendingUp,  bg: '#F0FDF4', color: '#16A34A' },
    { label: 'Offered',              value: stats.offered            ?? 0, icon: BookOpen,    bg: '#FAF5FF', color: '#7C3AED' },
  ];

  const donutData = [
    { name: 'Applied',   value: stats.jobsApplied ?? 0 },
    { name: 'Qualified', value: stats.offered     ?? 0 },
  ];

  const TABS: { key: DashTab; label: string }[] = [
    { key: 'jobs', label: 'Jobs' },
    { key: 'students', label: 'Students' },
    { key: 'skillgap', label: 'Skill Gap' },
    { key: 'sme', label: 'SME' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '12px', padding: '4px', gap: '2px' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '6px 20px', borderRadius: '8px', border: 'none',
              background: tab === t.key ? '#fff' : 'transparent',
              color: tab === t.key ? '#4F46E5' : '#64748B',
              fontSize: '13px', fontWeight: tab === t.key ? 600 : 400,
              cursor: 'pointer', boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[['Filter', <Filter size={13} />], ['Current Month', <ChevronDown size={13} />]].map(([label, icon], i) => (
            <button key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px',
              border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff',
              fontSize: '12px', color: '#64748B', cursor: 'pointer', fontWeight: 500,
            }}>
              {icon as React.ReactNode}{label as string}
            </button>
          ))}
        </div>
      </div>

      {tab === 'jobs' && (
        loading ? <p style={{ color: '#666', fontSize: 13 }}>Loading…</p> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              {jobStats.map(s => (
                <div key={s.label} style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <s.icon size={20} color={s.color} />
                    </div>
                  </div>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: '#1E293B', margin: '0 0 2px' }}>{s.value}</p>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              {/* Donut */}
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>Application Status</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <PieChart width={150} height={150}>
                    <Pie data={donutData} cx={70} cy={70} innerRadius={42} outerRadius={68} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                      {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    {donutData.map((d, i) => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748B' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: DONUT_COLORS[i] }} />
                        {d.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Funnel as bar chart */}
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>Applications</h3>
                {funnel.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={funnel} barSize={16}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                      <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p style={{ fontSize: 13, color: '#94A3B8' }}>No data yet.</p>}
              </div>

              {/* Recruitment Funnel */}
              <div style={card}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>Recruitment Funnel</h3>
                {funnel.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {funnel.map((f, i) => {
                      const pct = funnel[0].count > 0 ? Math.round((f.count / funnel[0].count) * 100) : 0;
                      return (
                        <div key={f.stage}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                            <span>{f.stage}</span><span style={{ fontWeight: 600, color: '#1E293B' }}>{f.count}</span>
                          </div>
                          <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: FUNNEL_COLORS[i % FUNNEL_COLORS.length], borderRadius: '4px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p style={{ fontSize: 13, color: '#94A3B8' }}>No data yet.</p>}
              </div>
            </div>
          </>
        )
      )}

      {tab !== 'jobs' && (
        <div style={{ ...card, padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center' }}>
          <Users size={40} color="#CBD5E1" strokeWidth={1.2} />
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Analytics for <strong>{tab}</strong> coming soon</p>
        </div>
      )}
    </div>
  );
}
